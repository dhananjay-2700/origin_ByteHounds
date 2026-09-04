import asyncio
import logging
from datetime import datetime
from typing import List, Optional
import httpx
from sqlalchemy.orm import Session
from ..config import api_credentials
from ..db.models import GridAlert
from ..models.schemas import AlertItem, AlertListResponse

logger = logging.getLogger("GridwiseAlerts")

async def dispatch_webhook_notification(alert: GridAlert):
    """
    Sends an alert notification payload to configured Slack, Discord, or Custom Webhook.
    Executes asynchronously with a short timeout so grid operations are never blocked.
    """
    payload = {
        "text": f"🚨 *GRIDWISE ALERT: {alert.severity}* — {alert.title}\n"
                f"*Substation:* {alert.substation}\n"
                f"*Parameter:* {alert.parameter} = {alert.current_value} (Limit: {alert.threshold_value})\n"
                f"*Details:* {alert.message}\n"
                f"*Time:* {alert.timestamp.isoformat() if alert.timestamp else 'Now'}",
        "gridwise_alert": {
            "id": alert.alert_id,
            "severity": alert.severity,
            "substation": alert.substation,
            "title": alert.title,
            "value": alert.current_value,
            "threshold": alert.threshold_value,
        }
    }

    urls = []
    if api_credentials.SLACK_WEBHOOK_URL:
        urls.append(api_credentials.SLACK_WEBHOOK_URL)
    if api_credentials.DISCORD_WEBHOOK_URL:
        urls.append(api_credentials.DISCORD_WEBHOOK_URL)
    if api_credentials.CUSTOM_ALERT_WEBHOOK_URL:
        urls.append(api_credentials.CUSTOM_ALERT_WEBHOOK_URL)

    if not urls:
        logger.info(f"No alert webhooks configured for {alert.alert_id}. Skipping dispatch.")
        return

    async with httpx.AsyncClient(timeout=4.0) as client:
        for url in urls:
            try:
                resp = await client.post(url, json=payload)
                logger.info(f"Dispatched alert {alert.alert_id} to webhook {url[:25]}... Status: {resp.status_code}")
            except Exception as e:
                logger.warning(f"Failed to post alert to webhook {url[:25]}...: {e}")

def get_all_alerts(db: Session) -> AlertListResponse:
    """Fetches all active and acknowledged grid alerts."""
    records = db.query(GridAlert).order_by(GridAlert.timestamp.desc()).all()
    
    active = []
    acknowledged = []
    crit_count = 0
    warn_count = 0

    for r in records:
        item = AlertItem(
            id=r.id,
            alert_id=r.alert_id or f"ALT-{r.id}",
            timestamp=r.timestamp.isoformat() if r.timestamp else datetime.utcnow().isoformat(),
            severity=r.severity,
            title=r.title,
            message=r.message,
            substation=r.substation,
            parameter=r.parameter,
            current_value=float(r.current_value),
            threshold_value=float(r.threshold_value),
            acknowledged=bool(r.acknowledged),
            acknowledged_by=r.acknowledged_by,
            acknowledged_at=r.acknowledged_at.isoformat() if r.acknowledged_at else None,
        )
        if r.acknowledged:
            acknowledged.append(item)
        else:
            active.append(item)
            if r.severity == "CRITICAL":
                crit_count += 1
            elif r.severity in ("HIGH", "WARNING"):
                warn_count += 1

    return AlertListResponse(
        active_alerts=active,
        acknowledged_alerts=acknowledged,
        critical_count=crit_count,
        warning_count=warn_count,
        webhook_configured=api_credentials.has_alert_webhook(),
    )

def acknowledge_alert(db: Session, alert_id: str, operator: str) -> Optional[AlertItem]:
    """Marks an active alert as acknowledged by a control room operator."""
    record = db.query(GridAlert).filter(GridAlert.alert_id == alert_id).first()
    if not record:
        return None

    record.acknowledged = True
    record.acknowledged_by = operator
    record.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(record)

    return AlertItem(
        id=record.id,
        alert_id=record.alert_id,
        timestamp=record.timestamp.isoformat(),
        severity=record.severity,
        title=record.title,
        message=record.message,
        substation=record.substation,
        parameter=record.parameter,
        current_value=float(record.current_value),
        threshold_value=float(record.threshold_value),
        acknowledged=record.acknowledged,
        acknowledged_by=record.acknowledged_by,
        acknowledged_at=record.acknowledged_at.isoformat(),
    )
