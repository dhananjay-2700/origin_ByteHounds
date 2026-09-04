"""
PRVAAH X - 24-Hour Electricity Demand Forecasting Inference Interface
Draft 1 Foundation

Provides the production inference pipeline for 24-hour ahead multi-horizon demand forecasting.
NOTE: If no trained model artifact exists, it fails loudly and informs the user
to train the model before inference. No dummy or hardcoded predictions are permitted.
"""

import sys
import logging
from pathlib import Path
from typing import Optional, Union
import pandas as pd
import numpy as np

# Ensure backend/ml is importable
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir.parent.parent))

from ml.config import (
    MODELS_DIR,
    ALL_MODEL_FEATURES,
    POWER_DEMAND_PATH,
    OPEN_METEO_PATH,
    FORECAST_HORIZON
)
from ml.data.loader import load_power_demand, load_weather_data
from ml.data.preprocessing import preprocess_and_align
from ml.features.engineering import create_hourly_base_features, build_multi_horizon_samples
from ml.models.lightgbm_model import LightGBMForecaster

logger = logging.getLogger(__name__)


def predict_next_24_hours(
    forecast_origin: Optional[Union[str, pd.Timestamp]] = None,
    df_preprocessed: Optional[pd.DataFrame] = None,
    models_dir: Optional[Path] = None
) -> pd.DataFrame:
    """
    Generates the next 24 hours of electricity demand forecasts from a specified origin T.
    
    Data Contract (Forecast Output):
      - timestamp: target timestamp (T + h)
      - forecast_origin: forecast origin timestamp (T)
      - forecast_horizon: integer horizon step (1..24)
      - predicted_demand: predicted electricity demand in MW
      
    Args:
      forecast_origin: Origin timestamp T (latest observation time). If None, defaults to latest feasible origin.
      df_preprocessed: Optional pre-aligned dataset.
      models_dir: Directory containing trained model artifacts.
      
    Returns:
      DataFrame matching the Forecast Output contract.
      
    Raises:
      FileNotFoundError: If model artifact does not exist.
      RuntimeError: If model is untrained.
    """
    target_dir = models_dir or MODELS_DIR
    model_file = target_dir / "lightgbm_model.pkl"

    if not model_file.exists():
        raise FileNotFoundError(
            f"Model artifact not found at {model_file}. Train the model before inference."
        )

    # Load trained model
    forecaster = LightGBMForecaster.load(target_dir)
    if not forecaster.is_fitted:
        raise RuntimeError("Model artifact is not fitted! Train the model before inference.")

    # 1. Load data if needed
    if df_preprocessed is None:
        logger.info("Loading preprocessed dataset for inference...")
        df_power = load_power_demand(POWER_DEMAND_PATH)
        df_weather = load_weather_data(OPEN_METEO_PATH)
        df_aligned = preprocess_and_align(df_power, df_weather)
        df_features = create_hourly_base_features(df_aligned)
    else:
        df_features = create_hourly_base_features(df_preprocessed)

    # 2. Determine forecast origin
    if forecast_origin is None:
        max_weather_ts = df_features["timestamp"].max()
        target_origin = max_weather_ts - pd.Timedelta(hours=FORECAST_HORIZON)
        avail_ts = df_features[df_features["timestamp"] <= target_origin]["timestamp"]
        origin_dt = avail_ts.max()
        logger.info(f"Defaulting to latest feasible forecast origin: {origin_dt}")
    else:
        origin_dt = pd.to_datetime(forecast_origin)

    # 3. Construct multi-horizon sample for horizons 1..24
    origins_series = pd.Series([origin_dt])
    sample_df = build_multi_horizon_samples(
        df_features=df_features,
        origins=origins_series,
        horizons=FORECAST_HORIZON,
        require_target=False
    )

    if len(sample_df) != 24:
        raise RuntimeError(
            f"Expected exactly 24 forecast points, but constructed {len(sample_df)}. "
            f"Verify that weather forecast records exist for {origin_dt + pd.Timedelta(hours=1)} "
            f"to {origin_dt + pd.Timedelta(hours=24)}."
        )

    # 4. Generate model predictions
    predictions = forecaster.predict(sample_df[ALL_MODEL_FEATURES])

    # 5. Output Data Contract
    forecast_output = pd.DataFrame({
        "timestamp": sample_df["target_timestamp"],
        "forecast_origin": origin_dt,
        "forecast_horizon": sample_df["forecast_horizon"].astype(int),
        "predicted_demand": np.round(predictions, 2)
    }).sort_values("forecast_horizon").reset_index(drop=True)

    return forecast_output
