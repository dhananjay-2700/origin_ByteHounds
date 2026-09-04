"""
Preprocessing pipeline for PRVAAH X electricity demand forecasting.
Aggregates 5-minute data to hourly resolution, flags incomplete hours,
handles missing gaps deterministically, and aligns weather variables.
"""

import logging
import pandas as pd
import numpy as np

from ..config import (
    MAX_INTERPOLATION_HOURS,
    HOURLY_OBS_EXPECTED
)

logger = logging.getLogger(__name__)


def aggregate_5min_to_hourly(df_5min: pd.DataFrame) -> pd.DataFrame:
    """
    Converts 5-minute demand data to hourly resolution.
    
    Calculates:
      - demand_mean: mean demand across observations in the hour (MW)
      - demand_max: maximum demand in the hour (MW)
      - demand_min: minimum demand in the hour (MW)
      - obs_count: number of 5-minute observations (normally 12)
      - is_incomplete: boolean flag for hours with < 12 observations
    """
    logger.info("Aggregating 5-minute power demand to hourly resolution...")
    df = df_5min.copy()
    df["hourly_timestamp"] = df["datetime"].dt.floor("h")

    hourly = df.groupby("hourly_timestamp").agg(
        demand_mean=("power_demand_mw", "mean"),
        demand_max=("power_demand_mw", "max"),
        demand_min=("power_demand_mw", "min"),
        obs_count=("power_demand_mw", "count")
    ).reset_index()

    hourly = hourly.rename(columns={"hourly_timestamp": "timestamp"})
    hourly["is_incomplete"] = hourly["obs_count"] < HOURLY_OBS_EXPECTED

    incomplete_count = hourly["is_incomplete"].sum()
    logger.info(
        f"Aggregated {len(hourly):,} hourly records. "
        f"Complete hours (12/12 obs): {len(hourly) - incomplete_count:,} ({(1 - incomplete_count / len(hourly)) * 100:.2f}%). "
        f"Incomplete hours: {incomplete_count:,}."
    )
    return hourly


def handle_missing_hourly_gaps(
    df_hourly: pd.DataFrame,
    start_time: pd.Timestamp,
    end_time: pd.Timestamp,
    max_interpolation_hours: int = MAX_INTERPOLATION_HOURS
) -> pd.DataFrame:
    """
    Reindexes hourly data to a continuous regular hourly grid.
    
    Applies clearly documented deterministic gap handling:
      1. Small gaps (<= max_interpolation_hours): linearly interpolated to preserve rolling continuity.
         Flagged with `is_interpolated = True`.
      2. Large gaps (> max_interpolation_hours): strictly preserved as NaN.
         Downstream training pipelines exclude samples where lags or targets contain NaNs.
    """
    logger.info(f"Reindexing to continuous hourly grid from {start_time} to {end_time}...")
    full_grid = pd.date_range(start=start_time, end=end_time, freq="h")
    df_full = pd.DataFrame({"timestamp": full_grid})

    df_merged = df_full.merge(df_hourly, on="timestamp", how="left")
    df_merged["obs_count"] = df_merged["obs_count"].fillna(0).astype(int)
    df_merged["is_incomplete"] = df_merged["obs_count"] < HOURLY_OBS_EXPECTED

    # Identify missing runs in demand_mean
    is_missing = df_merged["demand_mean"].isna()
    # Consecutive missing runs
    missing_runs = is_missing.groupby((~is_missing).cumsum()).transform("sum")

    # Apply linear interpolation ONLY for gaps <= max_interpolation_hours
    interp_series = df_merged["demand_mean"].interpolate(method="linear", limit=max_interpolation_hours)
    
    # Where run length exceeds max_interpolation_hours, restore NaN
    demand_clean = interp_series.copy()
    demand_clean[is_missing & (missing_runs > max_interpolation_hours)] = np.nan

    df_merged["demand_interpolated"] = demand_clean
    df_merged["is_interpolated"] = is_missing & (~demand_clean.isna())

    total_missing = is_missing.sum()
    interpolated_count = df_merged["is_interpolated"].sum()
    preserved_nan = total_missing - interpolated_count

    logger.info(
        f"Continuous grid size: {len(df_merged):,} hours. "
        f"Total missing: {total_missing:,}. "
        f"Interpolated (<= {max_interpolation_hours}h): {interpolated_count:,}. "
        f"Preserved as missing NaN (> {max_interpolation_hours}h): {preserved_nan:,}."
    )
    return df_merged


def preprocess_and_align(
    df_power_5min: pd.DataFrame,
    df_weather_hourly: pd.DataFrame
) -> pd.DataFrame:
    """
    Master preprocessing and weather alignment function.
    
    1. Aggregates 5-min demand to hourly resolution.
    2. Builds continuous hourly timeline and handles gaps deterministically.
    3. Aligns with Open-Meteo hourly weather observations.
    4. Computes derived weather features (temperature_squared, temp_humidity_interaction).
    """
    # 1. Hourly aggregation
    hourly_demand = aggregate_5min_to_hourly(df_power_5min)

    # Determine overlapping date bounds
    start_dt = max(hourly_demand["timestamp"].min(), df_weather_hourly["timestamp"].min())
    end_dt = min(hourly_demand["timestamp"].max(), df_weather_hourly["timestamp"].max())

    # 2. Continuous timeline & gap handling
    hourly_full = handle_missing_hourly_gaps(
        hourly_demand[
            (hourly_demand["timestamp"] >= start_dt) & 
            (hourly_demand["timestamp"] <= end_dt)
        ],
        start_time=start_dt,
        end_time=end_dt
    )

    # 3. Weather Alignment
    logger.info("Aligning hourly weather variables to hourly demand timestamps...")
    aligned = hourly_full.merge(df_weather_hourly, on="timestamp", how="left")

    # 4. Derived weather features (Documented in Draft 1)
    # - temperature_squared: captures non-linear cooling degree-day effects (AC surge during extreme heat).
    # - temp_humidity_interaction: captures heat-index / apparent discomfort load.
    aligned["temperature_squared"] = aligned["temperature"] ** 2
    aligned["temp_humidity_interaction"] = aligned["temperature"] * aligned["relative_humidity"]

    logger.info(f"Preprocessed and aligned dataset created with {len(aligned):,} hours.")
    return aligned
