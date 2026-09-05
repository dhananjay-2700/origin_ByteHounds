"""
Visualization and plot generation module for GRIDWISE AI TimesFM 2.5 evaluation.
Generates high-resolution comparative plots for model benchmarking:
  1. Actual vs Predicted time-series curves
  2. 24-Hour forecast sample windows
  3. Peak summer demand day analysis (>7,500 MW)
  4. Error-by-horizon breakdown
"""

import logging
from pathlib import Path
from typing import Dict, Optional
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt

from ..config import PLOTS_DIR

logger = logging.getLogger(__name__)


def generate_all_evaluation_plots(
    test_matrix: pd.DataFrame,
    plots_dir: Optional[Path] = None
) -> Dict[str, Path]:
    """
    Generates comprehensive comparative plots saved under `ml/artifacts/plots/`.
    
    Expected columns in test_matrix:
      - origin_timestamp, target_timestamp, forecast_horizon, target
      - model prediction columns (e.g. lgb_pred, timesfm_zeroshot_pred, timesfm_lora_pred)
    """
    target_dir = plots_dir or PLOTS_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Generating evaluation plots under {target_dir}...")

    plot_paths = {}

    # Identify available prediction columns
    pred_cols = {}
    if "lgb_pred" in test_matrix.columns:
        pred_cols["LightGBM Baseline"] = "lgb_pred"
    if "timesfm_zeroshot_pred" in test_matrix.columns:
        pred_cols["TimesFM 2.5 Zero-Shot"] = "timesfm_zeroshot_pred"
    if "timesfm_lora_pred" in test_matrix.columns:
        pred_cols["TimesFM 2.5 LoRA Fine-Tuned"] = "timesfm_lora_pred"

    if not pred_cols:
        logger.warning("No prediction columns found in test_matrix for plotting!")
        return {}

    # Set clean aesthetic style
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")

    # 1. ACTUAL VS PREDICTED TIME SERIES PLOT (Sample 1-week horizon=1 window)
    try:
        h1_df = test_matrix[test_matrix["forecast_horizon"] == 1].sort_values("target_timestamp").reset_index(drop=True)
        # Take a 1-week slice (168 hours)
        sample_slice = h1_df.iloc[:min(168, len(h1_df))]

        fig, ax = plt.subplots(figsize=(14, 6), dpi=300)
        ax.plot(sample_slice["target_timestamp"], sample_slice["target"], label="Actual Demand (MW)", color="black", linewidth=2.0)

        colors = {"LightGBM Baseline": "#1f77b4", "TimesFM 2.5 Zero-Shot": "#ff7f0e", "TimesFM 2.5 LoRA Fine-Tuned": "#2ca02c"}
        for name, col in pred_cols.items():
            if col in sample_slice.columns:
                ax.plot(sample_slice["target_timestamp"], sample_slice[col], label=name, color=colors.get(name, "blue"), linestyle="--", linewidth=1.5)

        ax.set_title("GRIDWISE AI — Actual vs Predicted Demand (1-Week H+1 Horizon)", fontsize=14, fontweight="bold")
        ax.set_xlabel("Target Timestamp", fontsize=11)
        ax.set_ylabel("Electricity Demand (MW)", fontsize=11)
        ax.legend(loc="upper right", frameon=True)
        fig.autofmt_xdate()
        fig.tight_layout()

        p1 = target_dir / "actual_vs_predicted.png"
        fig.savefig(p1)
        plt.close(fig)
        plot_paths["actual_vs_predicted"] = p1
    except Exception as e:
        logger.warning(f"Could not generate actual_vs_predicted.png: {e}")

    # 2. 24-HOUR FORECAST SAMPLE WINDOWS
    try:
        origins = test_matrix["origin_timestamp"].unique()
        sample_origin = origins[len(origins) // 2] if len(origins) > 0 else None

        if sample_origin is not None:
            w_df = test_matrix[test_matrix["origin_timestamp"] == sample_origin].sort_values("forecast_horizon")

            fig, ax = plt.subplots(figsize=(12, 5), dpi=300)
            ax.plot(w_df["forecast_horizon"], w_df["target"], label="Actual Demand", color="black", marker="o", linewidth=2)

            for name, col in pred_cols.items():
                if col in w_df.columns:
                    ax.plot(w_df["forecast_horizon"], w_df[col], label=name, marker="s", linestyle="--", linewidth=1.5)

            ax.set_title(f"GRIDWISE AI — 24-Hour Forecast Profile (Origin: {sample_origin})", fontsize=13, fontweight="bold")
            ax.set_xlabel("Forecast Horizon (Hours)", fontsize=11)
            ax.set_ylabel("Demand (MW)", fontsize=11)
            ax.set_xticks(range(1, 25))
            ax.legend(loc="best", frameon=True)
            fig.tight_layout()

            p2 = target_dir / "forecast_24h_samples.png"
            fig.savefig(p2)
            plt.close(fig)
            plot_paths["forecast_24h_samples"] = p2
    except Exception as e:
        logger.warning(f"Could not generate forecast_24h_samples.png: {e}")

    # 3. PEAK DAY ANALYSIS (High-demand summer day >6,500 MW)
    try:
        high_demand_origins = test_matrix[test_matrix["target"] >= 6500]["origin_timestamp"].unique()
        if len(high_demand_origins) > 0:
            peak_origin = high_demand_origins[0]
            p_df = test_matrix[test_matrix["origin_timestamp"] == peak_origin].sort_values("forecast_horizon")

            fig, ax = plt.subplots(figsize=(12, 5), dpi=300)
            ax.plot(p_df["forecast_horizon"], p_df["target"], label="Actual Peak Demand", color="#d62728", marker="o", linewidth=2.5)

            for name, col in pred_cols.items():
                if col in p_df.columns:
                    ax.plot(p_df["forecast_horizon"], p_df[col], label=name, marker="^", linestyle="--", linewidth=1.8)

            ax.set_title(f"GRIDWISE AI — Peak Demand Day Profile (Origin: {peak_origin})", fontsize=13, fontweight="bold", color="#d62728")
            ax.set_xlabel("Forecast Horizon (Hours)", fontsize=11)
            ax.set_ylabel("Demand (MW)", fontsize=11)
            ax.set_xticks(range(1, 25))
            ax.legend(loc="best", frameon=True)
            fig.tight_layout()

            p3 = target_dir / "peak_day_analysis.png"
            fig.savefig(p3)
            plt.close(fig)
            plot_paths["peak_day_analysis"] = p3
    except Exception as e:
        logger.warning(f"Could not generate peak_day_analysis.png: {e}")

    # 4. ERROR BY HORIZON CHART
    try:
        horizons = list(range(1, 25))
        fig, ax = plt.subplots(figsize=(12, 5), dpi=300)

        for name, col in pred_cols.items():
            if col in test_matrix.columns:
                maes = []
                for h in horizons:
                    sub = test_matrix[test_matrix["forecast_horizon"] == h]
                    mae = np.mean(np.abs(sub["target"] - sub[col])) if len(sub) > 0 else 0
                    maes.append(mae)
                ax.plot(horizons, maes, label=f"{name} MAE", marker="o", linewidth=2)

        ax.set_title("GRIDWISE AI — Forecast MAE by Horizon (H+1 to H+24)", fontsize=13, fontweight="bold")
        ax.set_xlabel("Forecast Horizon (Hours)", fontsize=11)
        ax.set_ylabel("Mean Absolute Error (MW)", fontsize=11)
        ax.set_xticks(horizons)
        ax.legend(loc="best", frameon=True)
        fig.tight_layout()

        p4 = target_dir / "error_by_horizon.png"
        fig.savefig(p4)
        plt.close(fig)
        plot_paths["error_by_horizon"] = p4
    except Exception as e:
        logger.warning(f"Could not generate error_by_horizon.png: {e}")

    logger.info(f"Generated {len(plot_paths)} evaluation plots in {target_dir}")
    return plot_paths
