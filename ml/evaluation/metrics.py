"""
Evaluation metrics computation for PRVAAH X electricity demand forecasting.
Calculates MAE, RMSE, WAPE, and MAPE overall and per horizon (1..24).
"""

import logging
from pathlib import Path
from typing import Dict, Tuple
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

logger = logging.getLogger(__name__)


def compute_forecast_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Computes standard power forecasting metrics:
      - MAE (Mean Absolute Error in MW)
      - RMSE (Root Mean Squared Error in MW)
      - WAPE (Weighted Absolute Percentage Error in %) = sum(|y - y_hat|) / sum(y) * 100
      - MAPE (Mean Absolute Percentage Error in %)
      - R2 (Coefficient of Determination)
      - Mean Bias (Mean Prediction Error: y_hat - y)
    """
    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    yt = y_true[mask]
    yp = y_pred[mask]

    if len(yt) == 0:
        return {"mae": np.nan, "rmse": np.nan, "wape": np.nan, "mape": np.nan, "r2": np.nan, "mean_bias": np.nan}

    mae = float(mean_absolute_error(yt, yp))
    rmse = float(np.sqrt(mean_squared_error(yt, yp)))
    wape = float(np.sum(np.abs(yt - yp)) / np.sum(yt) * 100.0)
    bias = float(np.mean(yp - yt))
    r2 = float(r2_score(yt, yp))

    non_zero = yt > 1e-3
    if non_zero.any():
        mape = float(np.mean(np.abs((yt[non_zero] - yp[non_zero]) / yt[non_zero])) * 100.0)
    else:
        mape = np.nan

    return {"mae": mae, "rmse": rmse, "wape": wape, "mape": mape, "r2": r2, "mean_bias": bias}


def evaluate_all_models(
    test_df: pd.DataFrame,
    metrics_dir: Path
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Evaluates Previous Hour, Previous Day, Previous Week, and LightGBM models.
    Saves:
      - metrics_dir / "metrics_overall.csv"
      - metrics_dir / "metrics_by_horizon.csv"
      - metrics_dir / "tail_metrics.csv"
    """
    metrics_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Computing overall and per-horizon metrics for all models on test set...")

    models = {
        "Previous Hour": "base_prev_hour",
        "Previous Day": "base_prev_day",
        "Previous Week": "base_prev_week",
        "LightGBM": "lgb_pred",
        "TimesFM Zero-Shot": "timesfm_zeroshot_pred",
        "TimesFM LoRA (Primary)": "timesfm_lora_pred"
    }

    overall_rows = []
    horizon_rows = []
    tail_rows = []

    # Compute tail quantiles on test targets for reporting
    q90_val = test_df["target"].quantile(0.90)
    q95_val = test_df["target"].quantile(0.95)
    q99_val = test_df["target"].quantile(0.99)

    for name, col in models.items():
        if col not in test_df.columns:
            continue

        # Overall across all horizons
        m_overall = compute_forecast_metrics(test_df["target"].values, test_df[col].values)
        overall_rows.append({"model": name, **m_overall})

        # By Horizon (1..24)
        for h in range(1, 25):
            sub = test_df[test_df["forecast_horizon"] == h]
            if len(sub) > 0:
                m_h = compute_forecast_metrics(sub["target"].values, sub[col].values)
                horizon_rows.append({"model": name, "horizon": h, **m_h})

        # Tail Demand Evaluation (Top 10%, Top 5%, Top 1%)
        for quantile_label, threshold in [("Top 10%", q90_val), ("Top 5%", q95_val), ("Top 1%", q99_val)]:
            sub_tail = test_df[test_df["target"] >= threshold]
            if len(sub_tail) > 0:
                m_tail = compute_forecast_metrics(sub_tail["target"].values, sub_tail[col].values)
                tail_rows.append({
                    "model": name,
                    "segment": quantile_label,
                    "threshold_mw": threshold,
                    "sample_count": len(sub_tail),
                    **m_tail
                })

    df_overall = pd.DataFrame(overall_rows)
    df_horizon = pd.DataFrame(horizon_rows)
    df_tail = pd.DataFrame(tail_rows)

    overall_csv = metrics_dir / "metrics_overall.csv"
    horizon_csv = metrics_dir / "metrics_by_horizon.csv"
    tail_csv = metrics_dir / "tail_metrics.csv"

    df_overall.to_csv(overall_csv, index=False)
    df_horizon.to_csv(horizon_csv, index=False)
    df_tail.to_csv(tail_csv, index=False)

    logger.info(f"Saved {overall_csv}, {horizon_csv}, and {tail_csv}")
    return df_overall, df_horizon
