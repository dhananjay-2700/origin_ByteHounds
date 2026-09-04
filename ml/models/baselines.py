"""
Baseline forecasting models for benchmarking PRVAAH X ML foundation.
Includes:
  1. Previous Hour (Origin Persistence: y_hat(T+h) = y_T)
  2. Previous Day (24-hour Seasonal Persistence: y_hat(T+h) = y_{T+h-24})
  3. Previous Week (168-hour Seasonal Persistence: y_hat(T+h) = y_{T+h-168})
"""

import logging
from typing import Dict, Tuple
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

logger = logging.getLogger(__name__)


def predict_previous_hour(y_origin: float, horizons: int = 24) -> np.ndarray:
    """Baseline 1: Origin persistence - repeats the most recent observed demand."""
    return np.full(horizons, y_origin, dtype=float)


def predict_previous_day(y_past_24h: np.ndarray, horizons: int = 24) -> np.ndarray:
    """Baseline 2: 24h seasonal persistence - predicts the same hours from previous day."""
    if len(y_past_24h) < 24:
        raise ValueError(f"Previous day baseline requires 24 past observations, got {len(y_past_24h)}")
    # If predicting 24 horizons, it takes the last 24 hours
    return np.array(y_past_24h[-24:], dtype=float)[:horizons]


def predict_previous_week(y_past_168h: np.ndarray, horizons: int = 24) -> np.ndarray:
    """Baseline 3: 168h seasonal persistence - predicts the same hours from previous week."""
    if len(y_past_168h) < 168:
        raise ValueError(f"Previous week baseline requires 168 past observations, got {len(y_past_168h)}")
    return np.array(y_past_168h[-168:-168 + horizons], dtype=float)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Computes standard power forecasting metrics: MAE, RMSE, WAPE, MAPE."""
    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    yt = y_true[mask]
    yp = y_pred[mask]

    if len(yt) == 0:
        return {"mae": np.nan, "rmse": np.nan, "wape": np.nan, "mape": np.nan}

    mae = float(mean_absolute_error(yt, yp))
    rmse = float(np.sqrt(mean_squared_error(yt, yp)))
    wape = float(np.sum(np.abs(yt - yp)) / np.sum(yt) * 100.0)
    # Avoid zero division in MAPE
    non_zero = yt > 1e-3
    if non_zero.any():
        mape = float(np.mean(np.abs((yt[non_zero] - yp[non_zero]) / yt[non_zero])) * 100.0)
    else:
        mape = np.nan

    return {"mae": mae, "rmse": rmse, "wape": wape, "mape": mape}


def evaluate_baselines(test_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Evaluates the 3 baselines on the test dataset.
    Returns:
      - overall_metrics_df: summary across all horizons
      - horizon_metrics_df: metrics breakdown for horizons 1..24
    """
    logger.info("Evaluating baseline models on test set...")
    baseline_cols = {
        "Previous Hour": "base_prev_hour",
        "Previous Day": "base_prev_day",
        "Previous Week": "base_prev_week"
    }

    overall_records = []
    horizon_records = []

    for name, col in baseline_cols.items():
        # Overall
        overall_m = compute_metrics(test_df["target"].values, test_df[col].values)
        overall_records.append({
            "model": name,
            **overall_m
        })

        # By Horizon
        for h in range(1, 25):
            sub = test_df[test_df["forecast_horizon"] == h]
            hm = compute_metrics(sub["target"].values, sub[col].values)
            horizon_records.append({
                "model": name,
                "horizon": h,
                **hm
            })

    return pd.DataFrame(overall_records), pd.DataFrame(horizon_records)
