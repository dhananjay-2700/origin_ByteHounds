"""
GRIDWISE AI - Top-level Inference Entry Point
Provides CLI and API access to 24-hour demand forecasting.

Usage:
  python ml/predict.py --origin "2024-12-10 00:00:00"
"""

import sys
import argparse
from pathlib import Path

# Ensure project root is on sys.path
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir.parent))

from ml.inference.predict import predict_next_24_hours

__all__ = ["predict_next_24_hours"]


def main():
    parser = argparse.ArgumentParser(description="GRIDWISE AI 24-Hour Electricity Demand Forecast")
    parser.add_argument(
        "--origin",
        type=str,
        default=None,
        help="Forecast origin timestamp (YYYY-MM-DD HH:MM:SS). Defaults to latest available in dataset."
    )
    args = parser.parse_args()

    df_fc = predict_next_24_hours(forecast_origin=args.origin)
    print("\n========================================================")
    print("GRIDWISE AI - 24-HOUR ELECTRICITY DEMAND FORECAST")
    print("========================================================")
    print(f"Total Forecast Points: {len(df_fc)}")
    print(f"Forecast Horizon Range: {df_fc['timestamp'].min()} to {df_fc['timestamp'].max()}\n")
    print(f"{'Horizon':<8} | {'Timestamp':<20} | {'Predicted Demand (MW)':<22}")
    print("-" * 56)
    for _, row in df_fc.iterrows():
        print(f"T+{int(row['forecast_horizon']):<6} | {str(row['timestamp']):<20} | {row['predicted_demand']:10.2f} MW")
    print("-" * 56)
    print(f"Predicted 24h Peak Demand: {df_fc['predicted_demand'].max():.2f} MW at "
          f"{df_fc.loc[df_fc['predicted_demand'].idxmax(), 'timestamp']}")
    print(f"Predicted 24h Min Demand:  {df_fc['predicted_demand'].min():.2f} MW at "
          f"{df_fc.loc[df_fc['predicted_demand'].idxmin(), 'timestamp']}")
    print("========================================================\n")


if __name__ == "__main__":
    main()
