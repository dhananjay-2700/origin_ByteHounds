"""
Peak demand forecasting evaluation module for PRVAAH X.
Evaluates daily 24-hour peak demand magnitude and peak timing accuracy.
"""

import logging
from pathlib import Path
from typing import Dict, Tuple, Optional
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def evaluate_peak_performance(
    test_df: pd.DataFrame,
    pred_col: str = "lgb_pred",
    metrics_dir: Optional[Path] = None
) -> Tuple[Dict[str, float], pd.DataFrame]:
    """
    Evaluates 24-hour peak demand forecasting performance for every forecast origin window.
    
    For every 24-hour window (origin T, horizons 1..24):
      - Actual peak demand (MW)
      - Predicted peak demand (MW)
      - Peak magnitude error (Predicted - Actual in MW)
      - Actual peak timestamp
      - Predicted peak timestamp
      - Peak timing error (in hours)
      
    Reports:
      - mean_peak_magnitude_error (MW) - signed bias
      - mae_peak_demand (MW)
      - mean_absolute_peak_timing_error (hours)
    """
    logger.info(f"Computing 24-hour peak demand metrics for '{pred_col}'...")

    # Group by origin timestamp
    records = []
    for origin, group in test_df.groupby("origin_timestamp"):
        if len(group) < 24:
            continue  # incomplete window

        # Actual peak
        act_idx = group["target"].idxmax()
        act_peak_val = group.loc[act_idx, "target"]
        act_peak_time = group.loc[act_idx, "target_timestamp"]

        # Predicted peak
        pred_idx = group[pred_col].idxmax()
        pred_peak_val = group.loc[pred_idx, pred_col]
        pred_peak_time = group.loc[pred_idx, "target_timestamp"]

        mag_error = pred_peak_val - act_peak_val
        timing_error_hours = abs((pred_peak_time - act_peak_time).total_seconds()) / 3600.0

        records.append({
            "origin_timestamp": origin,
            "actual_peak_mw": act_peak_val,
            "predicted_peak_mw": pred_peak_val,
            "peak_magnitude_error_mw": mag_error,
            "actual_peak_time": act_peak_time,
            "predicted_peak_time": pred_peak_time,
            "peak_timing_error_hours": timing_error_hours
        })

    df_peaks = pd.DataFrame(records)
    if len(df_peaks) == 0:
        logger.warning("No complete 24-hour windows found for peak evaluation!")
        return {}, pd.DataFrame()

    summary = {
        "total_evaluated_24h_windows": len(df_peaks),
        "mean_actual_peak_mw": float(df_peaks["actual_peak_mw"].mean()),
        "mean_predicted_peak_mw": float(df_peaks["predicted_peak_mw"].mean()),
        "mean_peak_magnitude_error_mw": float(df_peaks["peak_magnitude_error_mw"].mean()),
        "mae_peak_demand_mw": float(df_peaks["peak_magnitude_error_mw"].abs().mean()),
        "mean_absolute_peak_timing_error_hours": float(df_peaks["peak_timing_error_hours"].mean()),
        "exact_peak_hour_match_pct": float((df_peaks["peak_timing_error_hours"] == 0).mean() * 100.0),
        "within_1h_peak_match_pct": float((df_peaks["peak_timing_error_hours"] <= 1.0).mean() * 100.0)
    }

    logger.info(
        f"Peak Evaluation Summary ({len(df_peaks)} windows): "
        f"MAE Peak Demand = {summary['mae_peak_demand_mw']:.2f} MW, "
        f"Mean Peak Bias = {summary['mean_peak_magnitude_error_mw']:.2f} MW, "
        f"Mean Timing Error = {summary['mean_absolute_peak_timing_error_hours']:.2f} hours "
        f"({summary['within_1h_peak_match_pct']:.1f}% within +/- 1 hour)."
    )

    if metrics_dir is not None:
        metrics_dir.mkdir(parents=True, exist_ok=True)
        peak_csv = metrics_dir / "peak_metrics.csv"
        # Save summary at top or as separate file
        df_summary = pd.DataFrame([summary])
        df_summary.to_csv(metrics_dir / "peak_metrics_summary.csv", index=False)
        df_peaks.to_csv(peak_csv, index=False)
        logger.info(f"Saved {peak_csv} and peak_metrics_summary.csv")

    return summary, df_peaks
