"""
Shared fixtures for GymFlow ML Service tests.
Provides mock DataFrames, patched DB calls, and FastAPI test client.
"""
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock


# ============================================================
# FIXTURE: Sample client features DataFrame
# ============================================================

@pytest.fixture
def sample_client_features():
    """Generate a realistic DataFrame of client features for testing."""
    np.random.seed(42)
    n = 20
    now = datetime.now()

    data = []
    profiles = [
        # Loyal clients
        {"days_since": (0, 3), "avg_visits": (3.0, 5.5), "v7d": (3, 6), "trend": (0.0, 0.5),
         "total": (50, 200), "mem_left": (30, 300), "active": 1, "months": (6, 30),
         "duration": (50, 90), "hour": (7, 9), "day": (0, 4)},
        # Regular clients
        {"days_since": (2, 7), "avg_visits": (1.5, 3.0), "v7d": (1, 3), "trend": (-0.3, 0.2),
         "total": (20, 80), "mem_left": (10, 150), "active": 1, "months": (2, 15),
         "duration": (40, 70), "hour": (10, 14), "day": (0, 4)},
        # Declining clients
        {"days_since": (8, 20), "avg_visits": (0.3, 1.2), "v7d": (0, 1), "trend": (-0.8, -0.2),
         "total": (10, 50), "mem_left": (-10, 20), "active": 0, "months": (1, 10),
         "duration": (30, 50), "hour": (17, 20), "day": (0, 6)},
        # Churned clients
        {"days_since": (20, 50), "avg_visits": (0.0, 0.3), "v7d": (0, 0), "trend": (-1.0, -0.5),
         "total": (3, 30), "mem_left": (-60, -5), "active": 0, "months": (0.5, 6),
         "duration": (20, 40), "hour": (18, 21), "day": (4, 6)},
    ]

    for i in range(n):
        p = profiles[i % len(profiles)]
        data.append({
            "client_id": i + 1,
            "nom": f"Client Test {i + 1}",
            "email": f"client{i + 1}@test.ma",
            "telephone": f"06{np.random.randint(10000000, 99999999)}",
            "statut": "ACTIF" if p["active"] else "INACTIF",
            "days_since_last_visit": np.random.randint(*p["days_since"]),
            "avg_visits_per_week": round(np.random.uniform(*p["avg_visits"]), 2),
            "visits_last_7d": np.random.randint(p["v7d"][0], p["v7d"][1] + 1),
            "visit_trend": round(np.random.uniform(*p["trend"]), 2),
            "total_visits": np.random.randint(*p["total"]),
            "membership_days_left": np.random.randint(*p["mem_left"]),
            "has_active_membership": p["active"],
            "total_months_as_member": round(np.random.uniform(*p["months"]), 1),
            "avg_session_duration": round(np.random.uniform(*p["duration"]), 1),
            "preferred_hour": np.random.randint(*p["hour"]),
            "preferred_day": np.random.randint(*p["day"]),
            "membership_type": np.random.choice(["MENSUEL", "TRIMESTRIEL", "SEMESTRIEL"]),
        })

    return pd.DataFrame(data)


# ============================================================
# FIXTURE: Empty DataFrame
# ============================================================

@pytest.fixture
def empty_features():
    """Return an empty DataFrame with the correct columns."""
    from models.churn_model import FEATURE_COLS
    cols = ["client_id", "nom", "email", "telephone"] + FEATURE_COLS
    return pd.DataFrame(columns=cols)


# ============================================================
# FIXTURE: Mock database (patch fetch_dataframe)
# ============================================================

@pytest.fixture
def mock_db_attendance():
    """Mock attendance data from database for forecasting tests."""
    np.random.seed(42)
    now = datetime.now()
    records = []

    # Generate 90 days of attendance data with realistic patterns
    for day_offset in range(90):
        date = now - timedelta(days=day_offset)
        dow = date.weekday()

        # More visits on weekdays, fewer on weekends
        if dow < 5:
            n_visits = np.random.randint(15, 35)
        elif dow == 5:
            n_visits = np.random.randint(10, 20)
        else:
            n_visits = np.random.randint(5, 12)

        for _ in range(n_visits):
            hour_weights = [0.01] * 6 + [0.02, 0.07, 0.09, 0.07, 0.05, 0.04, 0.04, 0.03, 0.03, 0.04, 0.05, 0.06, 0.10, 0.11, 0.08, 0.04, 0.01, 0.01]
            hour = np.random.choice(range(24), p=hour_weights)
            minute = np.random.randint(0, 60)
            check_in = date.replace(hour=hour, minute=minute, second=0)
            records.append({"check_in_time": check_in})

    return pd.DataFrame(records)


# ============================================================
# FIXTURE: FastAPI TestClient
# ============================================================

@pytest.fixture
def api_client():
    """Create a FastAPI test client with mocked DB."""
    from fastapi.testclient import TestClient

    # Patch database calls before importing the app
    with patch("utils.feature_engineering.fetch_dataframe") as mock_feat_db, \
         patch("models.forecasting_model.fetch_dataframe") as mock_forecast_db, \
         patch("optimization.planning_optimizer.fetch_dataframe") as mock_optim_db:

        # Mock feature engineering DB calls
        mock_feat_db.return_value = pd.DataFrame()
        mock_forecast_db.return_value = pd.DataFrame()
        mock_optim_db.return_value = pd.DataFrame()

        from main import app
        client = TestClient(app)
        yield client


@pytest.fixture
def api_client_with_data(sample_client_features, mock_db_attendance):
    """Create a FastAPI test client with populated mock data."""
    from fastapi.testclient import TestClient

    # Build mock returns for each DB query
    clients_df = sample_client_features[["client_id", "nom", "email", "telephone", "statut"]].copy()
    clients_df = clients_df.rename(columns={"client_id": "id", "nom": "nom_complet"})
    clients_df["date_inscription"] = datetime.now() - timedelta(days=180)

    def mock_fetch(query):
        q = query.lower()
        if "clients" in q:
            return clients_df
        elif "attendances" in q:
            return mock_db_attendance
        elif "memberships" in q:
            return pd.DataFrame({
                "client_id": sample_client_features["client_id"],
                "type_abonnement": sample_client_features["membership_type"],
                "date_debut": datetime.now() - timedelta(days=30),
                "date_fin": datetime.now() + timedelta(days=60),
                "statut": ["ACTIF"] * len(sample_client_features),
            })
        elif "users" in q and "coach" in q:
            return pd.DataFrame({
                "id": [101, 102, 103],
                "nom": ["Coach Youssef", "Coach Amine", "Coach Sara"],
                "role": ["COACH"] * 3,
            })
        return pd.DataFrame()

    with patch("utils.feature_engineering.fetch_dataframe", side_effect=mock_fetch), \
         patch("models.forecasting_model.fetch_dataframe", side_effect=mock_fetch), \
         patch("optimization.planning_optimizer.fetch_dataframe", side_effect=mock_fetch):

        from main import app
        client = TestClient(app)
        yield client


# ============================================================
# FIXTURE: Trained churn model
# ============================================================

@pytest.fixture
def trained_churn_model():
    """Return a freshly trained ChurnPredictor instance."""
    from models.churn_model import ChurnPredictor
    model = ChurnPredictor()
    model.train()
    return model


# ============================================================
# FIXTURE: Trained clustering model
# ============================================================

@pytest.fixture
def trained_clustering_model(sample_client_features):
    """Return a trained ClientSegmenter instance."""
    from models.clustering_model import ClientSegmenter
    model = ClientSegmenter()
    model.train(sample_client_features)
    return model


# ============================================================
# FIXTURE: Trained forecasting model with defaults
# ============================================================

@pytest.fixture
def default_forecaster():
    """Return a forecaster with default patterns (no DB)."""
    from models.forecasting_model import AttendanceForecaster
    model = AttendanceForecaster()
    model._set_defaults()
    return model
