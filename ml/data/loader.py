"""
Data loader for GRIDWISE AI electricity demand and Open-Meteo weather datasets.
"""

import logging
from pathlib import Path
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def load_power_demand(path: Path) -> pd.DataFrame:
    """
    Loads 5-minute electricity demand data.
    
    Source: Delhi SLDC / Regional grid dispatch records (2021-2024).
    Demand units: Megawatts (MW).
    """
    if not path.exists():
        raise FileNotFoundError(f"Power demand dataset not found at {path}")

    logger.info(f"Loading power demand dataset from {path.name}...")
    df = pd.read_csv(path, usecols=lambda col: col.lower() in ["datetime", "power demand"] or "datetime" in col or "power demand" in col)
    
    # Identify datetime and demand columns
    dt_col = None
    demand_col = None
    for c in df.columns:
        c_clean = c.strip().lower()
        if c_clean == "datetime":
            dt_col = c
        elif "power demand" in c_clean or "demand" in c_clean:
            demand_col = c

    if dt_col is None or demand_col is None:
        raise ValueError(f"Could not locate datetime or power demand columns in {df.columns.tolist()}")

    df = df.rename(columns={dt_col: "datetime", demand_col: "power_demand_mw"})
    df["datetime"] = pd.to_datetime(df["datetime"])
    df["power_demand_mw"] = pd.to_numeric(df["power_demand_mw"], errors="coerce")

    # Sort chronologically and drop duplicate timestamps
    df = df.sort_values("datetime").drop_duplicates(subset=["datetime"]).reset_index(drop=True)
    logger.info(f"Loaded {len(df):,} rows of 5-min demand data ({df['datetime'].min()} to {df['datetime'].max()})")
    return df


def load_weather_data(path: Path) -> pd.DataFrame:
    """
    Loads Open-Meteo hourly historical weather data for Delhi (28.65N, 77.27E, 231m elevation).
    
    Units:
      - temperature: °C (2m elevation)
      - apparent_temperature: °C
      - relative_humidity: % (2m elevation)
      - dew_point: °C (2m elevation)
      - precipitation: mm
      - surface_pressure: hPa
      - cloud_cover: %
      - wind_speed: km/h (10m elevation)
    """
    if not path.exists():
        raise FileNotFoundError(f"Weather dataset not found at {path}")

    logger.info(f"Loading Open-Meteo weather dataset from {path.name}...")
    # Skip first 3 metadata lines; line 4 is the header
    df = pd.read_csv(path, skiprows=3)

    # Standardize column mapping
    col_mapping = {}
    for col in df.columns:
        c_norm = col.lower()
        if "temperature_2m" in c_norm:
            col_mapping[col] = "temperature"
        elif "apparent_temperature" in c_norm:
            col_mapping[col] = "apparent_temperature"
        elif "relative_humidity" in c_norm:
            col_mapping[col] = "relative_humidity"
        elif "dew_point" in c_norm:
            col_mapping[col] = "dew_point"
        elif "precipitation" in c_norm:
            col_mapping[col] = "precipitation"
        elif "surface_pressure" in c_norm:
            col_mapping[col] = "surface_pressure"
        elif "cloud_cover" in c_norm:
            col_mapping[col] = "cloud_cover"
        elif "wind_speed" in c_norm:
            col_mapping[col] = "wind_speed"
        elif "time" in c_norm:
            col_mapping[col] = "timestamp"

    df = df.rename(columns=col_mapping)
    required_cols = [
        "timestamp", "temperature", "apparent_temperature", "relative_humidity",
        "dew_point", "precipitation", "surface_pressure", "cloud_cover", "wind_speed"
    ]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required weather columns: {missing}. Present: {df.columns.tolist()}")

    df = df[required_cols]
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    for col in required_cols:
        if col != "timestamp":
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Sort chronologically and drop duplicate timestamps
    df = df.sort_values("timestamp").drop_duplicates(subset=["timestamp"]).reset_index(drop=True)
    logger.info(f"Loaded {len(df):,} rows of hourly weather data ({df['timestamp'].min()} to {df['timestamp'].max()})")
    return df
