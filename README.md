# GRIDWISE AI - Project Walkthrough

Welcome to the **GRIDWISE AI** repository! This project is a state-level electricity demand forecasting system engineered for the National Capital Territory of Delhi, India. 

Here is a concise walkthrough of what we have built so far across the entire stack:

## 1. Machine Learning Foundation (`/ml`)
We established a robust machine learning pipeline designed to forecast the next 24 hours of electricity demand (in Megawatts) using historical load and Open-Meteo meteorological data.
* **Data Pipeline**: Aggregates 5-minute dispatch measurements into hourly bins and safely handles missing data.
* **Feature Engineering**: Built 38 features, including historical demand lags, weather conditions, derived weather interactions (e.g., cooling degree-day surges), and cyclic temporal features.
* **Modeling Strategy**: Configured a global LightGBM Regressor to predict 24 horizons simultaneously, complete with strict target leakage prevention and chronological splitting.
* **Status**: The core pipeline logic, baselines, and leakage audits are complete (Draft 1).

## 2. Backend Service (`/backend`)
We developed a scalable backend to serve our electricity demand forecasts to the user interface.
* **Framework**: Built a REST API using **FastAPI** (`GRIDWISE AI MVP API`).
* **Database**: Integrated a SQLite database (`gridwise.db`) via **SQLAlchemy** for storing and querying power demand data and model predictions.
* **ML Integration**: Created an `ml_service` module that loads the LightGBM model artifacts to serve real-time inference requests.

## 3. Frontend Application (`/frontend`)
We set up a modern user interface to visualize the power demand forecasts and provide actionable insights.
* **Framework**: Bootstrapped a **Next.js** application (using React 19).
* **Styling**: Configured **Tailwind CSS v4** for clean, responsive UI design.
* **Visualization**: Integrated **Recharts** for plotting historical and forecasted demand curves, and **Lucide React** for elegant UI iconography.

## Next Steps
- Finalize the training of the LightGBM model on the complete dataset.
- Wire up the frontend application to consume the FastAPI backend endpoints.
- Surface the predictive demand curves and insights on the interactive frontend dashboard.
