from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.schemas import (
    AlertListResponse,
    AlertItem,
    AlertAcknowledgeRequest,
    AlertWebhookTestRequest,
)
from ..services.alert_service import get_all_alerts, acknowledge_alert, dispatch_webhook_notification
from ..db.models import GridAlert

router = APIRouter(prefix="/alerts", tags=["Grid Alerts & Incidents"])

@router.get("", response_model=AlertListResponse)
def list_alerts(db: Session = Depends(get_db)):
    """
    Returns active and acknowledged grid security alerts, including transformer overload warnings,
    frequency excursions, and substation thermal distress incidents.
    """
    return get_all_alerts(db)

@router.post("/acknowledge", response_model=AlertItem)
def acknowledge_grid_alert(request: AlertAcknowledgeRequest, db: Session = Depends(get_db)):
    """
    Allows a control room operator or dispatch engineer to acknowledge an active alert.
    """
    updated = acknowledge_alert(db, request.alert_id, request.operator_name)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {request.alert_id} not found.")
    return updated

@router.post("/test-webhook")
async def test_webhook(req: AlertWebhookTestRequest = AlertWebhookTestRequest(), db: Session = Depends(get_db)):
    """
    Dispatches a test notification to configured Slack, Discord, or Custom Webhooks.
    """
    test_alert = GridAlert(
        alert_id="TEST-PING-001",
        severity="INFO",
        title="Gridwise AI Notification Pipeline Test",
        message="Verification ping: External webhook dispatcher is operational and connected to Delhi SCADA alerting.",
        substation="State Load Despatch Centre (SLDC)",
        parameter="PING",
        current_value=1.0,
        threshold_value=1.0,
    )
    await dispatch_webhook_notification(test_alert)
    return {
        "status": "DISPATCHED",
        "message": "Webhook test alert sent to configured external notification channels.",
    }
