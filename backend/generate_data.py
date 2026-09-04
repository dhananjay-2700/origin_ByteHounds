import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
import pickle
import os

from database import engine, Base
import models

# Recreate tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def generate_mock_data():
    np.random.seed(42)
    end_date = datetime(2026, 9, 4, 23, 0)
    start_date = end_date - timedelta(days=90)
    
    dates = pd.date_range(start=start_date, end=end_date, freq='H')
    n_samples = len(dates)
    
    areas = ['North', 'South', 'East', 'West']
    feeders = {'North': ['F1', 'F2'], 'South': ['F3'], 'East': ['F4'], 'West': ['F5']}
    
    df_list = []
    
    for area in areas:
        for feeder in feeders[area]:
            # Base load with daily pattern
            hour = dates.hour
            base_load = 1000 + 500 * np.sin((hour - 6) * np.pi / 12)  # Peak around 12-18
            
            # Weekend effect
            is_weekend = dates.dayofweek >= 5
            base_load = np.where(is_weekend, base_load * 0.8, base_load)
            
            # Weather effect (summer peak)
            temperature = 25 + 10 * np.sin((hour - 8) * np.pi / 12) + np.random.normal(0, 2, n_samples)
            humidity = 50 + 20 * np.random.normal(0, 5, n_samples)
            
            # Demand = Base + Temp correlation + noise
            load_mw = base_load + (temperature - 25) * 20 + np.random.normal(0, 50, n_samples)
            load_mw = np.maximum(load_mw, 500) # Minimum load
            
            # Capacity 
            capacity_mw = 1800 if area == 'North' else 1500
            
            df = pd.DataFrame({
                'timestamp': dates,
                'area_id': area,
                'feeder_id': feeder,
                'load_mw': load_mw,
                'temperature': temperature,
                'humidity': humidity,
                'capacity_mw': capacity_mw
            })
            df_list.append(df)
            
    return pd.concat(df_list, ignore_index=True)

def feature_engineering(df):
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    df = df.sort_values(by=['area_id', 'feeder_id', 'timestamp'])
    df['lag_1h'] = df.groupby(['area_id', 'feeder_id'])['load_mw'].shift(1)
    df['lag_24h'] = df.groupby(['area_id', 'feeder_id'])['load_mw'].shift(24)
    df['lag_7d'] = df.groupby(['area_id', 'feeder_id'])['load_mw'].shift(24*7)
    df['rolling_mean_24h'] = df.groupby(['area_id', 'feeder_id'])['load_mw'].transform(lambda x: x.rolling(24, min_periods=1).mean())
    
    return df.dropna()

def train_model_and_populate_db():
    print("Generating mock data...")
    df = generate_mock_data()
    
    # Save Capacity configuration
    capacity_df = df[['area_id', 'feeder_id', 'capacity_mw']].drop_duplicates()
    capacity_df.to_sql('capacity', con=engine, if_exists='append', index=False)
    
    # Save Load and Weather data (just last 30 days to keep db small)
    recent_df = df[df['timestamp'] >= (df['timestamp'].max() - timedelta(days=30))]
    load_df = recent_df[['timestamp', 'area_id', 'feeder_id', 'load_mw']]
    load_df.to_sql('load_data', con=engine, if_exists='append', index=False)
    
    weather_df = recent_df[['timestamp', 'temperature', 'humidity']].drop_duplicates()
    weather_df['rainfall'] = 0.0
    weather_df.to_sql('weather_data', con=engine, if_exists='append', index=False)
    
    print("Engineering features...")
    features_df = feature_engineering(df)
    
    # Train test split
    train_end = features_df['timestamp'].max() - timedelta(days=7)
    train_df = features_df[features_df['timestamp'] <= train_end]
    test_df = features_df[features_df['timestamp'] > train_end]
    
    features = ['hour', 'day_of_week', 'is_weekend', 'temperature', 'humidity', 
                'lag_1h', 'lag_24h', 'lag_7d', 'rolling_mean_24h']
    target = 'load_mw'
    
    X_train = train_df[features]
    y_train = train_df[target]
    X_test = test_df[features]
    y_test = test_df[target]
    
    print("Training XGBoost model...")
    model = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = mean_squared_error(y_test, y_pred, squared=False)
    mape = mean_absolute_percentage_error(y_test, y_pred)
    print(f"MAE: {mae:.2f}, RMSE: {rmse:.2f}, MAPE: {mape:.2f}")
    
    # Save model and metrics
    with open('model.pkl', 'wb') as f:
        pickle.dump(model, f)
        
    metrics = {'mae': mae, 'rmse': rmse, 'mape': mape}
    with open('metrics.pkl', 'wb') as f:
        pickle.dump(metrics, f)
        
    print("Database populated and model trained successfully.")

if __name__ == "__main__":
    train_model_and_populate_db()
