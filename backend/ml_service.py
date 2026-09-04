import pickle
import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import LoadData, WeatherData, Capacity

class MLService:
    def __init__(self):
        try:
            with open('model.pkl', 'rb') as f:
                self.model = pickle.load(f)
            with open('metrics.pkl', 'rb') as f:
                self.metrics = pickle.load(f)
        except FileNotFoundError:
            self.model = None
            self.metrics = None
            
    def evaluate_risk(self, predicted_load: float, capacity: float) -> str:
        utilization = predicted_load / capacity
        if utilization < 0.80:
            return "NORMAL"
        elif utilization < 0.95:
            return "WATCH"
        elif utilization <= 1.00:
            return "HIGH"
        else:
            return "CRITICAL"
            
    def get_forecast(self, db: Session, target_date: datetime):
        # In a real app, this would fetch actual weather forecasts and recent load
        # For the MVP, we'll generate predictions for the next 24 hours based on synthetic data
        
        areas = ['North', 'South', 'East', 'West']
        feeders = {'North': ['F1', 'F2'], 'South': ['F3'], 'East': ['F4'], 'West': ['F5']}
        
        forecast_df_list = []
        
        for area in areas:
            for feeder in feeders[area]:
                # We need features: 'hour', 'day_of_week', 'is_weekend', 'temperature', 'humidity', 
                # 'lag_1h', 'lag_24h', 'lag_7d', 'rolling_mean_24h'
                
                # Fetch recent history
                recent_load = db.query(LoadData).filter(
                    LoadData.area_id == area,
                    LoadData.feeder_id == feeder
                ).order_by(LoadData.timestamp.desc()).limit(24*7).all()
                
                if not recent_load:
                    continue
                    
                df_hist = pd.DataFrame([{
                    'timestamp': r.timestamp,
                    'load_mw': r.load_mw
                } for r in recent_load]).sort_values('timestamp')
                
                # Generate future timestamps
                last_time = df_hist['timestamp'].max()
                future_times = [last_time + timedelta(hours=i) for i in range(1, 25)]
                
                future_df = pd.DataFrame({'timestamp': future_times})
                future_df['hour'] = future_df['timestamp'].dt.hour
                future_df['day_of_week'] = future_df['timestamp'].dt.dayofweek
                future_df['is_weekend'] = (future_df['day_of_week'] >= 5).astype(int)
                
                # Mock weather forecast for the next 24h
                future_df['temperature'] = 25 + 10 * np.sin((future_df['hour'] - 8) * np.pi / 12) + np.random.normal(0, 2, 24)
                future_df['humidity'] = 50 + 20 * np.random.normal(0, 5, 24)
                
                # Lags based on history
                future_df['lag_1h'] = df_hist['load_mw'].iloc[-1]
                future_df['lag_24h'] = df_hist['load_mw'].iloc[-24:].values
                future_df['lag_7d'] = df_hist['load_mw'].iloc[:24].values
                future_df['rolling_mean_24h'] = df_hist['load_mw'].iloc[-24:].mean()
                
                features = ['hour', 'day_of_week', 'is_weekend', 'temperature', 'humidity', 
                            'lag_1h', 'lag_24h', 'lag_7d', 'rolling_mean_24h']
                            
                predictions = self.model.predict(future_df[features])
                future_df['predicted_load'] = predictions
                future_df['area_id'] = area
                future_df['feeder_id'] = feeder
                
                # Fetch capacity
                cap = db.query(Capacity).filter(
                    Capacity.area_id == area,
                    Capacity.feeder_id == feeder
                ).first()
                capacity_val = cap.capacity_mw if cap else 1000
                future_df['capacity'] = capacity_val
                
                forecast_df_list.append(future_df)
                
        if not forecast_df_list:
            return pd.DataFrame()
            
        return pd.concat(forecast_df_list, ignore_index=True)
        
    def get_feature_importances(self) -> dict:
        if not self.model:
            return {}
            
        importance = self.model.feature_importances_
        features = ['hour', 'day_of_week', 'is_weekend', 'temperature', 'humidity', 
                    'lag_1h', 'lag_24h', 'lag_7d', 'rolling_mean_24h']
        
        # Map back to readable names
        readable = {
            'temperature': 'Temperature',
            'lag_1h': 'Previous hour demand',
            'lag_24h': 'Previous day demand',
            'hour': 'Time of day',
            'day_of_week': 'Day pattern',
            'lag_7d': 'Previous week demand',
            'humidity': 'Humidity',
            'rolling_mean_24h': '24-hour average trend',
            'is_weekend': 'Weekend pattern'
        }
        
        imp_dict = {readable.get(f, f): float(imp) for f, imp in zip(features, importance)}
        return dict(sorted(imp_dict.items(), key=lambda item: item[1], reverse=True))

ml_service = MLService()
