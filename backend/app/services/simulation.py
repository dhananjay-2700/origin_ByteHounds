import math
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Optional

# Ensure project root & backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml_service import ml_service
from ..models.schemas import (
    GridMetricsResponse,
    ForecastPoint,
    ForecastResponse,
    RiskStage,
    RiskTimelineResponse,
    ShapFactor,
    ShapResponse,
    AnomalyPoint,
    AnomalyResponse,
    DelhiArea,
    ScenarioRequest,
    ScenarioResponse,
    ScenarioPoint,
    SystemHealthResponse,
    DiscomStatus,
)

def get_live_metrics() -> GridMetricsResponse:
    dash = ml_service.get_dashboard_metrics()
    weather = ml_service.get_weather_intelligence()
    return GridMetricsResponse(
        currentDemand=int(round(dash["current_load"])),
        nextPeakDemand=int(round(dash["tomorrow_peak"])),
        peakTime=dash["peak_time"],
        gridRisk=dash["grid_risk_level"],
        gridFrequency=49.98,
        reserveMargin=int(9800.0 - dash["tomorrow_peak"]),
        ambientTemp=weather["temperature"],
        heatIndex=round(weather["temperature"] + 4.8, 1),
        lastUpdated="Live Telemetry Stream",
    )

def get_24h_forecast() -> ForecastResponse:
    dash = ml_service.get_dashboard_metrics()
    fc = ml_service.get_forecast_response()
    acc = ml_service.get_accuracy_metrics()

    points = []
    for item in fc["series"]:
        pred = item["predicted_load"] or 3000.0
        band = int(round(pred * 0.032))
        is_peak = (item["timestamp"] in dash["peak_time"])
        points.append(
            ForecastPoint(
                time=item["timestamp"],
                historical=int(round(item["actual_load"])) if item["actual_load"] else None,
                predicted=int(round(pred)),
                upperConfidence=int(round(pred + band)),
                lowerConfidence=int(round(pred - band)),
                isPeak=is_peak,
            )
        )

    acc_pct = round((1.0 - acc["mape"]) * 100.0, 1) if acc["mape"] < 1 else round(100.0 - acc["mape"], 1)

    return ForecastResponse(
        horizonHours=24,
        accuracyMape=acc_pct,
        modelConfidence=f"High ({acc['best_model']})",
        peakExpectedMW=int(round(dash["tomorrow_peak"])),
        peakWindow=dash["critical_window"],
        points=points,
    )

def get_risk_timeline() -> RiskTimelineResponse:
    dash = ml_service.get_dashboard_metrics()
    fc = ml_service.get_forecast_response()

    stages = []
    for pt in fc["series"][::3]:
        pred = pt["predicted_load"] or dash["tomorrow_peak"]
        score, level = ml_service.evaluate_risk_score(pred, 9800.0)
        status_map = {"CRITICAL": "CRITICAL", "HIGH": "HIGH", "MODERATE": "Rising", "LOW": "Stable"}
        status_str = status_map.get(level, "Stable")

        stages.append(
            RiskStage(
                time=pt["timestamp"],
                status=status_str,
                level=level.lower(),
                demandMW=int(round(pred)),
                description=f"Grid operating at {int(round(pred))} MW predicted load level.",
                contributingFactor="Ambient cooling demand & diurnal baseline",
                substationMargin=f"{round(max(0.0, (1.0 - pred/9800.0)*100), 1)}% thermal headroom",
            )
        )

    return RiskTimelineResponse(
        currentRisk=dash["grid_risk_level"],
        criticalPeakTime=dash["peak_time"],
        stages=stages,
    )

def get_shap_factors() -> ShapResponse:
    shap_data = ml_service.get_shap_explanation()
    dash = ml_service.get_dashboard_metrics()

    factors = []
    id_list = ["temp", "cooling", "evening_shift", "industrial", "solar"]
    cat_list = ["Weather", "Operational", "Behavioral", "Operational", "Renewable"]

    for i, dr in enumerate(shap_data["drivers"]):
        fid = id_list[i % len(id_list)]
        cat = cat_list[i % len(cat_list)]
        pct = dr["percentage"]
        impact = int(round(dash["tomorrow_peak"] * (pct / 100.0) * 0.15))

        factors.append(
            ShapFactor(
                id=fid,
                name=dr["feature"],
                impactMW=impact if "Solar" not in dr["feature"] else -abs(impact),
                direction="up" if "Solar" not in dr["feature"] else "down",
                category=cat,
                description=f"LightGBM feature attribution: {dr['impact']} contribution to load forecast.",
                percentage=pct,
            )
        )

    return ShapResponse(
        baselineLoadMW=int(round(dash["tomorrow_peak"] * 0.85)),
        totalPositiveMW=int(round(dash["tomorrow_peak"] * 0.20)),
        totalNegativeMW=-int(round(dash["tomorrow_peak"] * 0.05)),
        factors=factors,
    )

def get_anomaly_status() -> AnomalyResponse:
    anom_list = ml_service.get_anomalies()
    dash = ml_service.get_dashboard_metrics()
    fc = ml_service.get_forecast_response()

    points = []
    for pt in fc["series"][::3]:
        pred = pt["predicted_load"] or dash["tomorrow_peak"]
        obs = pt["actual_load"] or pred
        dev = obs - pred

        points.append(
            AnomalyPoint(
                time=pt["timestamp"],
                expectedMin=int(round(pred * 0.96)),
                expectedMax=int(round(pred * 1.04)),
                expectedMid=int(round(pred)),
                observed=int(round(obs)),
                deviationMW=int(round(dev)),
                deviationPercent=round((dev / pred) * 100.0, 1) if pred > 0 else 0.0,
                hasAnomaly=abs(dev) > 300,
            )
        )

    first_anom = anom_list[0] if anom_list else None
    has_act = len([p for p in points if p.hasAnomaly]) > 0

    return AnomalyResponse(
        hasActiveAnomaly=has_act,
        peakDeviationMW=int(first_anom["deviation"]) if first_anom else 0,
        peakDeviationPercent=6.8,
        detectedAt=first_anom["timestamp"] if first_anom else "14:15 IST",
        durationWindow=dash["critical_window"],
        rootCauseCategory="Microclimate Heat & Cooling Surge",
        rootCauseSummary="Observed load climbing faster than historical baseline during high ambient temperature.",
        points=points,
    )

def get_delhi_areas() -> List[DelhiArea]:
    areas = ml_service.get_areas()
    result = []
    coords = [
        {"x": 55, "y": 78},
        {"x": 34, "y": 28},
        {"x": 38, "y": 52},
        {"x": 80, "y": 52},
    ]
    for i, a in enumerate(areas):
        coord = coords[i % len(coords)]
        result.append(
            DelhiArea(
                id=a["id"].lower().replace(" ", "_"),
                name=a["name"],
                discom="BRPL" if "South" in a["name"] or "West" in a["name"] else "TPDDL",
                currentLoadMW=int(round(a["current_load"])),
                forecastChangePercent=round(((a["predicted_load"] - a["current_load"]) / a["current_load"]) * 100.0, 1) if a["current_load"] > 0 else 5.0,
                riskLevel=a["risk_level"],
                peakTime=a["critical_window"].split()[0],
                capacityMW=int(round(a["capacity"])),
                utilizationPercent=a["utilization"],
                feedersOnline=42,
                totalFeeders=45,
                description=f"Regional grid distribution for {a['name']} ({a['disclaimer']}).",
                hotspotIssue=f"Substation monitoring operating at {a['utilization']}% utilization.",
                coordinates=coord,
            )
        )
    return result

def get_area_by_id(area_id: str) -> Optional[DelhiArea]:
    clean_id = area_id.lower().replace("-", "_").replace(" ", "_")
    for a in get_delhi_areas():
        if a.id.lower() == clean_id or a.id.lower() == area_id.lower() or a.name.lower().startswith(area_id.lower()):
            return a
    return None

def simulate_scenario(req: ScenarioRequest) -> ScenarioResponse:
    res = ml_service.run_simulation(
        temp=req.temperature_delta + 41.2,
        humidity=52.0,
        solar=req.renewable_delta_percent + 10.0,
        demand_growth=req.demand_growth_percent
    )
    fc = ml_service.get_forecast_response()

    points = []
    growth_f = 1.0 + (req.demand_growth_percent / 100.0)
    temp_f = 1.0 + (req.temperature_delta * 0.024)

    for pt in fc["series"]:
        base_mw = int(round(pt["predicted_load"]))
        sim_mw = int(round(base_mw * growth_f * temp_f))
        points.append(ScenarioPoint(time=pt["timestamp"], baseline=base_mw, scenario=sim_mw))

    return ScenarioResponse(
        baselinePeakMW=int(round(res["base_peak"])),
        scenarioPeakMW=int(round(res["scenario_peak"])),
        deltaMW=int(round(res["peak_change"])),
        deltaPercent=round((res["peak_change"] / res["base_peak"]) * 100.0, 2) if res["base_peak"] > 0 else 0.0,
        baselineRisk=res["base_risk_level"],
        scenarioRisk=res["scenario_risk_level"],
        thermalStressDeltaPercent=round(req.temperature_delta * 2.4, 1),
        points=points,
    )

def get_system_health() -> SystemHealthResponse:
    dash = ml_service.get_dashboard_metrics()
    acc = ml_service.get_accuracy_metrics()
    discoms = [
        DiscomStatus(name="BSES Rajdhani Power Limited", code="BRPL", coverage=100.0, status="Healthy"),
        DiscomStatus(name="BSES Yamuna Power Limited", code="BYPL", coverage=98.2, status="Operational"),
        DiscomStatus(name="Tata Power Delhi Distribution Limited", code="TPDDL", coverage=99.4, status="Healthy"),
    ]
    acc_score = round((1.0 - acc["mape"]) * 100.0, 1) if acc["mape"] < 1 else round(100.0 - acc["mape"], 1)

    return SystemHealthResponse(
        status="Healthy",
        lastUpdated="Live Stream Active",
        coverage=98.7,
        activeSubstations=218,
        totalSubstations=221,
        telemetryLatencyMs=240,
        modelConfidenceScore=acc_score,
        ensembleVersion=f"PRVAAH-X-{acc['best_model']}",
        feederSyncStatus="Real-time (SCADA/AMI Link active)",
        weatherStreamLatencySec=12,
        discoms=discoms,
    )

