"""
PRVAAH X - Centralized Configuration System
Draft 1 ML Foundation
"""

from pathlib import Path
from typing import List, Dict, Any

# Root Directory Paths
ML_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ML_ROOT.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
ARTIFACTS_ROOT = ML_ROOT / "artifacts"
MODELS_DIR = ARTIFACTS_ROOT / "models"
METRICS_DIR = ARTIFACTS_ROOT / "metrics"
PREDICTIONS_DIR = ARTIFACTS_ROOT / "predictions"

# Locate dataset files
def find_dataset(candidates: List[str]) -> Path:
    search_dirs = [RAW_DATA_DIR, DATA_DIR, PROJECT_ROOT]
    for d in search_dirs:
        for name in candidates:
            p = d / name
            if p.exists():
                return p
    # Fallback to standard canonical path
    return RAW_DATA_DIR / candidates[0]

POWER_DEMAND_PATH = find_dataset([
    "powerdemand_5min_2021_to_2024_with weather.csv",
    "powerdemand_5min_2021_to_2024_with_weather.csv"
])

def find_weather_file() -> Path:
    weather_name = "open-meteo-28.65N77.27E231m.csv"
    for d in [RAW_DATA_DIR, DATA_DIR, PROJECT_ROOT]:
        p = d / weather_name
        if p.exists():
            return p
    return RAW_DATA_DIR / weather_name

OPEN_METEO_PATH = find_weather_file()

# Column Name Contracts
TIMESTAMP_COL = "timestamp"
DEMAND_COL = "demand_mean"
RAW_DEMAND_COL = "power_demand_mw"
ORIGIN_COL = "origin_timestamp"
TARGET_TIME_COL = "target_timestamp"
HORIZON_COL = "forecast_horizon"
TARGET_COL = "target"

# Temporal & Aggregation Parameters
RAW_FREQUENCY = "5min"
AGGREGATION_FREQUENCY = "1h"
EXPECTED_OBS_PER_HOUR = 12
HOURLY_OBS_EXPECTED = 12
MIN_OBS_FOR_AGGREGATION = 1
MAX_INTERPOLATION_HOURS = 2
FORECAST_HORIZON = 24  # Horizons 1..24
FORECAST_HORIZONS = 24
RANDOM_SEED = 42

# Splitting Ratios (Chronological only)
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# Feature Definitions
TIME_FEATURES = [
    "hour",
    "day_of_week",
    "day_of_month",
    "day_of_year",
    "month",
    "weekend"
]

CYCLIC_FEATURES = [
    "hour_sin",
    "hour_cos",
    "day_of_week_sin",
    "day_of_week_cos",
    "day_of_year_sin",
    "day_of_year_cos"
]

LAG_PERIODS = [1, 2, 3, 6, 12, 24, 48, 72, 168]
DEMAND_LAGS = [f"lag_{p}h" for p in LAG_PERIODS]

ROLLING_WINDOWS = [3, 6, 12, 24, 168]
ROLLING_FEATURES = [f"rolling_mean_{w}h" for w in ROLLING_WINDOWS] + ["rolling_std_24h"]

WEATHER_FEATURES = [
    "temperature",
    "apparent_temperature",
    "relative_humidity",
    "dew_point",
    "precipitation",
    "surface_pressure",
    "cloud_cover",
    "wind_speed"
]

DERIVED_WEATHER_FEATURES = [
    "temperature_squared",
    "temp_humidity_interaction"
]

HORIZON_FEATURE = ["forecast_horizon"]

ALL_MODEL_FEATURES = (
    DEMAND_LAGS +
    ROLLING_FEATURES +
    WEATHER_FEATURES +
    DERIVED_WEATHER_FEATURES +
    TIME_FEATURES +
    CYCLIC_FEATURES +
    HORIZON_FEATURE
)

# LightGBM Model Hyperparameters (Conservative, lightweight configuration)
LIGHTGBM_PARAMS: Dict[str, Any] = {
    "n_estimators": 500,
    "learning_rate": 0.05,
    "num_leaves": 31,
    "max_depth": -1,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "random_state": RANDOM_SEED,
    "n_jobs": -1,
    "verbose": -1
}

EARLY_STOPPING_ROUNDS = 30
