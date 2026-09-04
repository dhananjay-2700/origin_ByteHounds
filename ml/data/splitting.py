"""
Chronological dataset splitting module for GRIDWISE AI.
Enforces strict temporal ordering: Train < Validation < Test.
Zero random sampling or shuffling.
"""

import logging
from typing import Tuple, Dict, Any
import pandas as pd

from ..config import TRAIN_RATIO, VAL_RATIO, TEST_RATIO

logger = logging.getLogger(__name__)


def split_chronological(
    origins: pd.Series,
    train_ratio: float = TRAIN_RATIO,
    val_ratio: float = VAL_RATIO,
    test_ratio: float = TEST_RATIO
) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """
    Partitions forecast origin timestamps strictly chronologically.
    
    Args:
      origins: Series of unique, chronologically ordered forecast origin timestamps.
      train_ratio: Fraction for training (default 0.70).
      val_ratio: Fraction for validation (default 0.15).
      test_ratio: Fraction for test (default 0.15).
      
    Returns:
      (train_origins, val_origins, test_origins)
    """
    if not origins.is_monotonic_increasing:
        raise ValueError("Origins must be strictly monotonic increasing before chronological splitting!")

    if abs((train_ratio + val_ratio + test_ratio) - 1.0) > 1e-5:
        raise ValueError(f"Split ratios must sum to 1.0. Got: {train_ratio + val_ratio + test_ratio}")

    n = len(origins)
    n_train = int(train_ratio * n)
    n_val = int(val_ratio * n)
    n_test = n - n_train - n_val

    train_origins = origins.iloc[:n_train].reset_index(drop=True)
    val_origins = origins.iloc[n_train:n_train + n_val].reset_index(drop=True)
    test_origins = origins.iloc[n_train + n_val:].reset_index(drop=True)

    logger.info(
        f"Chronological split completed for {n:,} origins: "
        f"Train={len(train_origins):,} ({train_origins.min()} to {train_origins.max()}), "
        f"Val={len(val_origins):,} ({val_origins.min()} to {val_origins.max()}), "
        f"Test={len(test_origins):,} ({test_origins.min()} to {test_origins.max()})"
    )
    return train_origins, val_origins, test_origins


def get_split_summary(
    train_origins: pd.Series,
    val_origins: pd.Series,
    test_origins: pd.Series
) -> Dict[str, Any]:
    """Returns metadata summary of chronological splits."""
    return {
        "train": {
            "count": len(train_origins),
            "start": str(train_origins.min()),
            "end": str(train_origins.max())
        },
        "validation": {
            "count": len(val_origins),
            "start": str(val_origins.min()),
            "end": str(val_origins.max())
        },
        "test": {
            "count": len(test_origins),
            "start": str(test_origins.min()),
            "end": str(test_origins.max())
        }
    }
