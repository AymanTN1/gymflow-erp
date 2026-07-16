"""
GymFlow ML Service — FastAPI microservice for analytics and predictions.
Modules: Churn Prediction, Client Segmentation, Attendance Forecasting, Planning Optimization.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from models.churn_model import churn_predictor
from models.clustering_model import client_segmenter
from models.forecasting_model import attendance_forecaster
from optimization.planning_optimizer import planning_optimizer
from utils.feature_engineering import get_client_features


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Train models on startup."""
    print("=" * 50)
    print("  GymFlow ML Service - Demarrage")
    print("=" * 50)
    try:
        # Train churn model (uses synthetic data)
        churn_predictor.train()
        # Train forecasting model (uses DB data)
        attendance_forecaster.train()
        print("[ML Service] Tous les modeles sont prets!")
    except Exception as e:
        print(f"[ML Service] Erreur au demarrage: {e}")
    yield
    print("[ML Service] Arret du service")


app = FastAPI(
    title="GymFlow ML Service",
    description="Microservice d'analyse predictive pour la gestion de salle de sport",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend to call this service directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Health Check
# ==========================================

@app.get("/api/ml/health")
def health_check():
    return {
        "status": "ok",
        "service": "GymFlow ML Service",
        "modules": {
            "churn": churn_predictor.is_trained,
            "clustering": client_segmenter.is_trained,
            "forecasting": attendance_forecaster.is_trained,
            "optimization": True,
        }
    }


# ==========================================
# MODULE 1: Churn Prediction
# ==========================================

@app.get("/api/ml/churn/predictions")
def get_churn_predictions():
    """Get churn predictions for all clients."""
    try:
        features_df = get_client_features()
        if features_df.empty:
            return {"predictions": [], "message": "Aucun client trouve en base"}
        predictions = churn_predictor.predict(features_df)
        return {"predictions": predictions, "total": len(predictions)}
    except Exception as e:
        return {"error": str(e), "predictions": []}


@app.get("/api/ml/churn/predictions/{client_id}")
def get_client_churn(client_id: int):
    """Get detailed churn prediction for a specific client."""
    try:
        features_df = get_client_features()
        if features_df.empty:
            return {"error": "Aucun client trouve"}
        client_features = features_df[features_df["client_id"] == client_id]
        if client_features.empty:
            return {"error": f"Client {client_id} non trouve"}
        predictions = churn_predictor.predict(client_features)
        return predictions[0] if predictions else {"error": "Prediction impossible"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/ml/churn/stats")
def get_churn_stats():
    """Get global churn statistics."""
    try:
        features_df = get_client_features()
        if features_df.empty:
            return {"high_risk": 0, "medium_risk": 0, "low_risk": 0, "total": 0}
        predictions = churn_predictor.predict(features_df)
        high = len([p for p in predictions if p["risk_level"] == "ELEVE"])
        medium = len([p for p in predictions if p["risk_level"] == "MOYEN"])
        low = len([p for p in predictions if p["risk_level"] == "FAIBLE"])
        return {"high_risk": high, "medium_risk": medium, "low_risk": low, "total": len(predictions)}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/ml/churn/model-info")
def get_churn_model_info():
    """Get model performance metrics."""
    if not churn_predictor.is_trained:
        churn_predictor.train()
    return {
        "algorithms": ["Random Forest", "Logistic Regression"],
        "ensemble": "Weighted average (RF 60%, LR 40%)",
        "metrics": churn_predictor.metrics,
    }


# ==========================================
# MODULE 2: Client Segmentation
# ==========================================

@app.get("/api/ml/segments")
def get_segments():
    """Get segment summary."""
    try:
        features_df = get_client_features()
        if features_df.empty:
            return {"segments": [], "message": "Aucun client"}
        if not client_segmenter.is_trained:
            client_segmenter.train(features_df)
        summary = client_segmenter.get_segment_summary(features_df)
        return {"segments": summary, "metrics": client_segmenter.metrics}
    except Exception as e:
        return {"error": str(e), "segments": []}


@app.get("/api/ml/segments/clients")
def get_segment_clients():
    """Get all clients with their segment assignment."""
    try:
        features_df = get_client_features()
        if features_df.empty:
            return {"clients": []}
        if not client_segmenter.is_trained:
            client_segmenter.train(features_df)
        clients = client_segmenter.predict(features_df)
        return {"clients": clients, "total": len(clients)}
    except Exception as e:
        return {"error": str(e), "clients": []}


# ==========================================
# MODULE 3: Attendance Forecasting
# ==========================================

@app.get("/api/ml/forecast/daily")
def get_daily_forecast(days: int = 7):
    """Forecast daily attendance for the next N days."""
    try:
        if not attendance_forecaster.is_trained:
            attendance_forecaster.train()
        forecasts = attendance_forecaster.forecast_daily(min(days, 30))
        return {"forecasts": forecasts}
    except Exception as e:
        return {"error": str(e), "forecasts": []}


@app.get("/api/ml/forecast/hourly")
def get_hourly_forecast(date: str = None):
    """Forecast hourly attendance for a specific date."""
    try:
        if not attendance_forecaster.is_trained:
            attendance_forecaster.train()
        forecasts = attendance_forecaster.forecast_hourly(date)
        return {"forecasts": forecasts, "date": date}
    except Exception as e:
        return {"error": str(e), "forecasts": []}


@app.get("/api/ml/forecast/peak-hours")
def get_peak_hours():
    """Get peak hours analysis."""
    try:
        if not attendance_forecaster.is_trained:
            attendance_forecaster.train()
        return attendance_forecaster.get_peak_hours()
    except Exception as e:
        return {"error": str(e)}


# ==========================================
# MODULE 4: Planning Optimization (OR)
# ==========================================

@app.get("/api/ml/optimize/planning")
def optimize_planning():
    """Generate optimal weekly coach schedule using ILP."""
    try:
        result = planning_optimizer.optimize()
        return result
    except Exception as e:
        return {"error": str(e), "status": "FAILED"}


@app.get("/api/ml/optimize/current")
def get_current_optimization():
    """Get the last computed optimal schedule."""
    if planning_optimizer.last_solution:
        return planning_optimizer.last_solution
    # Auto-compute if not done yet
    try:
        return planning_optimizer.optimize()
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/ml/optimize/suggestions")
def get_optimization_suggestions():
    """Get improvement suggestions for the current schedule."""
    try:
        if not planning_optimizer.last_solution:
            planning_optimizer.optimize()
        return planning_optimizer.get_suggestions()
    except Exception as e:
        return {"error": str(e)}
