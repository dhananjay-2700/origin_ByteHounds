from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class LoadData(Base):
    __tablename__ = "load_data"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    area_id = Column(String, index=True)
    feeder_id = Column(String, index=True)
    load_mw = Column(Float)

class WeatherData(Base):
    __tablename__ = "weather_data"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    rainfall = Column(Float, default=0.0)
    condition = Column(String, default="Sunny")

class Capacity(Base):
    __tablename__ = "capacity"
    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(String, index=True)
    feeder_id = Column(String, index=True)
    capacity_mw = Column(Float)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    area_id = Column(String, index=True)
    predicted_load = Column(Float)
    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)
    model_name = Column(String, default="XGBoost")

class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    area_id = Column(String, index=True)
    risk_score = Column(Integer)
    risk_level = Column(String)

class Anomaly(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    area_id = Column(String, index=True)
    expected_load = Column(Float)
    observed_load = Column(Float)
    deviation = Column(Float)
    severity = Column(String)
    why = Column(String)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    predicted_load = Column(Float)
    capacity = Column(Float)
    risk_level = Column(String)

