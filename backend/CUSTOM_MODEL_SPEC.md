# PRVAAH X — Custom Model Interface Specification

This document details the exact input/output contracts for connecting your team's custom in-house trained model to all 7 platform intelligence features.

---

## Architecture Overview

Your model can be served as a local or remote microservice (e.g., FastAPI, vLLM, PyTorch, Triton, or Ollama) listening at:
`CUSTOM_MODEL_ENDPOINT` in `backend/app/config/api_credentials.py` (Default: `http://localhost:11434/api/generate` or `http://localhost:8080/predict`).

When a request arrives at the backend, it packages live Delhi SCADA telemetry and sends a POST request with:
```json
{
  "task": "<TASK_NAME>",
  "data": { ... }
}
```

---

## The 7 Core Tasks Your Model Can Handle

### 1. 24-Hour Load Forecasting
- **Task ID**: `forecast_24h`
- **Input Payload**:
```json
{
  "ambient_temp_c": 41.4,
  "relative_humidity": 48.0,
  "solar_irradiance_pct": 100.0,
  "current_demand_mw": 8120
}
```
- **Expected Model Output**:
```json
{
  "horizonHours": 24,
  "accuracyMape": 95.2,
  "modelConfidence": "Custom Ensemble v1.0",
  "peakExpectedMW": 8740,
  "peakWindow": "17:00 - 18:30 IST",
  "points": [
    {
      "time": "17:45",
      "predicted": 8740,
      "upperConfidence": 9010,
      "lowerConfidence": 8480,
      "isPeak": true
    }
  ]
}
```

---

### 2. Grid Risk & Headroom Staging
- **Task ID**: `risk_timeline`
- **Input Payload**:
```json
{
  "projected_peak_mw": 8740,
  "frequency_hz": 49.98,
  "ambient_temp_c": 41.4
}
```
- **Expected Model Output**:
```json
{
  "currentRisk": "HIGH",
  "criticalPeakTime": "17:45",
  "stages": [
    {
      "time": "17:45",
      "status": "HIGH",
      "level": "high",
      "demandMW": 8740,
      "description": "Projected peak demand crunch across primary 220kV rings.",
      "contributingFactor": "Domestic AC ramp + EV transit concurrence.",
      "substationMargin": "3.8% critical headroom"
    }
  ]
}
```

---

### 3. SHAP Feature Attribution
- **Task ID**: `explainability_shap`
- **Input Payload**:
```json
{
  "baseline_load_mw": 7510,
  "observed_load_mw": 8350,
  "ambient_temp_c": 41.4,
  "humidity": 48.0
}
```
- **Expected Model Output**:
```json
{
  "baselineLoadMW": 7510,
  "totalPositiveMW": 1000,
  "totalNegativeMW": -200,
  "factors": [
    {
      "id": "temp",
      "name": "Ambient Temperature (+3.2°C anomaly)",
      "impactMW": 420,
      "direction": "up",
      "category": "Weather",
      "description": "Elevated ambient heat driving chiller baseline surge.",
      "percentage": 38
    }
  ]
}
```

---

### 4. Anomaly Detection & Root Cause Analysis
- **Task ID**: `anomaly_detection`
- **Input Payload**:
```json
{
  "recent_demand_points": [7040, 7420, 7640, 7950, 8350],
  "expected_baseline": [7050, 7380, 7580, 7720, 7820]
}
```
- **Expected Model Output**:
```json
{
  "hasActiveAnomaly": true,
  "peakDeviationMW": 530,
  "peakDeviationPercent": 6.8,
  "detectedAt": "15:45 IST",
  "durationWindow": "15:00 - 17:00 IST",
  "rootCauseCategory": "Microclimate Humidity & Particulate Haze",
  "rootCauseSummary": "Sudden humidity surge combined with solar PV loss.",
  "points": [ ... ]
}
```

---

### 5. Regional Substation GIS Intelligence
- **Task ID**: `area_intelligence`
- **Input Payload**:
```json
{
  "discoms": ["BRPL", "BYPL", "TPDDL"],
  "timestamp": "17:30 IST"
}
```
- **Expected Model Output**: List of regional area objects with `id`, `name`, `currentLoadMW`, `capacityMW`, `utilizationPercent`, `riskLevel`, `hotspotIssue`.

---

### 6. What-If Scenario Counterfactuals
- **Task ID**: `scenario_simulate`
- **Input Payload**:
```json
{
  "temperature_delta": 3.0,
  "demand_growth_percent": 5.0,
  "renewable_delta_percent": -10.0,
  "industrial_delta_percent": 2.0
}
```
- **Expected Model Output**:
```json
{
  "baselinePeakMW": 8740,
  "scenarioPeakMW": 9320,
  "deltaMW": 580,
  "deltaPercent": 6.64,
  "baselineRisk": "High",
  "scenarioRisk": "Critical",
  "thermalStressDeltaPercent": 11.9,
  "points": [ ... ]
}
```

---

### 7. Conversational Copilot Guidance
- **Task ID**: `copilot_chat`
- **Input Payload**:
```json
{
  "query": "What is current demand and frequency in Delhi?",
  "live_telemetry": {
    "demand_mw": 8120,
    "frequency_hz": 49.98,
    "ambient_temp": 41.4,
    "reserve_margin": 460
  }
}
```
- **Expected Model Output**:
```json
{
  "reply": "Telemetry analysis confirms the Delhi grid is operating at 8,120 MW with frequency at 49.98 Hz...",
  "metrics": [
    {"label": "Current Demand", "value": "8,120 MW"},
    {"label": "Frequency", "value": "49.98 Hz"}
  ]
}
```

---

## Zero-Downtime Guarantee

If your model endpoint is offline, returning HTTP 500, or currently being retrained:
**PRVAAH X automatically falls back to its built-in Delhi physics & domain rules engine.**
Your dashboard, APIs, and WebSockets will continue operating 100% of the time with zero downtime.
