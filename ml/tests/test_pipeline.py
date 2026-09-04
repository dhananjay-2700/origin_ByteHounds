"""
Unit Tests for PRVAAH X ML Foundation (Draft 1)
Tests preprocessing, feature transformations, chronological splitting,
leakage audit, and untrained model interfaces on tiny synthetic data.
NO MODEL FITTING OR TRAINING IS EXECUTED.
"""

import unittest
import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure backend/ml is importable
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir.parent.parent))

from ml.data.preprocessing import aggregate_5min_to_hourly, handle_missing_hourly_gaps
from ml.data.splitting import split_chronological
from ml.data.validation import audit_data_and_splits, audit_raw_data
from ml.features.engineering import create_hourly_base_features, build_multi_horizon_samples
from ml.models.baselines import predict_previous_hour, predict_previous_day, predict_previous_week
from ml.models.lightgbm_model import create_model, LightGBMForecaster
from ml.inference.predict import predict_next_24_hours
from ml.config import ALL_MODEL_FEATURES, LIGHTGBM_PARAMS


class TestMLPipeline(unittest.TestCase):

    def test_hourly_aggregation(self):
        """Tests 5-minute to hourly aggregation, stats, and incomplete hour flagging."""
        # 12 observations for hour 0, 6 observations for hour 1
        dts_h0 = pd.date_range("2024-01-01 00:00", periods=12, freq="5min")
        dts_h1 = pd.date_range("2024-01-01 01:00", periods=6, freq="5min")
        
        df_5min = pd.DataFrame({
            "datetime": list(dts_h0) + list(dts_h1),
            "power_demand_mw": [100.0] * 12 + [200.0] * 6
        })

        hourly = aggregate_5min_to_hourly(df_5min)
        self.assertEqual(len(hourly), 2)
        
        # Hour 0: complete
        h0 = hourly.iloc[0]
        self.assertEqual(h0["demand_mean"], 100.0)
        self.assertEqual(h0["obs_count"], 12)
        self.assertFalse(h0["is_incomplete"])

        # Hour 1: incomplete
        h1 = hourly.iloc[1]
        self.assertEqual(h1["demand_mean"], 200.0)
        self.assertEqual(h1["obs_count"], 6)
        self.assertTrue(h1["is_incomplete"])

    def test_gap_handling(self):
        """Tests that small gaps (<=2h) are interpolated while large gaps (>2h) remain NaN."""
        # Timeline of 10 hours: hour 2 is isolated gap (1h), hours 5,6,7 is large gap (3h)
        grid = pd.date_range("2024-01-01 00:00", periods=10, freq="h")
        demands = [100.0, 110.0, np.nan, 130.0, 140.0, np.nan, np.nan, np.nan, 180.0, 190.0]
        
        df = pd.DataFrame({
            "timestamp": grid,
            "demand_mean": demands,
            "obs_count": [12 if not np.isnan(d) else 0 for d in demands]
        })

        clean = handle_missing_hourly_gaps(
            df_hourly=df,
            start_time=grid[0],
            end_time=grid[-1],
            max_interpolation_hours=2
        )

        # Hour 2 was 1h gap -> should be interpolated to 120.0
        self.assertFalse(np.isnan(clean.loc[2, "demand_interpolated"]))
        self.assertAlmostEqual(clean.loc[2, "demand_interpolated"], 120.0)
        self.assertTrue(clean.loc[2, "is_interpolated"])

        # Hours 5, 6, 7 was 3h gap (>2h) -> MUST remain NaN
        self.assertTrue(np.isnan(clean.loc[5, "demand_interpolated"]))
        self.assertTrue(np.isnan(clean.loc[6, "demand_interpolated"]))
        self.assertTrue(np.isnan(clean.loc[7, "demand_interpolated"]))

    def test_cyclic_features(self):
        """Tests mathematical correctness of cyclic time encodings."""
        # 24 hours
        ts = pd.date_range("2024-01-01 00:00", periods=24, freq="h")
        df = pd.DataFrame({
            "timestamp": ts,
            "demand_interpolated": [100.0] * 24
        })
        feats = create_hourly_base_features(df)

        # Hour 0: sin(0) = 0, cos(0) = 1
        self.assertAlmostEqual(feats.loc[0, "hour_sin"], 0.0)
        self.assertAlmostEqual(feats.loc[0, "hour_cos"], 1.0)

        # Hour 6: sin(2*pi*6/24) = sin(pi/2) = 1, cos(pi/2) = 0
        self.assertAlmostEqual(feats.loc[6, "hour_sin"], 1.0)
        self.assertAlmostEqual(feats.loc[6, "hour_cos"], 0.0)

    def test_lag_and_rolling_leakage_safety(self):
        """Verifies that lags and rolling stats are strictly backward-looking."""
        ts = pd.date_range("2024-01-01 00:00", periods=200, freq="h")
        # Monotonically increasing values: 1, 2, 3...
        df = pd.DataFrame({
            "timestamp": ts,
            "demand_interpolated": np.arange(1, 201, dtype=float)
        })
        feats = create_hourly_base_features(df)

        # At row 100 (value = 101):
        # lag_1h should be 101
        # lag_2h should be 100
        # lag_24h should be 101 - 23 = 78
        self.assertEqual(feats.loc[100, "lag_1h"], 101.0)
        self.assertEqual(feats.loc[100, "lag_2h"], 100.0)
        self.assertEqual(feats.loc[100, "lag_24h"], 78.0)

        # rolling_mean_3h should be mean(99, 100, 101) = 100.0
        self.assertAlmostEqual(feats.loc[100, "rolling_mean_3h"], 100.0)

    def test_chronological_splitting(self):
        """Verifies that split preserves strict temporal order with no leakage."""
        origins = pd.Series(pd.date_range("2024-01-01 00:00", periods=100, freq="h"))
        train_o, val_o, test_o = split_chronological(origins, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15)

        self.assertEqual(len(train_o), 70)
        self.assertEqual(len(val_o), 15)
        self.assertEqual(len(test_o), 15)

        # Strict chronological order check
        self.assertTrue(train_o.max() < val_o.min())
        self.assertTrue(val_o.max() < test_o.min())

    def test_multi_horizon_sample_generation(self):
        """Verifies 24-horizon sample generation and target alignment."""
        # 250 hours synthetic base
        ts = pd.date_range("2024-01-01 00:00", periods=250, freq="h")
        df_base = pd.DataFrame({
            "timestamp": ts,
            "demand_mean": np.arange(1, 251, dtype=float),
            "demand_interpolated": np.arange(1, 251, dtype=float),
            "temperature": np.random.uniform(15, 35, 250),
            "apparent_temperature": np.random.uniform(15, 35, 250),
            "relative_humidity": np.random.uniform(30, 90, 250),
            "dew_point": np.random.uniform(10, 25, 250),
            "precipitation": np.zeros(250),
            "surface_pressure": np.full(250, 1010.0),
            "cloud_cover": np.full(250, 20.0),
            "wind_speed": np.full(250, 5.0),
            "temperature_squared": np.full(250, 400.0),
            "temp_humidity_interaction": np.full(250, 1000.0)
        })
        df_feats = create_hourly_base_features(df_base)

        origin_dt = ts[180]
        samples = build_multi_horizon_samples(
            df_features=df_feats,
            origins=pd.Series([origin_dt]),
            horizons=24,
            require_target=True
        )

        self.assertEqual(len(samples), 24)
        self.assertEqual(list(samples["forecast_horizon"].values), list(range(1, 25)))
        
        # Target for h=1 should be origin + 1h
        h1 = samples[samples["forecast_horizon"] == 1].iloc[0]
        self.assertEqual(h1["target_timestamp"], origin_dt + pd.Timedelta(hours=1))
        self.assertEqual(h1["target"], df_base.loc[181, "demand_mean"])
        
        # Baseline Previous Hour should equal demand at origin T
        self.assertEqual(h1["base_prev_hour"], df_base.loc[180, "demand_mean"])

    def test_leakage_audit_fails_on_violation(self):
        """Verifies that audit_data_and_splits raises ValueError if train >= val."""
        dummy_train = pd.DataFrame({
            "origin_timestamp": pd.date_range("2024-01-05", periods=5, freq="h"),
            "target_timestamp": pd.date_range("2024-01-05 01:00", periods=5, freq="h"),
            "forecast_horizon": [1] * 5,
            "target": [100.0] * 5
        })
        dummy_val = pd.DataFrame({
            "origin_timestamp": pd.date_range("2024-01-02", periods=5, freq="h"),  # EARLIER than train!
            "target_timestamp": pd.date_range("2024-01-02 01:00", periods=5, freq="h"),
            "forecast_horizon": [1] * 5,
            "target": [100.0] * 5
        })
        dummy_test = pd.DataFrame({
            "origin_timestamp": pd.date_range("2024-01-10", periods=5, freq="h"),
            "target_timestamp": pd.date_range("2024-01-10 01:00", periods=5, freq="h"),
            "forecast_horizon": [1] * 5,
            "target": [100.0] * 5
        })

        with self.assertRaises(ValueError):
            audit_data_and_splits(dummy_train, dummy_val, dummy_test, feature_cols=[])

    def test_untrained_model_interface(self):
        """Verifies that create_model returns untrained estimator and predict fails cleanly."""
        model = create_model()
        self.assertIsNotNone(model)
        self.assertEqual(model.n_estimators, 500)
        self.assertFalse(hasattr(model, "fitted_"))

        forecaster = LightGBMForecaster(model=model)
        # Calling predict on unfitted model must raise RuntimeError
        with self.assertRaises(RuntimeError):
            forecaster.predict(pd.DataFrame(np.zeros((1, len(ALL_MODEL_FEATURES))), columns=ALL_MODEL_FEATURES))

        # Calling predict_next_24_hours without model artifact must raise FileNotFoundError
        fake_dir = Path("non_existent_models_dir")
        with self.assertRaises(FileNotFoundError):
            predict_next_24_hours(models_dir=fake_dir)

    def test_baseline_predictor_functions(self):
        """Verifies standalone baseline prediction functions."""
        # 1. Previous Hour: repeat origin demand
        preds_prev_hour = predict_previous_hour(y_origin=3500.0, horizons=24)
        self.assertEqual(len(preds_prev_hour), 24)
        self.assertTrue((preds_prev_hour == 3500.0).all())

        # 2. Previous Day: last 24 observations
        past_24 = np.arange(100, 124, dtype=float)
        preds_prev_day = predict_previous_day(y_past_24h=past_24, horizons=24)
        self.assertEqual(len(preds_prev_day), 24)
        self.assertEqual(list(preds_prev_day), list(past_24))

        # 3. Previous Week: same 24 hours from 168h ago
        past_168 = np.arange(100, 268, dtype=float)
        preds_prev_week = predict_previous_week(y_past_168h=past_168, horizons=24)
        self.assertEqual(len(preds_prev_week), 24)
        self.assertEqual(list(preds_prev_week), list(past_168[:24]))

    def test_unfitted_feature_importance_raises(self):
        """Verifies that calling get_feature_importances on unfitted forecaster raises RuntimeError."""
        forecaster = LightGBMForecaster()
        with self.assertRaises(RuntimeError):
            forecaster.get_feature_importances()


if __name__ == "__main__":
    unittest.main()
