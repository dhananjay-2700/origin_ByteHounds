from typing import List
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.schemas import (
    AnalyticsSummaryResponse,
    HistoricalPeakRecord,
    DiscomShare,
    PowerSource,
)
from ..services.simulation import get_live_metrics, get_24h_forecast

router = APIRouter(prefix="/analytics", tags=["Grid Analytics & Historical Trends"])

HISTORICAL_PEAKS: List[HistoricalPeakRecord] = [
    HistoricalPeakRecord(
        year=2024,
        peak_mw=8656,
        date_time="June 19, 2024 at 15:05 IST",
        ambient_temp=45.2,
        notes="All-time historic record peak demand for Delhi NCT during severe heatwave.",
    ),
    HistoricalPeakRecord(
        year=2023,
        peak_mw=7695,
        date_time="June 29, 2023 at 23:30 IST",
        ambient_temp=38.6,
        notes="Previous summer record with significant night-time cooling AC load.",
    ),
    HistoricalPeakRecord(
        year=2022,
        peak_mw=7695,
        date_time="June 29, 2022 at 15:30 IST",
        ambient_temp=44.1,
        notes="Intense June heatwave crossing 7,500 MW threshold for the first time.",
    ),
    HistoricalPeakRecord(
        year=2021,
        peak_mw=7323,
        date_time="July 02, 2021 at 15:15 IST",
        ambient_temp=43.0,
        notes="Post-monsoon dry spell surge.",
    ),
    HistoricalPeakRecord(
        year=2020,
        peak_mw=6314,
        date_time="July 10, 2020 at 15:35 IST",
        ambient_temp=41.5,
        notes="Pandemic industrial dampening followed by domestic load rebound.",
    ),
]

DISCOM_DISTRIBUTION: List[DiscomShare] = [
    DiscomShare(
        name="BSES Rajdhani Power Limited",
        code="BRPL",
        current_demand_mw=3490,
        share_percent=43.0,
        peak_forecast_mw=3750,
        substations_count=138,
    ),
    DiscomShare(
        name="Tata Power Delhi Distribution Limited",
        code="TPDDL",
        current_demand_mw=2350,
        share_percent=28.9,
        peak_forecast_mw=2530,
        substations_count=92,
    ),
    DiscomShare(
        name="BSES Yamuna Power Limited",
        code="BYPL",
        current_demand_mw=1790,
        share_percent=22.0,
        peak_forecast_mw=1920,
        substations_count=74,
    ),
    DiscomShare(
        name="New Delhi Municipal Council",
        code="NDMC",
        current_demand_mw=410,
        share_percent=5.1,
        peak_forecast_mw=450,
        substations_count=22,
    ),
    DiscomShare(
        name="Military Engineer Services",
        code="MES",
        current_demand_mw=80,
        share_percent=1.0,
        peak_forecast_mw=90,
        substations_count=6,
    ),
]

DELHI_POWER_SOURCES: List[PowerSource] = [
    PowerSource(
        source="Central Generating Stations (NTPC Thermal Allocation)",
        type="Thermal Coal",
        capacity_mw=3800,
        current_generation_mw=3420,
        share_percent=42.1,
    ),
    PowerSource(
        source="Interstate Hydro Allocations (NHPC/BBMB/Tehri)",
        type="Hydro",
        capacity_mw=1850,
        current_generation_mw=1640,
        share_percent=20.2,
    ),
    PowerSource(
        source="Bawana & Pragati Combined Cycle Gas Turbines (CCGT)",
        type="Gas",
        capacity_mw=1500,
        current_generation_mw=1180,
        share_percent=14.5,
    ),
    PowerSource(
        source="Interstate Banking & Bilateral Long-Term Contracts",
        type="Interstate Contract",
        capacity_mw=1200,
        current_generation_mw=1050,
        share_percent=12.9,
    ),
    PowerSource(
        source="Distributed Rooftop Solar PV",
        type="Solar",
        capacity_mw=450,
        current_generation_mw=380,
        share_percent=4.7,
    ),
    PowerSource(
        source="Waste-to-Energy Plants (Ghazipur, Okhla, Bawana, Tehkhand)",
        type="Waste-to-Energy",
        capacity_mw=84,
        current_generation_mw=78,
        share_percent=1.0,
    ),
    PowerSource(
        source="Battery Energy Storage System (BESS Kilokari & Rani Bagh)",
        type="Storage",
        capacity_mw=40,
        current_generation_mw=32,
        share_percent=0.4,
    ),
]

@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary():
    """
    Returns high-level aggregate grid metrics, all-time records, Discom allocations,
    and current power generation mix across Delhi.
    """
    telemetry = get_live_metrics()
    return AnalyticsSummaryResponse(
        all_time_peak_mw=8656,
        all_time_peak_date="June 19, 2024 at 15:05 IST",
        current_day_peak_mw=telemetry.nextPeakDemand,
        forecast_next_peak_mw=8740,
        cooling_load_share_percent=52.4,
        cooling_degree_days=18.4,
        rooftop_solar_installed_mw=450,
        discoms=DISCOM_DISTRIBUTION,
        power_sources=DELHI_POWER_SOURCES,
        historical_peaks=HISTORICAL_PEAKS,
    )

@router.get("/historical-peaks", response_model=List[HistoricalPeakRecord])
def get_historical_peaks():
    """Returns Delhi's annual summer peak load milestones from 2020 to 2024."""
    return HISTORICAL_PEAKS

@router.get("/discom-breakdown", response_model=List[DiscomShare])
def get_discom_breakdown():
    """Returns demand distribution across the five Delhi distribution licensees."""
    return DISCOM_DISTRIBUTION

@router.get("/power-mix", response_model=List[PowerSource])
def get_power_mix():
    """Returns active generation and contract allocations supplying Delhi's grid."""
    return DELHI_POWER_SOURCES

@router.get("/export-csv")
def export_forecast_csv():
    """
    Generates and downloads a CSV export of the 24-hour forecasted demand timeline
    with confidence intervals and historical comparisons.
    """
    forecast = get_24h_forecast()
    
    csv_lines = ["time,predicted_mw,lower_confidence_mw,upper_confidence_mw,is_peak"]
    for pt in forecast.points:
        csv_lines.append(f"{pt.time},{pt.predicted},{pt.lowerConfidence},{pt.upperConfidence},{1 if pt.isPeak else 0}")
    
    csv_content = "\n".join(csv_lines)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=delhi_prvaah_x_forecast_24h.csv"},
    )
