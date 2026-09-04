"""
LightGBM Model Architecture for PRVAAH X Draft 1.
Provides model creation factory, serialization interfaces, and inference wrapper.
NOTE: In Draft 1 architecture foundation, models are created UNTRAINED.
.fit() is intentionally NOT executed in this step.
"""

import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
import lightgbm as lgb
import joblib

from ..config import LIGHTGBM_PARAMS, ALL_MODEL_FEATURES, MODELS_DIR

logger = logging.getLogger(__name__)


def create_model(config: Optional[Dict[str, Any]] = None) -> lgb.LGBMRegressor:
    """
    Factory function returning an UNTRAINED LightGBM Regressor configured
    with lightweight, production-oriented defaults.
    
    Args:
      config: Optional dictionary overriding default hyperparameters.
      
    Returns:
      Untrained lgb.LGBMRegressor instance.
    """
    params = LIGHTGBM_PARAMS.copy()
    if config:
        params.update(config)

    logger.info(f"Instantiating untrained LightGBM Regressor with params: {params}")
    model = lgb.LGBMRegressor(**params)
    return model


class LightGBMForecaster:
    """
    Forecaster wrapper encapsulating LightGBM model configuration,
    serialization, and multi-horizon inference interfaces.
    """

    def __init__(
        self,
        model: Optional[lgb.LGBMRegressor] = None,
        feature_names: Optional[List[str]] = None,
        config: Optional[Dict[str, Any]] = None
    ):
        self.config = config or LIGHTGBM_PARAMS.copy()
        self.feature_names = feature_names or ALL_MODEL_FEATURES.copy()
        self.model = model or create_model(self.config)
        self.is_fitted = False

    def predict(self, X: Any) -> Any:
        """
        Inference interface for generating demand forecasts.
        Fails loudly if invoked on an untrained model.
        """
        if not self.is_fitted:
            raise RuntimeError(
                "Model artifact not fitted or loaded! Train the model before inference."
            )
        return self.model.predict(X[self.feature_names])

    def get_feature_importances(self) -> pd.DataFrame:
        """Returns feature importances by split count and total gain."""
        if not self.is_fitted or self.model is None:
            raise RuntimeError("Model is not fitted!")

        booster = getattr(self.model, "booster_", None)
        if booster is None:
            raise RuntimeError("Model does not have a trained booster!")

        gain_imp = booster.feature_importance(importance_type="gain")
        split_imp = booster.feature_importance(importance_type="split")

        df_imp = pd.DataFrame({
            "feature": self.feature_names,
            "importance_gain": gain_imp,
            "importance_split": split_imp
        }).sort_values("importance_gain", ascending=False).reset_index(drop=True)

        return df_imp

    def save(self, model_dir: Optional[Path] = None) -> Path:
        """Serializes model checkpoint to disk."""
        target_dir = model_dir or MODELS_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        save_path = target_dir / "lightgbm_model.pkl"

        joblib.dump({
            "model": self.model,
            "feature_names": self.feature_names,
            "config": self.config,
            "is_fitted": self.is_fitted
        }, save_path)
        logger.info(f"Model saved to {save_path}")
        return save_path

    @classmethod
    def load(cls, model_dir: Optional[Path] = None) -> "LightGBMForecaster":
        """Deserializes model checkpoint from disk."""
        target_dir = model_dir or MODELS_DIR
        model_path = target_dir / "lightgbm_model.pkl"
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {model_path}. Train the model before inference."
            )

        data = joblib.load(model_path)
        forecaster = cls(
            model=data.get("model"),
            feature_names=data.get("feature_names"),
            config=data.get("config")
        )
        forecaster.is_fitted = data.get("is_fitted", False)
        return forecaster
