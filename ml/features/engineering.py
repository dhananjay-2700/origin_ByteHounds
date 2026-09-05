"""
Feature engineering pipeline for PRVAAH X electricity demand forecasting.
Computes time features, cyclic features, strictly historical demand lags,
historical rolling features, and multi-horizon tabular matrices.
"""

import logging
import pandas as pd
import numpy as np

from ..config import (
    TIME_FEATURES,
    CYCLIC_FEATURES,
    DEMAND_LAGS,
    ROLLING_FEATURES,
    WEATHER_FEATURES,
    DERIVED_WEATHER_FEATURES,
    HORIZON_FEATURE,
    ALL_MODEL_FEATURES,
    FORECAST_HORIZONS,
    PEAK_WEIGHTING_CONFIG
)

logger = logging.getLogger(__name__)


def create_hourly_base_features(df_aligned: pd.DataFrame) -> pd.DataFrame:
    """
    Computes origin features (demand lags and rolling metrics) and target temporal features.
    
    CRITICAL LEAKAGE RULE:
    All demand lags and rolling features use strictly historical information available
    at or before the observation timestamp (forecast origin T).
    """
    logger.info("Computing historical demand lags, rolling features, and cyclic time features...")
    df = df_aligned.copy()

    # Sort chronologically to guarantee correct lag alignment
    df = df.sort_values("timestamp").reset_index(drop=True)

    # Use demand_interpolated (clean demand with small gaps bridged)
    demand = df["demand_interpolated"]

    # --- C. DEMAND LAGS (at origin T) ---
    # lag_1h is demand at origin T (1h before forecast step T+1)
    df["lag_1h"] = demand
    df["lag_2h"] = demand.shift(1)
    df["lag_3h"] = demand.shift(2)
    df["lag_6h"] = demand.shift(5)
    df["lag_12h"] = demand.shift(11)
    df["lag_24h"] = demand.shift(23)
    df["lag_48h"] = demand.shift(47)
    df["lag_72h"] = demand.shift(71)
    df["lag_168h"] = demand.shift(167)

    # --- D. ROLLING & PEAK FEATURES (at origin T) ---
    df["rolling_mean_3h"] = demand.rolling(3, min_periods=3).mean()
    df["rolling_mean_6h"] = demand.rolling(6, min_periods=6).mean()
    df["rolling_mean_12h"] = demand.rolling(12, min_periods=12).mean()
    df["rolling_mean_24h"] = demand.rolling(24, min_periods=24).mean()
    df["rolling_mean_168h"] = demand.rolling(168, min_periods=168).mean()
    df["rolling_std_24h"] = demand.rolling(24, min_periods=24).std()
    df["rolling_max_24h"] = demand.rolling(24, min_periods=24).max()
    df["rolling_max_168h"] = demand.rolling(168, min_periods=168).max()
    df["rolling_min_24h"] = demand.rolling(24, min_periods=24).min()
    df["peak_ratio_24h"] = df["lag_1h"] / (df["rolling_max_24h"] + 1e-5)
    df["demand_std_ratio"] = df["rolling_std_24h"] / (df["rolling_mean_24h"] + 1e-5)

    # --- A. TIME FEATURES ---
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["day_of_month"] = df["timestamp"].dt.day
    df["day_of_year"] = df["timestamp"].dt.dayofyear
    df["month"] = df["timestamp"].dt.month
    df["weekend"] = (df["day_of_week"] >= 5).astype(int)

    # --- B. CYCLIC FEATURES ---
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    df["day_of_week_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
    df["day_of_week_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)
    df["day_of_year_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 365.25)
    df["day_of_year_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 365.25)

    return df


def build_multi_horizon_samples(
    df_features: pd.DataFrame,
    origins: pd.Series,
    horizons: int = FORECAST_HORIZONS,
    require_target: bool = True
) -> pd.DataFrame:
    """
    Vectorized construction of the Global Multi-Horizon tabular dataset.
    
    For each forecast origin T and horizon h in [1..24]:
      - Target timestamp = T + h
      - Target demand = actual demand_mean at T + h
      - Forecast horizon = h (as a model feature)
      - Demand features = lags and rolling statistics anchored strictly at origin T
      - Weather and time features = meteorological and calendar conditions at T + h
      - Baselines:
          1. Previous hour: demand at origin T
          2. Previous day: actual demand at (T + h - 24h)
          3. Previous week: actual demand at (T + h - 168h)
    """
    logger.info(f"Building multi-horizon tabular samples for {len(origins):,} forecast origins across {horizons} horizons...")

    # Fast indexed lookups
    origin_feature_cols = DEMAND_LAGS + ROLLING_FEATURES
    target_feature_cols = WEATHER_FEATURES + DERIVED_WEATHER_FEATURES + TIME_FEATURES + CYCLIC_FEATURES

    indexed_df = df_features.set_index("timestamp")
    origin_data = indexed_df.loc[origins, origin_feature_cols]
    
    target_lookup = indexed_df[target_feature_cols]
    demand_lookup = indexed_df["demand_mean"]

    blocks = []
    for h in range(1, horizons + 1):
        target_timestamps = origins + pd.Timedelta(hours=h)

        # Target demand at T + h
        y = demand_lookup.reindex(target_timestamps).values

        # Weather and time features at T + h
        target_feats = target_lookup.reindex(target_timestamps).values

        # Origin demand features at T
        origin_feats = origin_data.values

        # Baseline predictions:
        # 1. Previous hour: lag_1h (latest known demand at origin T)
        base_prev_hour = origin_data["lag_1h"].values

        # 2. Previous day: same hour previous day (T + h - 24h)
        # Note: Since h <= 24, (T + h - 24h) <= T, which is strictly historical!
        prev_day_ts = target_timestamps - pd.Timedelta(hours=24)
        base_prev_day = demand_lookup.reindex(prev_day_ts).values

        # 3. Previous week: same hour previous week (T + h - 168h)
        prev_week_ts = target_timestamps - pd.Timedelta(hours=168)
        base_prev_week = demand_lookup.reindex(prev_week_ts).values

        h_arr = np.full((len(origins), 1), h, dtype=np.float32)

        combined_features = np.hstack([origin_feats, target_feats, h_arr])
        
        block = pd.DataFrame(
            combined_features,
            columns=origin_feature_cols + target_feature_cols + ["forecast_horizon"]
        )
        block["origin_timestamp"] = origins.values
        block["target_timestamp"] = target_timestamps.values
        block["target"] = y
        block["base_prev_hour"] = base_prev_hour
        block["base_prev_day"] = base_prev_day
        block["base_prev_week"] = base_prev_week

        blocks.append(block)

    full_matrix = pd.concat(blocks, ignore_index=True)

    # Exclude samples where required features are NaN
    # If require_target is True (training/evaluation), also exclude missing targets
    subset_to_check = (["target"] + ALL_MODEL_FEATURES) if require_target else ALL_MODEL_FEATURES
    initial_len = len(full_matrix)
    clean_matrix = full_matrix.dropna(subset=subset_to_check).reset_index(drop=True)
    dropped = initial_len - len(clean_matrix)

    logger.info(
        f"Generated {len(clean_matrix):,} complete samples. "
        f"Dropped {dropped:,} samples with missing target/features due to historical gaps."
    )
    return clean_matrix


def compute_peak_sample_weights(
    y_series: pd.Series,
    train_thresholds: dict = None,
    config: dict = None
) -> tuple:
    """
    Computes leakage-safe peak-aware sample weights for LightGBM training.
    
    CRITICAL LEAKAGE RULE:
    Demand quantile thresholds (q_high, q_extreme, q_tail) MUST be derived ONLY from the TRAINING partition.
    When evaluating or calculating weights on validation/test sets, pre-computed `train_thresholds`
    from the training set MUST be passed.
    
    Weight assignment strategy:
      - Normal demand (< q_high): weight = 1.0
      - High demand (q_high <= y < q_extreme): weight scales linearly from 1.0 to high_weight_mult (1.5)
      - Extreme demand (q_extreme <= y < q_tail): weight scales linearly from extreme_weight_mult (3.0) to tail_weight_mult (4.0)
      - Tail peak demand (y >= q_tail): weight scales linearly from tail_weight_mult (4.0) to max_weight_cap (6.0)
    """
    cfg = config or PEAK_WEIGHTING_CONFIG.copy()
    if not cfg.get("enabled", True):
        weights = np.ones(len(y_series), dtype=np.float32)
        return weights, train_thresholds or {}

    y_vals = y_series.values

    # Determine thresholds strictly from training data
    if train_thresholds is None:
        q_high_val = float(np.percentile(y_vals, cfg.get("high_quantile", 0.75) * 100.0))
        q_extreme_val = float(np.percentile(y_vals, cfg.get("extreme_quantile", 0.90) * 100.0))
        q_tail_val = float(np.percentile(y_vals, cfg.get("tail_quantile", 0.95) * 100.0))
        max_val = float(np.max(y_vals))
        thresholds = {
            "q_high": q_high_val,
            "q_extreme": q_extreme_val,
            "q_tail": q_tail_val,
            "train_max": max_val
        }
    else:
        thresholds = train_thresholds.copy()
        q_high_val = thresholds["q_high"]
        q_extreme_val = thresholds["q_extreme"]
        q_tail_val = thresholds.get("q_tail", q_extreme_val)
        max_val = thresholds["train_max"]

    w_high_mult = cfg.get("high_weight_mult", 1.5)
    w_extreme_mult = cfg.get("extreme_weight_mult", 3.0)
    w_tail_mult = cfg.get("tail_weight_mult", 4.0)
    cap = cfg.get("max_weight_cap", 6.0)

    weights = np.ones(len(y_vals), dtype=np.float32)

    # 1. High demand region (q_high <= y < q_extreme) -> 1.0 to 1.5
    mask_high = (y_vals >= q_high_val) & (y_vals < q_extreme_val)
    if q_extreme_val > q_high_val:
        frac_high = (y_vals[mask_high] - q_high_val) / (q_extreme_val - q_high_val)
        weights[mask_high] = 1.0 + frac_high * (w_high_mult - 1.0)

    # 2. Extreme demand region (q_extreme <= y < q_tail) -> 3.0 to 4.0
    mask_extreme = (y_vals >= q_extreme_val) & (y_vals < q_tail_val)
    if q_tail_val > q_extreme_val:
        frac_extreme = (y_vals[mask_extreme] - q_extreme_val) / (q_tail_val - q_extreme_val)
        weights[mask_extreme] = w_extreme_mult + frac_extreme * (w_tail_mult - w_extreme_mult)

    # 3. Tail peak demand region (y >= q_tail) -> 4.0 to cap
    mask_tail = y_vals >= q_tail_val
    denom_tail = max(1.0, max_val - q_tail_val)
    frac_tail = (y_vals[mask_tail] - q_tail_val) / denom_tail
    weights[mask_tail] = w_tail_mult + frac_tail * (cap - w_tail_mult)

    # Cap maximum weight for stability
    weights = np.clip(weights, 1.0, cap)

    return weights.astype(np.float32), thresholds

