"""
PRVAAH X - ML FOUNDATION (DRAFT 1)
Master Training Entry Point

Executes the complete training workflow when invoked:
  1. Load raw datasets (5-minute demand & Open-Meteo weather)
  2. Validate raw data integrity
  3. Preprocess & aggregate demand to hourly resolution with gap handling
  4. Align hourly weather with demand
  5. Feature engineering (demand lags, rolling stats, cyclic time features, weather interactions)
  6. Chronological dataset splitting (70% Train, 15% Val, 15% Test)
  7. Leakage audit
  8. Baseline model evaluation (Previous hour, Previous day, Previous week)
  9. LightGBM model instantiation and fitting with early stopping
  10. Model evaluation (overall and per-horizon metrics)
  11. Peak demand magnitude and timing evaluation
  12. Feature importance & explainability
  13. Artifact serialization (model, metadata, metrics, predictions)

IMPORTANT:
In Draft 1 architecture implementation, this script is NOT executed.
It serves as the verified, complete training entry point for subsequent training phases.
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
    DEMAND_LAGS,
    ROLLING_FEATURES,
    ALL_MODEL_FEATURES,
    LIGHTGBM_PARAMS,
    EARLY_STOPPING_ROUNDS,
    RANDOM_SEED
)
from ml.data.loader import load_power_demand, load_weather_data
from ml.data.preprocessing import preprocess_and_align
from ml.data.validation import audit_raw_data, audit_data_and_splits
from ml.data.splitting import split_chronological, get_split_summary
from ml.features.engineering import create_hourly_base_features, build_multi_horizon_samples
from ml.models.baselines import evaluate_baselines
from ml.models.lightgbm_model import create_model, LightGBMForecaster
from ml.evaluation.metrics import evaluate_all_models
from ml.evaluation.peak_metrics import evaluate_peak_performance
from ml.explainability.feature_importance import extract_and_save_importance

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("train")


def set_seed(seed: int = RANDOM_SEED) -> None:
    """Sets random seeds for deterministic execution."""
    np.random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


def run_training_pipeline() -> None:
    """Complete end-to-end training and evaluation pipeline."""
    total_start = time.time()
    set_seed(RANDOM_SEED)

    logger.info("==================================================")
    logger.info("PRVAAH X - ML FOUNDATION (DRAFT 1) TRAINING")
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

    # 4. FEATURE ENGINEERING
    logger.info("STEP 4: Engineering demand lags, rolling features, and cyclic time features...")
    df_features = create_hourly_base_features(df_aligned)

    # 5. CHRONOLOGICAL SPLIT
    logger.info("STEP 5: Partitioning forecast origins chronologically (70% Train, 15% Val, 15% Test)...")
    origin_feature_cols = DEMAND_LAGS + ROLLING_FEATURES
    valid_origins = df_features.dropna(subset=origin_feature_cols)["timestamp"].reset_index(drop=True)
    train_origins, val_origins, test_origins = split_chronological(valid_origins)
    split_summary = get_split_summary(train_origins, val_origins, test_origins)

    # 6. BUILD MULTI-HORIZON TABULAR MATRICES
    logger.info("STEP 6: Generating multi-horizon tabular samples for horizons 1..24...")
    train_matrix = build_multi_horizon_samples(df_features, train_origins, require_target=True)
    val_matrix = build_multi_horizon_samples(df_features, val_origins, require_target=True)
    test_matrix = build_multi_horizon_samples(df_features, test_origins, require_target=True)

    # 7. LEAKAGE AUDIT
    logger.info("STEP 7: Performing strict Leakage Audit...")
    audit_summary = audit_data_and_splits(
        train_df=train_matrix,
        val_df=val_matrix,
        test_df=test_matrix,
        feature_cols=ALL_MODEL_FEATURES
    )

    # 8. TRAIN & EVALUATE BASELINES
    logger.info("STEP 8: Evaluating baseline forecasters on Test set...")
    df_base_overall, df_base_horizon = evaluate_baselines(test_matrix)

    # 9. TRAIN PRIMARY MODEL (LIGHTGBM)
    logger.info("STEP 9: Training LightGBM Multi-Horizon Regressor with Early Stopping...")
    lgbm_model = create_model(LIGHTGBM_PARAMS)
    
    # Fit with early stopping on validation split
    import lightgbm as lgb
    callbacks = [lgb.early_stopping(stopping_rounds=EARLY_STOPPING_ROUNDS, verbose=False)]
    lgbm_model.fit(
        train_matrix[ALL_MODEL_FEATURES],
        train_matrix["target"],
        eval_set=[(val_matrix[ALL_MODEL_FEATURES], val_matrix["target"])],
        eval_names=["val"],
        callbacks=callbacks
    )

    forecaster = LightGBMForecaster(
        model=lgbm_model,
        feature_names=ALL_MODEL_FEATURES,
        config=LIGHTGBM_PARAMS
    )
    forecaster.is_fitted = True

    # 10. GENERATE TEST PREDICTIONS
    logger.info("STEP 10: Generating predictions on unseen Test set...")
    test_preds = forecaster.predict(test_matrix)
    test_matrix["lgb_pred"] = test_preds

    # 11. EVALUATE ALL MODELS
    logger.info("STEP 11: Computing final evaluation metrics...")
    df_overall, df_horizon = evaluate_all_models(test_matrix, METRICS_DIR)

    # 12. EVALUATE PEAK DEMAND PERFORMANCE
    logger.info("STEP 12: Evaluating 24-hour peak demand magnitude and timing accuracy...")
    peak_summary, df_peaks = evaluate_peak_performance(test_matrix, pred_col="lgb_pred", metrics_dir=METRICS_DIR)

    # 13. FEATURE IMPORTANCE & EXPLAINABILITY
    logger.info("STEP 13: Extracting feature importance and explainability...")
    df_imp = extract_and_save_importance(forecaster, METRICS_DIR, X_sample=test_matrix)

    # 14. SAVE MODEL & METADATA
    logger.info("STEP 14: Saving model artifacts and metadata...")
    forecaster.save(MODELS_DIR)

    metadata = {
        "model_name": "PRVAAH X Delhi Electricity Demand Forecaster",
        "model_version": "0.1.0-draft1",
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model_architecture": "Global Multi-Horizon LightGBM Regressor",
        "forecast_horizon_hours": 24,
        "features": {
            "total_count": len(ALL_MODEL_FEATURES),
            "feature_list": ALL_MODEL_FEATURES
        },
        "splits": split_summary,
        "hyperparameters": LIGHTGBM_PARAMS,
        "metrics_overall": df_overall.to_dict(orient="records"),
        "peak_metrics": peak_summary,
        "leakage_audit": audit_summary
    }

    metadata_path = MODELS_DIR / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    # 15. SAVE TEST PREDICTIONS
    PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)
    pred_path = PREDICTIONS_DIR / "test_predictions.csv"
    save_cols = [
        "origin_timestamp", "target_timestamp", "forecast_horizon",
        "target", "base_prev_hour", "base_prev_day", "base_prev_week", "lgb_pred"
    ]
    test_matrix[save_cols].to_csv(pred_path, index=False)

    total_time = time.time() - total_start
    logger.info(f"Full pipeline completed in {total_time:.2f} seconds.")


if __name__ == "__main__":
    # DO NOT AUTO-RUN DURING FOUNDATION SETUP
    # To execute training in future phases, run: python backend/ml/train.py
    run_training_pipeline()
