from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.schemas import (
    ModelRetrainRequest,
    ModelRetrainResponse,
    ModelMetricsResponse,
)
from ..services.calibration_service import calibration_service

router = APIRouter(prefix="/model", tags=["ML Model Management & Retraining"])

@router.get("/metrics", response_model=ModelMetricsResponse)
def get_model_metrics(db: Session = Depends(get_db)):
    """
    Returns the accuracy metrics, Mean Absolute Percentage Error (MAPE),
    Root Mean Square Error (RMSE), and feature attributions of the active ensemble forecaster.
    """
    return calibration_service.get_latest_metrics(db)

@router.post("/retrain", response_model=ModelRetrainResponse)
def trigger_retraining(request: ModelRetrainRequest = ModelRetrainRequest(), db: Session = Depends(get_db)):
    """
    Calibrates the ensemble demand forecaster against recent Delhi SCADA & meteorological observations.
    Updates temperature coefficients and records evaluation metrics.
    """
    return calibration_service.retrain_model(
        db=db,
        dataset_name=request.dataset_name or "Delhi_Historical_Load_Weather_Summer.csv",
        epochs=request.epochs or 50,
        lr=request.learning_rate or 0.005,
    )
