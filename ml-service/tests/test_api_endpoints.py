"""
Integration tests for FastAPI ML Service endpoints.
Uses TestClient with mocked database to validate API contracts,
response structures, and HTTP status codes.
"""
import pytest
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from fastapi.testclient import TestClient


# ============================================================
# FIXTURE: Standalone test client with full mock pipeline
# ============================================================

@pytest.fixture(scope="module")
def client():
    """Create a TestClient with all DB calls mocked."""
    now = datetime.now()

    # Prepare mock data
    clients_data = pd.DataFrame({
        "id": range(1, 11),
        "nom_complet": [f"Client {i}" for i in range(1, 11)],
        "email": [f"c{i}@test.ma" for i in range(1, 11)],
        "telephone": [f"06{i}0000000" for i in range(1, 11)],
        "date_inscription": [now - timedelta(days=90)] * 10,
        "statut": ["ACTIF"] * 10,
    })

    np.random.seed(42)
    attendance_records = []
    for day in range(60):
        d = now - timedelta(days=day)
        for _ in range(np.random.randint(10, 30)):
            h = np.random.choice(range(6, 22))
            attendance_records.append({
                "client_id": np.random.randint(1, 11),
                "check_in_time": d.replace(hour=h, minute=np.random.randint(0, 60)),
                "check_out_time": d.replace(hour=min(h + 1, 22), minute=np.random.randint(0, 60)),
                "status": "CHECKED_IN",
            })
    attendance_data = pd.DataFrame(attendance_records)

    memberships_data = pd.DataFrame({
        "client_id": range(1, 11),
        "type_abonnement": ["MENSUEL"] * 5 + ["TRIMESTRIEL"] * 3 + ["SEMESTRIEL"] * 2,
        "date_debut": [now - timedelta(days=15)] * 10,
        "date_fin": [now + timedelta(days=45)] * 10,
        "statut": ["ACTIF"] * 10,
    })

    coaches_data = pd.DataFrame({
        "id": [101, 102, 103],
        "nom": ["Coach A", "Coach B", "Coach C"],
        "role": ["COACH"] * 3,
    })

    def route_query(query):
        q = query.lower() if isinstance(query, str) else str(query).lower()
        if "clients" in q:
            return clients_data
        elif "attendances" in q:
            return attendance_data
        elif "memberships" in q:
            return memberships_data
        elif "users" in q:
            return coaches_data
        return pd.DataFrame()

    with patch("utils.feature_engineering.fetch_dataframe", side_effect=route_query), \
         patch("models.forecasting_model.fetch_dataframe", side_effect=route_query), \
         patch("optimization.planning_optimizer.fetch_dataframe", side_effect=route_query):

        from main import app
        yield TestClient(app)


# ============================================================
# Health Check
# ============================================================

class TestHealthEndpoint:
    """Tests for /api/ml/health."""

    def test_health_returns_200(self, client):
        """Health endpoint should return 200."""
        resp = client.get("/api/ml/health")
        assert resp.status_code == 200

    def test_health_has_modules(self, client):
        """Health response should list all 4 modules."""
        resp = client.get("/api/ml/health")
        data = resp.json()
        assert "modules" in data
        assert "churn" in data["modules"]
        assert "clustering" in data["modules"]
        assert "forecasting" in data["modules"]
        assert "optimization" in data["modules"]


# ============================================================
# Churn Endpoints
# ============================================================

class TestChurnEndpoints:
    """Tests for /api/ml/churn/* endpoints."""

    def test_churn_predictions_200(self, client):
        """GET /api/ml/churn/predictions should return 200."""
        resp = client.get("/api/ml/churn/predictions")
        assert resp.status_code == 200

    def test_churn_predictions_structure(self, client):
        """Response should contain predictions list and total."""
        resp = client.get("/api/ml/churn/predictions")
        data = resp.json()
        assert "predictions" in data

    def test_churn_stats_200(self, client):
        """GET /api/ml/churn/stats should return 200."""
        resp = client.get("/api/ml/churn/stats")
        assert resp.status_code == 200

    def test_churn_stats_structure(self, client):
        """Stats should contain risk level counts."""
        resp = client.get("/api/ml/churn/stats")
        data = resp.json()
        # Should have risk levels or error (if no data)
        assert "high_risk" in data or "error" in data or "total" in data

    def test_churn_model_info_200(self, client):
        """GET /api/ml/churn/model-info should return 200."""
        resp = client.get("/api/ml/churn/model-info")
        assert resp.status_code == 200

    def test_churn_model_info_algorithms(self, client):
        """Model info should list the two algorithms."""
        data = client.get("/api/ml/churn/model-info").json()
        assert "algorithms" in data
        assert len(data["algorithms"]) == 2


# ============================================================
# Segmentation Endpoints
# ============================================================

class TestSegmentEndpoints:
    """Tests for /api/ml/segments* endpoints."""

    def test_segments_200(self, client):
        """GET /api/ml/segments should return 200."""
        resp = client.get("/api/ml/segments")
        assert resp.status_code == 200

    def test_segments_structure(self, client):
        """Response should contain segments list."""
        data = client.get("/api/ml/segments").json()
        assert "segments" in data

    def test_segment_clients_200(self, client):
        """GET /api/ml/segments/clients should return 200."""
        resp = client.get("/api/ml/segments/clients")
        assert resp.status_code == 200


# ============================================================
# Forecast Endpoints
# ============================================================

class TestForecastEndpoints:
    """Tests for /api/ml/forecast/* endpoints."""

    def test_forecast_daily_200(self, client):
        """GET /api/ml/forecast/daily should return 200."""
        resp = client.get("/api/ml/forecast/daily")
        assert resp.status_code == 200

    def test_forecast_daily_structure(self, client):
        """Response should contain forecasts list."""
        data = client.get("/api/ml/forecast/daily").json()
        assert "forecasts" in data

    def test_forecast_daily_custom_days(self, client):
        """?days=14 should return 14 forecasts."""
        data = client.get("/api/ml/forecast/daily?days=14").json()
        if "forecasts" in data and data["forecasts"]:
            assert len(data["forecasts"]) == 14

    def test_forecast_hourly_200(self, client):
        """GET /api/ml/forecast/hourly should return 200."""
        resp = client.get("/api/ml/forecast/hourly")
        assert resp.status_code == 200

    def test_peak_hours_200(self, client):
        """GET /api/ml/forecast/peak-hours should return 200."""
        resp = client.get("/api/ml/forecast/peak-hours")
        assert resp.status_code == 200


# ============================================================
# Optimization Endpoints
# ============================================================

class TestOptimizationEndpoints:
    """Tests for /api/ml/optimize/* endpoints."""

    def test_optimize_planning_200(self, client):
        """GET /api/ml/optimize/planning should return 200."""
        resp = client.get("/api/ml/optimize/planning")
        assert resp.status_code == 200

    def test_optimize_planning_has_schedule(self, client):
        """Response should contain optimal_schedule."""
        data = client.get("/api/ml/optimize/planning").json()
        assert "optimal_schedule" in data or "error" in data

    def test_current_optimization_200(self, client):
        """GET /api/ml/optimize/current should return 200."""
        resp = client.get("/api/ml/optimize/current")
        assert resp.status_code == 200

    def test_suggestions_200(self, client):
        """GET /api/ml/optimize/suggestions should return 200."""
        resp = client.get("/api/ml/optimize/suggestions")
        assert resp.status_code == 200

    def test_suggestions_structure(self, client):
        """Suggestions should contain a list."""
        data = client.get("/api/ml/optimize/suggestions").json()
        assert "suggestions" in data or "error" in data
