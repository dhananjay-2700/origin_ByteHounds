"""
Time-series windowing dataset for TimesFM 2.5 electricity demand forecasting.
Constructs 168-hour historical context -> 24-hour target forecast windows.
Enforces zero data leakage and strict chronological separation.
"""

import logging
from typing import Tuple, List, Dict, Any, Optional
import pandas as pd
import numpy as np

from ..config import CONTEXT_LENGTH, FORECAST_HORIZONS

logger = logging.getLogger(__name__)


def build_timeseries_windows(
    df_aligned: pd.DataFrame,
    origins: pd.Series,
    context_len: int = CONTEXT_LENGTH,
    prediction_len: int = FORECAST_HORIZONS,
    stride_hours: int = 1,
    require_target: bool = True
) -> Dict[str, np.ndarray]:
    """
    Constructs 3D/2D time-series window tensors for TimesFM:
      - X_context: [N, context_len] historical demand values (T-167 .. T)
      - Y_target: [N, prediction_len] target demand values (T+1 .. T+24)
      - origin_timestamps: [N] Timestamp at forecast origin T
      - target_timestamps: [N, prediction_len] Timestamps for horizons T+1 .. T+24
      - X_weather_context: [N, context_len, num_weather_features]
      - X_weather_target: [N, prediction_len, num_weather_features]
      
    Args:
      df_aligned: DataFrame indexed or sorted by timestamp with hourly data.
      origins: Series of valid origin timestamps T.
      context_len: Historical context length in hours (default 168).
      prediction_len: Forecast horizon length in hours (default 24).
      stride_hours: Stride in hours between origin samples to reduce overlap (default 6).
      require_target: If True, drops windows where target or context contains NaNs.
      
    Returns:
      Dictionary containing numpy arrays for context, target, and timestamps.
    """
    origins_strided = origins.iloc[::stride_hours].reset_index(drop=True)
    logger.info(f"Constructing time-series windows (Context: {context_len}h -> Target: {prediction_len}h, Stride: {stride_hours}h) for {len(origins_strided):,} strided origins (from {len(origins):,} total origins)...")

    df_sorted = df_aligned.sort_values("timestamp").reset_index(drop=True)
    ts_map = {ts: idx for idx, ts in enumerate(df_sorted["timestamp"])}

    demand_series = df_sorted["demand_interpolated"].values
    target_demand_series = df_sorted["demand_mean"].values

    weather_cols = [
        "temperature", "apparent_temperature", "relative_humidity",
        "dew_point", "precipitation", "surface_pressure", "cloud_cover", "wind_speed"
    ]
    has_weather = all(c in df_sorted.columns for c in weather_cols)
    weather_matrix = df_sorted[weather_cols].values if has_weather else None

    x_contexts = []
    y_targets = []
    origin_ts_list = []
    target_ts_matrix = []
    weather_ctx_list = []
    weather_tgt_list = []

    for orig in origins_strided:
        if orig not in ts_map:
            continue
        idx_t = ts_map[orig]

        idx_ctx_start = idx_t - context_len + 1
        idx_tgt_end = idx_t + prediction_len

        if idx_ctx_start < 0 or idx_tgt_end >= len(df_sorted):
            continue

        ctx_demand = demand_series[idx_ctx_start : idx_t + 1]
        tgt_demand = target_demand_series[idx_t + 1 : idx_tgt_end + 1]

        if len(ctx_demand) != context_len or len(tgt_demand) != prediction_len:
            continue

        if require_target:
            if np.isnan(ctx_demand).any() or np.isnan(tgt_demand).any():
                continue

        tgt_timestamps = df_sorted["timestamp"].values[idx_t + 1 : idx_tgt_end + 1]

        x_contexts.append(ctx_demand)
        y_targets.append(tgt_demand)
        origin_ts_list.append(orig)
        target_ts_matrix.append(tgt_timestamps)

        if has_weather:
            weather_ctx_list.append(weather_matrix[idx_ctx_start : idx_t + 1])
            weather_tgt_list.append(weather_matrix[idx_t + 1 : idx_tgt_end + 1])

    X_ctx = np.array(x_contexts, dtype=np.float32)
    Y_tgt = np.array(y_targets, dtype=np.float32)
    O_ts = np.array(origin_ts_list)
    T_ts = np.array(target_ts_matrix)

    out = {
        "x_context": X_ctx,
        "y_target": Y_tgt,
        "origin_timestamps": O_ts,
        "target_timestamps": T_ts,
        "num_windows": len(X_ctx)
    }

    if has_weather:
        out["x_weather_context"] = np.array(weather_ctx_list, dtype=np.float32)
        out["x_weather_target"] = np.array(weather_tgt_list, dtype=np.float32)

    logger.info(f"Built {len(X_ctx):,} valid windows (dropped {len(origins_strided) - len(X_ctx):,} incomplete/NaN windows).")
    return out
