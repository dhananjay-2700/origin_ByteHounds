"""
Feature engineering pipeline for GRIDWISE AI electricity demand forecasting.
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
    FORECAST_HORIZONS
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

    # --- D. ROLLING FEATURES (at origin T) ---
    df["rolling_mean_3h"] = demand.rolling(3, min_periods=3).mean()
    df["rolling_mean_6h"] = demand.rolling(6, min_periods=6).mean()
    df["rolling_mean_12h"] = demand.rolling(12, min_periods=12).mean()
    df["rolling_mean_24h"] = demand.rolling(24, min_periods=24).mean()
    df["rolling_mean_168h"] = demand.rolling(168, min_periods=168).mean()
    df["rolling_std_24h"] = demand.rolling(24, min_periods=24).std()

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
