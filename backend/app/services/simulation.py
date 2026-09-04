import math
from typing import List, Dict, Tuple
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

# Realistic baseline hourly forecast for Delhi
BASE_HOURLY_DATA: List[Dict] = [
    {"time": "00:00", "historical": 5420, "predicted": 5410, "upper": 5560, "lower": 5260},
    {"time": "02:00", "historical": 4980, "predicted": 4990, "upper": 5120, "lower": 4850},
    {"time": "04:00", "historical": 4710, "predicted": 4720, "upper": 4860, "lower": 4580},
    {"time": "06:00", "historical": 5120, "predicted": 5100, "upper": 5250, "lower": 4950},
    {"time": "08:00", "historical": 6150, "predicted": 6130, "upper": 6300, "lower": 5960},
    {"time": "10:00", "historical": 6940, "predicted": 6910, "upper": 7100, "lower": 6720},
    {"time": "12:00", "historical": 7450, "predicted": 7480, "upper": 7680, "lower": 7280},
    {"time": "14:00", "historical": 7890, "predicted": 7850, "upper": 8050, "lower": 7650},
    {"time": "16:00", "historical": 8120, "predicted": 8150, "upper": 8360, "lower": 7940},
    {"time": "17:00", "predicted": 8520, "upper": 8760, "lower": 8290},
    {"time": "17:45", "predicted": 8740, "upper": 9010, "lower": 8480, "isPeak": True},
    {"time": "19:00", "predicted": 8390, "upper": 8640, "lower": 8140},
    {"time": "21:00", "predicted": 7820, "upper": 8080, "lower": 7570},
    {"time": "22:00", "predicted": 7180, "upper": 7420, "lower": 6930},
    {"time": "23:00", "predicted": 6380, "upper": 6600, "lower": 6160},
]

def get_live_metrics() -> GridMetricsResponse:
    return GridMetricsResponse(
        currentDemand=8120,
        nextPeakDemand=8740,
        peakTime="17:45",
        gridRisk="HIGH",
        gridFrequency=49.98,
        reserveMargin=460,
        ambientTemp=41.4,
        heatIndex=46.2,
        lastUpdated="17:32:08 IST",
    )

def get_24h_forecast() -> ForecastResponse:
    points = [
        ForecastPoint(
            time=d["time"],
            historical=d.get("historical"),
            predicted=d["predicted"],
            upperConfidence=d["upper"],
            lowerConfidence=d["lower"],
            isPeak=d.get("isPeak", False),
        )
        for d in BASE_HOURLY_DATA
    ]
    return ForecastResponse(
        horizonHours=24,
        accuracyMape=94.8,
        modelConfidence="High (Ensemble v4.2)",
        peakExpectedMW=8740,
        peakWindow="17:00 - 18:30 IST",
        points=points,
    )

def get_risk_timeline() -> RiskTimelineResponse:
    stages = [
        RiskStage(
            time="12:00",
            status="Stable",
            level="stable",
            demandMW=7450,
            description="400kV inter-regional transit links running within thermal rating (72% load factor).",
            contributingFactor="Rooftop solar contributing 410 MW across residential clusters.",
            substationMargin="18.4% thermal headroom",
        ),
        RiskStage(
            time="14:00",
            status="Rising",
            level="rising",
            demandMW=7890,
            description="Commercial cooling load surge across Central and South Delhi districts.",
            contributingFactor="Ambient temperature reached 40.8°C; wet-bulb depression narrowing.",
            substationMargin="14.2% thermal headroom",
        ),
        RiskStage(
            time="16:00",
            status="Elevated",
            level="elevated",
            demandMW=8120,
            description="Domestic transition beginning. Inverter AC concurrency increasing steadily.",
            contributingFactor="Rooftop solar generation dropping off rapidly due to evening sun angle.",
            substationMargin="8.9% thermal headroom",
        ),
        RiskStage(
            time="17:45",
            status="HIGH",
            level="high",
            demandMW=8740,
            description="Projected peak demand crunch. 6 major 220kV transformers operating above 91% capacity.",
            contributingFactor="Simultaneous domestic AC ramp + EV charging + transit load concurrence.",
            substationMargin="3.8% critical headroom",
        ),
        RiskStage(
            time="19:00",
            status="Normalizing",
            level="normalizing",
            demandMW=8390,
            description="Peak plateau gently easing. Thermal stress stabilizing across distribution transformers.",
            contributingFactor="Commercial district offices initiating programmed off-peak HVAC curtailment.",
            substationMargin="9.6% thermal headroom",
        ),
    ]
    return RiskTimelineResponse(
        currentRisk="HIGH",
        criticalPeakTime="17:45",
        stages=stages,
    )

def get_shap_factors() -> ShapResponse:
    factors = [
        ShapFactor(
            id="temp",
            name="Ambient Temperature (+3.2°C anomaly)",
            impactMW=420,
            direction="up",
            category="Weather",
            description="Delhi NCR temperature 41.4°C vs 38.2°C seasonal norm drives immediate chiller baseline increases.",
            percentage=38,
        ),
        ShapFactor(
            id="cooling",
            name="Cooling Degree Hours (HVAC Load)",
            impactMW=310,
            direction="up",
            category="Operational",
            description="Accumulated building thermal mass forcing constant AC compressor duty cycles without thermal relief.",
            percentage=28,
        ),
        ShapFactor(
            id="evening_shift",
            name="Domestic Peak Convergence (17:30-18:30)",
            impactMW=180,
            direction="up",
            category="Behavioral",
            description="Commuter returns, residential lighting, appliance surge, and electric transit dispatch.",
            percentage=16,
        ),
        ShapFactor(
            id="industrial",
            name="Industrial Feeder Baseline",
            impactMW=90,
            direction="up",
            category="Operational",
            description="Bawana and Okhla manufacturing zones running full-shift production preceding weekend cycles.",
            percentage=8,
        ),
        ShapFactor(
            id="solar",
            name="Distributed Rooftop Solar Offset",
            impactMW=-140,
            direction="down",
            category="Renewable",
            description="Over 280 MW of distributed behind-the-meter solar arrays absorbing daytime sub-transmission demand.",
            percentage=13,
        ),
        ShapFactor(
            id="dr_events",
            name="Automated Demand Response Dispatch",
            impactMW=-60,
            direction="down",
            category="Operational",
            description="Discom demand response signaling active with 14 commercial real estate hubs in Connaught Place & Saket.",
            percentage=5,
        ),
    ]
    return ShapResponse(
        baselineLoadMW=7510,
        totalPositiveMW=1000,
        totalNegativeMW=-200,
        factors=factors,
    )

def get_anomaly_status() -> AnomalyResponse:
    points = [
        AnomalyPoint(time="11:00", expectedMin=6900, expectedMax=7200, expectedMid=7050, observed=7040, deviationMW=-10, deviationPercent=-0.1, hasAnomaly=False),
        AnomalyPoint(time="12:00", expectedMin=7200, expectedMax=7550, expectedMid=7380, observed=7420, deviationMW=40, deviationPercent=0.5, hasAnomaly=False),
        AnomalyPoint(time="13:00", expectedMin=7400, expectedMax=7750, expectedMid=7580, observed=7640, deviationMW=60, deviationPercent=0.8, hasAnomaly=False),
        AnomalyPoint(time="14:00", expectedMin=7550, expectedMax=7900, expectedMid=7720, observed=7950, deviationMW=230, deviationPercent=3.0, hasAnomaly=False),
        AnomalyPoint(time="15:00", expectedMin=7600, expectedMax=7950, expectedMid=7780, observed=8230, deviationMW=450, deviationPercent=5.8, hasAnomaly=True),
        AnomalyPoint(time="15:45", expectedMin=7650, expectedMax=8000, expectedMid=7820, observed=8350, deviationMW=530, deviationPercent=6.8, hasAnomaly=True),
        AnomalyPoint(time="16:30", expectedMin=7800, expectedMax=8180, expectedMid=7990, observed=8410, deviationMW=420, deviationPercent=5.3, hasAnomaly=True),
        AnomalyPoint(time="17:15", expectedMin=8100, expectedMax=8550, expectedMid=8320, observed=8580, deviationMW=260, deviationPercent=3.1, hasAnomaly=False),
    ]
    return AnomalyResponse(
        hasActiveAnomaly=True,
        peakDeviationMW=530,
        peakDeviationPercent=6.8,
        detectedAt="15:45 IST",
        durationWindow="15:00 - 17:00 IST",
        rootCauseCategory="Microclimate Humidity & Particulate Haze",
        rootCauseSummary="Relative humidity climbed from 32% to 54% in 45 minutes across West & South-West Delhi combined with dust haze cutting rooftop solar generation by 42%.",
        points=points,
    )

def get_delhi_areas() -> List[DelhiArea]:
    return [
        DelhiArea(
            id="dwarka",
            name="Dwarka (Sector 6-22)",
            discom="BRPL",
            currentLoadMW=842,
            forecastChangePercent=7.2,
            riskLevel="Elevated",
            peakTime="18:10",
            capacityMW=960,
            utilizationPercent=87.7,
            feedersOnline=46,
            totalFeeders=48,
            description="High residential density with large apartment complexes driving intensive multi-split inverter AC draw.",
            hotspotIssue="Substation Sector 19 operating at 91% transformer oil thermal rating.",
            coordinates={"x": 28, "y": 64},
        ),
        DelhiArea(
            id="rohini",
            name="Rohini & Pitampura",
            discom="TPDDL",
            currentLoadMW=960,
            forecastChangePercent=8.9,
            riskLevel="High",
            peakTime="17:35",
            capacityMW=1050,
            utilizationPercent=91.4,
            feedersOnline=58,
            totalFeeders=60,
            description="Major residential and commercial mix across North-West Delhi experiencing simultaneous domestic ramping.",
            hotspotIssue="Feeder RH-04 running within 45 MW of protective relay trip threshold.",
            coordinates={"x": 34, "y": 28},
        ),
        DelhiArea(
            id="saket",
            name="Saket & South Delhi",
            discom="BRPL",
            currentLoadMW=715,
            forecastChangePercent=4.8,
            riskLevel="Elevated",
            peakTime="17:50",
            capacityMW=850,
            utilizationPercent=84.1,
            feedersOnline=40,
            totalFeeders=40,
            description="Commercial shopping malls, corporate towers, and upscale residential zones with automated HVAC control.",
            hotspotIssue="Demand-response protocol armed for Select Citywalk & district center chillers.",
            coordinates={"x": 55, "y": 78},
        ),
        DelhiArea(
            id="noida_link",
            name="Noida Border / East NCR",
            discom="BYPL",
            currentLoadMW=690,
            forecastChangePercent=9.4,
            riskLevel="Critical",
            peakTime="17:40",
            capacityMW=730,
            utilizationPercent=94.5,
            feedersOnline=36,
            totalFeeders=38,
            description="High interchange transit corridor with heavy residential EV night charging and shared NCR transmission ties.",
            hotspotIssue="Inter-tie line 220kV Ghazipur-Noida running at 94.5% line capacity limits.",
            coordinates={"x": 80, "y": 52},
        ),
        DelhiArea(
            id="janakpuri",
            name="Janakpuri & West Delhi",
            discom="BRPL",
            currentLoadMW=580,
            forecastChangePercent=5.1,
            riskLevel="Stable",
            peakTime="18:25",
            capacityMW=720,
            utilizationPercent=80.5,
            feedersOnline=32,
            totalFeeders=32,
            description="Established suburban residential grid with robust multi-feeder redundant ring topology.",
            hotspotIssue="Healthy reserve margin; acting as contingency transfer path for Dwarka spillover.",
            coordinates={"x": 38, "y": 52},
        ),
        DelhiArea(
            id="karol_bagh",
            name="Karol Bagh & Central",
            discom="BYPL",
            currentLoadMW=625,
            forecastChangePercent=6.7,
            riskLevel="Elevated",
            peakTime="16:50",
            capacityMW=710,
            utilizationPercent=88.0,
            feedersOnline=35,
            totalFeeders=36,
            description="Dense commercial market centers with high daytime showroom lighting and cooling equipment concentration.",
            hotspotIssue="Underground cable cooling capacity reduced by localized pavement heat island.",
            coordinates={"x": 50, "y": 44},
        ),
        DelhiArea(
            id="lajpat_nagar",
            name="Lajpat Nagar & South-East",
            discom="BYPL",
            currentLoadMW=640,
            forecastChangePercent=7.8,
            riskLevel="High",
            peakTime="18:05",
            capacityMW=700,
            utilizationPercent=91.4,
            feedersOnline=38,
            totalFeeders=40,
            description="High-density commercial bazaars transitioning to residential night load; multiple historical distribution choke points.",
            hotspotIssue="Distribution transformer DT-14 at Nehru Nagar under active thermal monitoring.",
            coordinates={"x": 65, "y": 65},
        ),
    ]

def simulate_scenario(req: ScenarioRequest) -> ScenarioResponse:
    # Physical/statistical factors:
    # 1. Temperature sensitivity: ~2.4% demand increase per degree C in Delhi summer conditions
    temp_factor = 1.0 + (req.temperature_delta * 0.024)
    # 2. Base growth
    growth_factor = 1.0 + (req.demand_growth_percent / 100.0)
    # 3. Solar PV generation offset
    solar_delta_mw = req.renewable_delta_percent * -4.2
    # 4. Industrial baseline change
    industrial_factor = 1.0 + (req.industrial_delta_percent * 0.008)

    baseline_peak = 8740
    scenario_peak = 0
    points: List[ScenarioPoint] = []

    for item in BASE_HOURLY_DATA:
        t_str = item["time"]
        hour = int(t_str.split(":")[0])
        baseline_mw = item["predicted"]

        is_daytime = 9 <= hour <= 17
        is_peak_hour = 16 <= hour <= 19

        sim_mw = baseline_mw * growth_factor * temp_factor * industrial_factor
        if is_daytime:
            sim_mw -= solar_delta_mw

        if is_peak_hour and req.temperature_delta > 0:
            sim_mw += req.temperature_delta * 38.0

        sim_int = int(round(sim_mw))
        if sim_int > scenario_peak:
            scenario_peak = sim_int

        points.append(ScenarioPoint(time=t_str, baseline=baseline_mw, scenario=sim_int))

    delta_mw = scenario_peak - baseline_peak
    delta_percent = round((delta_mw / baseline_peak) * 100.0, 2)

    scenario_risk = "High"
    if scenario_peak > 9100:
        scenario_risk = "Critical"
    elif scenario_peak > 8600:
        scenario_risk = "High"
    elif scenario_peak > 8000:
        scenario_risk = "Elevated"
    else:
        scenario_risk = "Stable"

    thermal_stress = round(delta_percent * 1.8, 1)

    return ScenarioResponse(
        baselinePeakMW=baseline_peak,
        scenarioPeakMW=scenario_peak,
        deltaMW=delta_mw,
        deltaPercent=delta_percent,
        baselineRisk="High",
        scenarioRisk=scenario_risk,
        thermalStressDeltaPercent=thermal_stress,
        points=points,
    )

def get_system_health() -> SystemHealthResponse:
    discoms = [
        DiscomStatus(name="BSES Rajdhani Power Limited", code="BRPL", coverage=100.0, status="Healthy"),
        DiscomStatus(name="BSES Yamuna Power Limited", code="BYPL", coverage=98.2, status="Operational"),
        DiscomStatus(name="Tata Power Delhi Distribution Limited", code="TPDDL", coverage=99.4, status="Healthy"),
    ]
    return SystemHealthResponse(
        status="Healthy",
        lastUpdated="17:32:08 IST",
        coverage=98.7,
        activeSubstations=218,
        totalSubstations=221,
        telemetryLatencyMs=240,
        modelConfidenceScore=94.8,
        ensembleVersion="GridNet-Delhi-v4.2-Hybrid",
        feederSyncStatus="Real-time (SCADA/AMI Link active)",
        weatherStreamLatencySec=12,
        discoms=discoms,
    )
