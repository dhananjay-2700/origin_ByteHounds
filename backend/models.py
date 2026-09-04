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
    rainfall = Column(Float)

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
    actual_load = Column(Float, nullable=True)
    model_version = Column(String)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    predicted_load = Column(Float)
    capacity = Column(Float)
    risk_level = Column(String)
