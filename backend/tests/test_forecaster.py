from app.ml.forecaster import forecaster
from app.ml.shap_explainer import shap_explainer

def test_diurnal_forecaster():
    # Afternoon peak should be higher than early morning minimum
    night_point = forecaster.calculate_demand(hour=4, minute=0, temp_c=32.0, humidity_pct=50.0)
    peak_point = forecaster.calculate_demand(hour=17, minute=30, temp_c=44.0, humidity_pct=55.0)
    
    assert peak_point.predicted > night_point.predicted
    assert peak_point.upperConfidence > peak_point.predicted > peak_point.lowerConfidence
    assert peak_point.isPeak is True
    assert night_point.isPeak is False

def test_temperature_sensitivity():
    # Hotter day should demand more cooling load
    mild_point = forecaster.calculate_demand(hour=15, minute=0, temp_c=35.0, humidity_pct=40.0)
    extreme_point = forecaster.calculate_demand(hour=15, minute=0, temp_c=46.0, humidity_pct=40.0)
    
    assert extreme_point.predicted > mild_point.predicted

def test_shap_decomposition():
    shap = shap_explainer.compute_attributions(ambient_temp=42.0, humidity=50.0)
    assert shap.baselineLoadMW > 0
    assert shap.totalPositiveMW > 0
    assert len(shap.factors) >= 5
    
    # Verify attribution direction correctness
    for factor in shap.factors:
        assert factor.direction in ["up", "down"]
        assert factor.percentage >= 0
