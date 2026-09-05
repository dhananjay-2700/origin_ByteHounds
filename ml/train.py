"""
PRVAAH X - TIMESFM 2.5 & LIGHTGBM DEMAND FORECASTING ENGINE
Master Training Entry Point

Refactored architecture replacing tabular LightGBM as primary model with:
  1. Primary Model: google/timesfm-2.5-200m-transformers (168h Context -> 24h Forecast)
  2. LoRA / PEFT Parameter-Efficient Fine-Tuning (r=8, alpha=16)
  3. Benchmark Comparisons: Baselines vs LightGBM vs TimesFM Zero-Shot vs TimesFM LoRA Fine-Tuned
  4. Comprehensive metrics (Overall, Horizon H+1..H+24, Tail Top 10%/5%/1%, Peak Demand Magnitude & Timing)
  5. Automated high-resolution plot generation under ml/artifacts/plots/
"""

import os
import sys
import json
import time
import logging
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure backend/ml is importable
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir.parent))

from ml.config import (
    POWER_DEMAND_PATH,
    OPEN_METEO_PATH,
    MODELS_DIR,
    METRICS_DIR,
    PREDICTIONS_DIR,
    PLOTS_DIR,
    TIMESFM_MODEL_ID,
    CONTEXT_LENGTH,
    PREDICTION_LENGTH,
    TIMESFM_LORA_CONFIG,
    TIMESFM_TRAINING_CONFIG,
    DEMAND_LAGS,
    ROLLING_FEATURES,
    ALL_MODEL_FEATURES,
    LIGHTGBM_PARAMS,
    EARLY_STOPPING_ROUNDS,
    PEAK_WEIGHTING_CONFIG,
    RANDOM_SEED
)
from ml.data.loader import load_power_demand, load_weather_data
from ml.data.preprocessing import preprocess_and_align
from ml.data.validation import audit_raw_data, audit_data_and_splits, validate_timesfm_architecture
from ml.data.splitting import split_chronological, get_split_summary
from ml.data.windowing import build_timeseries_windows
from ml.features.engineering import (
    create_hourly_base_features,
    build_multi_horizon_samples,
    compute_peak_sample_weights
)
from ml.models.baselines import evaluate_baselines
from ml.models.lightgbm_model import create_model, LightGBMForecaster
from ml.models.timesfm_model import TimesFMForecaster, get_device
from ml.evaluation.metrics import evaluate_all_models
from ml.evaluation.peak_metrics import evaluate_peak_performance
from ml.evaluation.plots import generate_all_evaluation_plots
from ml.explainability.feature_importance import extract_and_save_importance

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("train_timesfm")


def set_seed(seed: int = RANDOM_SEED) -> None:
    """Sets random seeds for deterministic execution."""
    np.random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)
    try:
        import torch
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except Exception:
        pass


def run_training_pipeline() -> None:
    """Complete end-to-end TimesFM 2.5 training, fine-tuning, and evaluation pipeline."""
    total_start = time.time()
    set_seed(RANDOM_SEED)

    logger.info("==================================================")
    logger.info("PRVAAH X - TIMESFM 2.5 & LIGHTGBM TRAINING PIPELINE")
    logger.info("==================================================")

    # 1. LOAD RAW DATA
    logger.info("STEP 1: Loading raw datasets...")
    df_power = load_power_demand(POWER_DEMAND_PATH)
    df_weather = load_weather_data(OPEN_METEO_PATH)

    # 2. VALIDATE RAW DATA
    logger.info("STEP 2: Validating raw data integrity...")
    audit_raw_data(df_power, timestamp_col="datetime")
    audit_raw_data(df_weather, timestamp_col="timestamp")

    # 3. PREPROCESS & ALIGN WEATHER
    logger.info("STEP 3: Preprocessing and aligning weather with electricity demand...")
    df_aligned = preprocess_and_align(df_power, df_weather)

    # 4. FEATURE & WINDOW GENERATION
    logger.info("STEP 4: Engineering features and partitioning forecast origins chronologically...")
    df_features = create_hourly_base_features(df_aligned)

    origin_feature_cols = DEMAND_LAGS + ROLLING_FEATURES
    valid_origins = df_features.dropna(subset=origin_feature_cols)["timestamp"].reset_index(drop=True)
    train_origins, val_origins, test_origins = split_chronological(valid_origins)
    split_summary = get_split_summary(train_origins, val_origins, test_origins)

    # 5. BUILD TIMESERIES WINDOWS (168h Context -> 24h Forecast)
    logger.info("STEP 5: Constructing TimesFM 2.5 Time-Series Context Windows (168h -> 24h)...")
    train_windows = build_timeseries_windows(df_aligned, train_origins, context_len=CONTEXT_LENGTH, prediction_len=PREDICTION_LENGTH, stride_hours=6, require_target=True)
    val_windows = build_timeseries_windows(df_aligned, val_origins, context_len=CONTEXT_LENGTH, prediction_len=PREDICTION_LENGTH, stride_hours=6, require_target=True)
    test_windows = build_timeseries_windows(df_aligned, test_origins, context_len=CONTEXT_LENGTH, prediction_len=PREDICTION_LENGTH, stride_hours=6, require_target=True)

    # Tabular matrices for baselines and LightGBM benchmark comparison
    train_matrix = build_multi_horizon_samples(df_features, train_origins, require_target=True)
    val_matrix = build_multi_horizon_samples(df_features, val_origins, require_target=True)
    test_matrix = build_multi_horizon_samples(df_features, test_origins, require_target=True)

    # 6. LEAKAGE AUDIT
    logger.info("STEP 6: Performing strict Leakage Audit...")
    audit_summary = audit_data_and_splits(
        train_df=train_matrix,
        val_df=val_matrix,
        test_df=test_matrix,
        feature_cols=ALL_MODEL_FEATURES
    )

    # 7. EVALUATE BASELINES
    logger.info("STEP 7: Evaluating baseline forecasters on Test set...")
    df_base_overall, df_base_horizon = evaluate_baselines(test_matrix)

    # 8. TRAIN LIGHTGBM BENCHMARK MODEL
    logger.info("STEP 8: Fitting LightGBM Benchmark model for comparative evaluation...")
    train_weights, train_thresholds = compute_peak_sample_weights(train_matrix["target"], train_thresholds=None, config=PEAK_WEIGHTING_CONFIG)
    val_weights, _ = compute_peak_sample_weights(val_matrix["target"], train_thresholds=train_thresholds, config=PEAK_WEIGHTING_CONFIG)

    lgbm_model = create_model(LIGHTGBM_PARAMS)
    import lightgbm as lgb
    callbacks = [lgb.early_stopping(stopping_rounds=EARLY_STOPPING_ROUNDS, verbose=False)]
    lgbm_model.fit(
        train_matrix[ALL_MODEL_FEATURES],
        train_matrix["target"],
        sample_weight=train_weights if PEAK_WEIGHTING_CONFIG.get("enabled", True) else None,
        eval_set=[(val_matrix[ALL_MODEL_FEATURES], val_matrix["target"])],
        eval_sample_weight=[val_weights] if PEAK_WEIGHTING_CONFIG.get("enabled", True) else None,
        eval_names=["val"],
        callbacks=callbacks
    )
    lgb_forecaster = LightGBMForecaster(model=lgbm_model, feature_names=ALL_MODEL_FEATURES, config=LIGHTGBM_PARAMS)
    lgb_forecaster.is_fitted = True
    test_matrix["lgb_pred"] = lgb_forecaster.predict(test_matrix)

    # 9. TIMESFM 2.5 ZERO-SHOT EVALUATION
    logger.info("STEP 9: Evaluating TimesFM 2.5 Zero-Shot foundation model on Test windows...")
    timesfm = TimesFMForecaster(model_id=TIMESFM_MODEL_ID, context_len=CONTEXT_LENGTH, prediction_len=PREDICTION_LENGTH, lora_config=TIMESFM_LORA_CONFIG, training_config=TIMESFM_TRAINING_CONFIG)
    
    zeroshot_preds_2d = timesfm.predict_zero_shot(test_windows["x_context"])
    validate_timesfm_architecture(timesfm, check_lora=False)

    # Helper function for mapping 2D TimesFM predictions [N_windows, 24] to tabular format
    def map_2d_preds_to_df(preds_2d: np.ndarray, origin_timestamps: np.ndarray, col_name: str) -> pd.DataFrame:
        n_win, horizons = preds_2d.shape
        records = []
        for i in range(n_win):
            orig = origin_timestamps[i]
            for h in range(1, horizons + 1):
                records.append({
                    "origin_timestamp": orig,
                    "forecast_horizon": float(h),
                    col_name: float(preds_2d[i, h - 1])
                })
        return pd.DataFrame(records)

    df_zeroshot = map_2d_preds_to_df(zeroshot_preds_2d, test_windows["origin_timestamps"], "timesfm_zeroshot_pred")

    # 10. TIMESFM 2.5 LORA FINE-TUNING (PRIMARY MODEL)
    logger.info("STEP 10: Executing genuine PyTorch LoRA Fine-Tuning of TimesFM 2.5...")
    lora_history = timesfm.fit_lora(train_windows, val_windows)
    validate_timesfm_architecture(timesfm, check_lora=True)

    # 11. GENERATE TIMESFM LORA TEST PREDICTIONS
    logger.info("STEP 11: Generating predictions with TimesFM 2.5 LoRA Fine-Tuned model on Test windows...")
    lora_preds_2d = timesfm.predict_lora(test_windows["x_context"])
    df_lora = map_2d_preds_to_df(lora_preds_2d, test_windows["origin_timestamps"], "timesfm_lora_pred")

    # Merge TimesFM predictions into test_matrix and filter for 100% complete window alignment
    test_matrix = test_matrix.merge(df_zeroshot, on=["origin_timestamp", "forecast_horizon"], how="left")
    test_matrix = test_matrix.merge(df_lora, on=["origin_timestamp", "forecast_horizon"], how="left")
    test_matrix = test_matrix.dropna(subset=["timesfm_zeroshot_pred", "timesfm_lora_pred"]).reset_index(drop=True)
    test_matrix["predicted_demand_MW"] = test_matrix["timesfm_lora_pred"]

    # 12. COMPUTE ALL EVALUATION METRICS & COMPARISONS
    logger.info("STEP 12: Computing comprehensive model metrics (Overall, Horizons H+1..H+24, Tail Extremes, Peak Performance)...")
    df_overall, df_horizon = evaluate_all_models(test_matrix, METRICS_DIR)

    # Peak performance evaluation on primary model
    peak_summary, df_peaks = evaluate_peak_performance(test_matrix, pred_col="timesfm_lora_pred", metrics_dir=METRICS_DIR)

    # 13. GENERATE COMPARATIVE PLOTS
    logger.info("STEP 13: Generating comparative evaluation plots...")
    plot_paths = generate_all_evaluation_plots(test_matrix, PLOTS_DIR)

    # 14. SAVE MODEL & METADATA ARTIFACTS
    logger.info("STEP 14: Serializing TimesFM LoRA checkpoint and metadata...")
    timesfm.save(MODELS_DIR)

    metadata = {
        "model_name": "PRVAAH X Delhi Electricity Demand Forecaster (TimesFM 2.5 Primary)",
        "model_version": "2.5.0-lora",
        "primary_architecture": "google/timesfm-2.5-200m-transformers",
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "context_length_hours": CONTEXT_LENGTH,
        "forecast_horizon_hours": PREDICTION_LENGTH,
        "lora_parameters": TIMESFM_LORA_CONFIG,
        "training_summary": lora_history,
        "splits": split_summary,
        "metrics_overall": df_overall.to_dict(orient="records"),
        "peak_metrics": peak_summary,
        "leakage_audit": audit_summary,
        "plot_artifacts": {k: str(v) for k, v in plot_paths.items()}
    }

    metadata_path = MODELS_DIR / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    # 15. SAVE TEST PREDICTIONS
    PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)
    pred_path = PREDICTIONS_DIR / "test_predictions.csv"
    save_cols = [
        "origin_timestamp", "target_timestamp", "forecast_horizon",
        "target", "base_prev_hour", "base_prev_day", "base_prev_week",
        "lgb_pred", "timesfm_zeroshot_pred", "timesfm_lora_pred", "predicted_demand_MW"
    ]
    test_matrix[save_cols].to_csv(pred_path, index=False)

    total_time = time.time() - total_start
    logger.info("==================================================")
    logger.info(f"TIMESFM 2.5 PRIMARY PIPELINE COMPLETED IN {total_time:.2f} SECONDS")
    logger.info("==================================================")


if __name__ == "__main__":
    run_training_pipeline()
