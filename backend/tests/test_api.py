import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db

# Initialize database schema and seeds for test suite
init_db()
client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "PravaahX"
    assert "credentials_config_file" in data

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_credentials_status():
    response = client.get("/api/credentials/status")
    assert response.status_code == 200
    data = response.json()
    assert "custom_model" in data
    assert "weather_service" in data
    assert "notifications" in data
    assert "database" in data

def test_live_telemetry():
    response = client.get("/api/telemetry/live")
    assert response.status_code == 200
    data = response.json()
    assert 1000 < data["currentDemand"] < 12000
    assert 48.0 < data["gridFrequency"] < 52.0
    assert data["gridRisk"] in ["STABLE", "RISING", "ELEVATED", "HIGH", "CRITICAL"]

def test_forecast_24h():
    response = client.get("/api/forecast/24h")
    assert response.status_code == 200
    data = response.json()
    assert len(data["points"]) >= 13
    for pt in data["points"]:
        assert pt["lowerConfidence"] <= pt["predicted"] <= pt["upperConfidence"]

def test_risk_timeline():
    response = client.get("/api/risk/timeline")
    assert response.status_code == 200
    data = response.json()
    assert "stages" in data
    assert len(data["stages"]) > 0

def test_explainability_shap():
    response = client.get("/api/explainability/shap")
    assert response.status_code == 200
    data = response.json()
    assert data["baselineLoadMW"] > 0
    assert len(data["factors"]) >= 4

def test_anomaly_current():
    response = client.get("/api/anomaly/current")
    assert response.status_code == 200
    data = response.json()
    assert "points" in data
    assert len(data["points"]) > 0

def test_delhi_areas():
    response = client.get("/api/areas")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    area_ids = [a["id"] for a in data]
    assert "south_delhi" in area_ids
    assert "north_delhi" in area_ids

def test_scenario_simulate():
    payload = {
        "temperature_delta": 3.0,
        "demand_growth_percent": 5.0,
        "renewable_delta_percent": 0.0,
        "industrial_delta_percent": 0.0,
    }
    response = client.post("/api/scenario/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenarioPeakMW"] > data["baselinePeakMW"]
    assert data["deltaMW"] > 0

def test_copilot_chat():
    payload = {"query": "What is current demand and grid frequency in Delhi?"}
    response = client.post("/api/copilot/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["reply"]) > 10
    assert len(data["metrics"]) > 0

def test_alerts_endpoints():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "active_alerts" in data
    assert "acknowledged_alerts" in data

    # Test acknowledgement
    ack_res = client.post(
        "/api/alerts/acknowledge",
        json={"alert_id": "ALT-DL-4002", "operator_name": "Test Runner Operator"},
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["acknowledged"] is True

def test_analytics_endpoints():
    summary_res = client.get("/api/analytics/summary")
    assert summary_res.status_code == 200
    assert summary_res.json()["all_time_peak_mw"] == 8656

    peaks_res = client.get("/api/analytics/historical-peaks")
    assert peaks_res.status_code == 200
    assert len(peaks_res.json()) >= 5

    discom_res = client.get("/api/analytics/discom-breakdown")
    assert discom_res.status_code == 200
    assert len(discom_res.json()) == 5

    power_res = client.get("/api/analytics/power-mix")
    assert power_res.status_code == 200
    assert len(power_res.json()) >= 5

    csv_res = client.get("/api/analytics/export-csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "time,predicted_mw" in csv_res.text

def test_model_endpoints():
    metrics_res = client.get("/api/model/metrics")
    assert metrics_res.status_code == 200
    data = metrics_res.json()
    assert "mape_percent" in data
    assert data["r2_score"] > 0.9

    retrain_res = client.post("/api/model/retrain", json={"dataset_name": "Test_Dataset.csv", "epochs": 20})
    assert retrain_res.status_code == 200
    assert retrain_res.json()["status"] == "SUCCESS"