# GRIDWISE AI ML FOUNDATION — DRAFT 1

## Overview
**GRIDWISE AI** is a state-level electricity demand forecasting system engineered for the National Capital Territory of Delhi, India. 

This directory contains **Draft 1** of the machine learning system: a clean, lightweight, reproducible, and leakage-safe ML foundation designed to forecast the next **24 hours of electricity demand** in Megawatts (MW) using historical demand, aligned meteorological observations, and calendar patterns.

---

## 1. Datasets & Meteorological Source Decision

### A. Electricity Demand Data
- **File**: `powerdemand_5min_2021_to_2024_with weather.csv`
- **Coverage**: January 1, 2021 to December 12, 2024 (~4 full calendar years, 393,440 raw rows).
- **Temporal Resolution**: 5 minutes.
- **Target Variable**: `Power demand` (in Megawatts, MW).
  - Summary Statistics: Min = 1,302.08 MW, Mean = 3,960.74 MW, Max = 8,631.53 MW (reflecting Delhi's extreme seasonal heatwave demand).
  - Missing Values: 0 missing values in the raw demand column.
- **Embedded Weather Variables**: The power demand file contains embedded columns (`temp`, `dwpt`, `rhum`, `pres`, `wspd`), but **lacks** `apparent_temperature`, `precipitation`, and `cloud_cover`.

### B. Meteorological Data
- **File**: `open-meteo-28.65N77.27E231m.csv`
- **Location**: Delhi central coordinates (28.646748°N, 77.2748°E, elevation 231.0 m), Timezone: `Asia/Kolkata` (GMT+5:30).
- **Coverage**: January 1, 2021 00:00 to December 12, 2024 23:00 (34,608 contiguous hours).
- **Completeness**: Exactly 1-hour uniform cadence, 0 missing values, 0 duplicate timestamps.
- **Included Variables & Units**:
  - `temperature`: 2m air temperature (°C)
  - `apparent_temperature`: "Feels-like" temperature (°C)
  - `relative_humidity`: 2m relative humidity (%)
  - `dew_point`: 2m dew point temperature (°C)
  - `precipitation`: Liquid equivalent precipitation (mm)
  - `surface_pressure`: Atmospheric surface pressure (hPa)
  - `cloud_cover`: Total cloud cover fraction (%)
  - `wind_speed`: 10m horizontal wind speed (km/h)

### C. Weather Source Selection Rationale
We selected **Open-Meteo** as the single authoritative weather source because:
1. It contains **all 8 required meteorological variables** with precise units and zero missing entries.
2. It eliminates redundant weather duplication and conflicting sensor calibrations.
3. It guarantees seamless hourly alignment with the aggregated power demand timestamps.

---

## 2. Preprocessing & Gap Handling

### Hourly Aggregation
Raw 5-minute dispatch measurements are aggregated into hourly bins `[T, T+1h)`:
- `demand_mean`: Average electricity demand in the hour (primary target)
- `demand_max`: Maximum peak demand observed in the hour
- `demand_min`: Minimum demand in the hour
- `obs_count`: Number of 5-minute observations in the hour (12 = full complete hour)
- `is_incomplete`: Boolean flag for hours with $< 12$ observations (3.45% of hours)

### Missing Gap Strategy
1. **Short Gaps ($\le 2$ hours)**: Linear interpolation is applied between adjacent valid hours to maintain rolling time-series continuity. These hours are flagged with `is_interpolated = True`.
2. **Large Gaps ($> 2$ hours)**: Large missing periods (e.g. meter disconnects or data outages up to 58 hours) are **strictly preserved as missing (`NaN`)**. Downstream feature and target matrix generators drop samples falling into these gap intervals, preventing artificial hallucination of power consumption.
3. **Deterministic Sorting**: Timestamps are strictly verified as monotonic increasing with zero duplicate timestamps.

---

## 3. Forecasting Formulation

### Global Multi-Horizon Formulation
At any given forecast origin $T$:
- **Forecast Window**: Predict $T+1, T+2, \dots, T+24$ (next 24 hours).
- **Target**: $y_{T+h}$ where $h \in \{1, \dots, 24\}$.
- **Horizon Feature**: `forecast_horizon` $= h$ is included as an explicit numerical feature.
- **Global Model**: A single LightGBM regressor learns demand dynamics across all 24 horizons simultaneously, capturing both immediate persistence dynamics at $h=1$ and diurnal/weather cycles at $h=24$.

---

## 4. Feature Engineering

Total Feature Count: **38 Features**

### A. Historical Demand Features (Anchored Strictly at Origin $T$)
*Calculated using only information available at or before origin $T$ ($t \le T$):*
- **Demand Lags**: `lag_1h` ($y_T$), `lag_2h` ($y_{T-1}$), `lag_3h` ($y_{T-2}$), `lag_6h` ($y_{T-5}$), `lag_12h` ($y_{T-11}$), `lag_24h` ($y_{T-23}$), `lag_48h` ($y_{T-47}$), `lag_72h` ($y_{T-71}$), `lag_168h` ($y_{T-167}$).
- **Historical Rolling Statistics**:
  - `rolling_mean_3h`, `rolling_mean_6h`, `rolling_mean_12h`, `rolling_mean_24h`, `rolling_mean_168h`
  - `rolling_std_24h` (short-term load volatility)

### B. Target Meteorological & Calendar Features (at Target Time $T+h$)
- **Weather Conditions**: `temperature`, `apparent_temperature`, `relative_humidity`, `dew_point`, `precipitation`, `surface_pressure`, `cloud_cover`, `wind_speed`.
- **Derived Weather Interactions**:
  - `temperature_squared`: Captures non-linear cooling degree-day surge during peak summer temperatures.
  - `temp_humidity_interaction`: Captures heat-index / humidity discomfort demand.
- **Calendar & Temporal Features**: `hour`, `day_of_week`, `day_of_month`, `day_of_year`, `month`, `weekend`.
- **Cyclic Harmonic Features**:
  - `hour_sin`, `hour_cos` ($\text{period} = 24$)
  - `day_of_week_sin`, `day_of_week_cos` ($\text{period} = 7$)
  - `day_of_year_sin`, `day_of_year_cos` ($\text{period} = 365.25$)
- **Horizon Feature**: `forecast_horizon` ($1 \dots 24$).

---

## 5. Leakage Prevention & Audit

The pipeline enforces an automated, loud-failing leakage audit:
1. **Target Leakage**: For multi-step forecasts ($h > 1$), future intermediate demands $y_{T+1} \dots y_{T+h-1}$ are **never** used as lag inputs.
2. **Rolling Leakage**: Rolling averages are strictly computed on historical series up to origin $T$ ($t \le T$).
3. **Splitting Leakage**: Strict chronological ordering is enforced. Train timestamps occur strictly prior to Validation timestamps, which occur strictly prior to Test timestamps. No random shuffling is ever permitted.
4. **NaN Audit**: All training matrices are verified to contain zero NaNs.

---

## 6. Validation Methodology

Chronological split of valid forecast origins:
- **Train Set (70%)**: Jan 2021 – Dec 2023 (~330,000 training samples)
- **Validation Set (15%)**: Dec 2023 – Jul 2024 (~69,000 validation samples) — used for early stopping decisions.
- **Test Set (15%)**: Jul 2024 – Dec 2024 (~70,000 test samples) — strictly held out until final model evaluation.

---

## 7. Baseline Models

To ensure honest evaluation, LightGBM is benchmarked against three causal baselines:
1. **Previous Hour (Persistence)**: Predicts demand at origin $T$ for all future horizons ($\hat{y}_{T+h} = y_T$).
2. **Previous Day (24h Seasonal)**: Predicts demand from same hour of the preceding day ($\hat{y}_{T+h} = y_{T+h-24}$).
3. **Previous Week (168h Seasonal)**: Predicts demand from same hour of the preceding week ($\hat{y}_{T+h} = y_{T+h-168}$).

---

## 8. Primary Model & Peak Evaluation

### Model
- **Algorithm**: `LightGBM Regressor`
- **Hyperparameters**: `n_estimators=500`, `learning_rate=0.05`, `num_leaves=31`, `max_depth=-1`, `subsample=0.8`, `colsample_bytree=0.8`, `random_state=42`.
- **Early Stopping**: 30 rounds on validation set.

### Peak Demand Metrics
For every 24-hour forecast window:
- Actual Peak Demand vs. Predicted Peak Demand
- Peak Magnitude Error (MW) and MAE of Peak Demand (MW)
- Actual Peak Hour vs. Predicted Peak Hour
- Mean Absolute Peak Timing Error (hours)

---

## 9. Known Limitations (Draft 1)

1. **Weather Forecast vs. Observed**: In Draft 1 historical evaluation, actual observed Open-Meteo weather at $T+h$ is utilized. In real-world operational deployment, Numerical Weather Prediction (NWP) forecasts will be used. The feature pipeline accepts forecasted weather identically.
2. **Global Single-Model vs. Direct 24 Models**: A single global model learns all 24 horizons. Horizon-specific tuning or multi-task architectures can be benchmarked in Draft 2.

---

> [!NOTE]
> **Important Note on Draft 1 Execution**:
> Training and model evaluation are intentionally NOT performed in Draft 1 implementation.
> All data pipelines, feature transformations, baseline forecasters, and model interfaces are verified and ready for training in the next phase.

---

## 10. How to Train & Generate Predictions (Ready for Phase 2)

### Train the Model (When ready to train)
From project root:
```powershell
py ml/train.py
```
This will execute the full training pipeline, run the leakage audit, train LightGBM with early stopping, evaluate against baselines, and serialize all artifacts to `ml/artifacts/`.

### Generate 24-Hour Forecasts (Inference Interface)
CLI execution:
```powershell
py ml/predict.py --origin "2024-12-10 00:00:00"
```

Programmatic Python API:
```python
from ml.predict import predict_next_24_hours

# Once model artifacts are trained and present in ml/artifacts/models/:
df_forecast = predict_next_24_hours("2024-12-10 00:00:00")
print(df_forecast.head())
# Output Data Contract:
# ['timestamp', 'forecast_origin', 'forecast_horizon', 'predicted_demand']
```
*(Note: If called prior to training, `predict_next_24_hours` raises `FileNotFoundError("Model artifact not found. Train the model before inference.")`)*
