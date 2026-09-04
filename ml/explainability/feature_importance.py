"""
Explainability module for GRIDWISE AI LightGBM model.
Computes gain and split feature importances, saves feature_importance.csv,
and provides optional SHAP explainability hooks with graceful fallback.
"""

import logging
from pathlib import Path
from typing import Optional, Any
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def extract_and_save_importance(
    forecaster: Any,
    metrics_dir: Path,
    X_sample: Optional[pd.DataFrame] = None
) -> pd.DataFrame:
    """
    Extracts feature importances (gain and split) and writes feature_importance.csv.
    Attempts basic SHAP summary if shap is installed, falling back gracefully without error.
    """
    metrics_dir.mkdir(parents=True, exist_ok=True)
    df_imp = forecaster.get_feature_importances()
    
    # Calculate percentage share of total gain
    total_gain = df_imp["importance_gain"].sum()
    if total_gain > 0:
        df_imp["gain_share_pct"] = (df_imp["importance_gain"] / total_gain) * 100.0
    else:
        df_imp["gain_share_pct"] = 0.0

    csv_path = metrics_dir / "feature_importance.csv"
    df_imp.to_csv(csv_path, index=False)
    logger.info(f"Saved feature importance table to {csv_path}")

    # Log top 15 features
    top15 = df_imp.head(15)
    logger.info("Top 15 Most Important Features by Gain:")
    for idx, r in top15.iterrows():
        logger.info(f"  {idx+1:2d}. {r['feature']:<28} | Gain: {r['importance_gain']:10.1f} ({r['gain_share_pct']:5.2f}%) | Splits: {int(r['importance_split']):4d}")

    # Optional SHAP check
    try:
        import shap  # type: ignore
        if X_sample is not None and len(X_sample) > 0:
            logger.info("SHAP is installed. Computing TreeExplainer on sample for explainability...")
            sample_sub = X_sample.sample(min(200, len(X_sample)), random_state=42)
            explainer = shap.TreeExplainer(forecaster.model)
            shap_values = explainer.shap_values(sample_sub[forecaster.feature_names])
            mean_abs_shap = np.abs(shap_values).mean(axis=0)
            df_shap = pd.DataFrame({
                "feature": forecaster.feature_names,
                "mean_abs_shap": mean_abs_shap
            }).sort_values("mean_abs_shap", ascending=False)
            df_shap.to_csv(metrics_dir / "shap_importance.csv", index=False)
            logger.info(f"Saved SHAP importance to {metrics_dir / 'shap_importance.csv'}")
    except ImportError:
        logger.info("SHAP is not installed. Skipping SHAP summary (LightGBM gain and split importances saved).")
    except Exception as e:
        logger.warning(f"Optional SHAP computation skipped due to error: {e}")

    return df_imp
