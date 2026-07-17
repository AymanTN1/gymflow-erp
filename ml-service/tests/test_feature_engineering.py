"""
Tests for Feature Engineering helper module.
Validates extraction of features from database tables, including edge cases
like empty database, client with no visits, and client with no active membership.
"""
import pytest
import pandas as pd
from unittest.mock import patch
from datetime import datetime, timedelta
from utils.feature_engineering import get_client_features


class TestFeatureEngineering:
    """Tests for get_client_features function."""

    @patch("utils.feature_engineering.fetch_dataframe")
    def test_get_client_features_empty_database(self, mock_fetch):
        """Should return an empty DataFrame if no clients are found in the DB."""
        mock_fetch.return_value = pd.DataFrame()
        result = get_client_features()
        assert isinstance(result, pd.DataFrame)
        assert result.empty

    @patch("utils.feature_engineering.fetch_dataframe")
    def test_get_client_features_no_visits_no_memberships(self, mock_fetch):
        """Should correctly handle clients with zero attendance and zero memberships."""
        now = datetime.now()
        # Mock 1 client
        clients_df = pd.DataFrame({
            "id": [1],
            "nom_complet": ["No Visit Member"],
            "email": ["novisit@test.ma"],
            "telephone": ["0611111111"],
            "date_inscription": [now - timedelta(days=60)],
            "statut": ["EN_ATTENTE"]
        })

        def mock_fetch_route(query):
            if "clients" in query.lower():
                return clients_df
            # Return empty for attendances and memberships
            return pd.DataFrame()

        mock_fetch.side_effect = mock_fetch_route

        result = get_client_features()
        assert len(result) == 1
        row = result.iloc[0]
        assert row["client_id"] == 1
        assert row["days_since_last_visit"] == 999
        assert row["avg_visits_per_week"] == 0.0
        assert row["visits_last_7d"] == 0
        assert row["visit_trend"] == -1.0
        assert row["total_visits"] == 0
        assert row["avg_session_duration"] == 0.0
        assert row["preferred_hour"] == 10
        assert row["preferred_day"] == 0
        assert row["membership_days_left"] == -30
        assert row["has_active_membership"] == 0
        assert row["membership_type"] == "NONE"
        assert abs(row["total_months_as_member"] - 2.0) < 0.1

    @patch("utils.feature_engineering.fetch_dataframe")
    def test_get_client_features_visits_without_checkout(self, mock_fetch):
        """Should set default session duration to 60.0 if checkout time is missing."""
        now = datetime.now()
        clients_df = pd.DataFrame({
            "id": [2],
            "nom_complet": ["Active No Checkout"],
            "email": ["active@test.ma"],
            "telephone": ["0622222222"],
            "date_inscription": [now - timedelta(days=30)],
            "statut": ["ACTIF"]
        })
        # Checkin with check_out_time as NaN
        attendances_df = pd.DataFrame({
            "client_id": [2],
            "check_in_time": [now - timedelta(days=2)],
            "check_out_time": [None],
            "status": ["PRESENT"]
        })
        memberships_df = pd.DataFrame({
            "client_id": [2],
            "type_abonnement": ["TRIMESTRIEL"],
            "date_debut": [now - timedelta(days=10)],
            "date_fin": [now + timedelta(days=80)],
            "statut": ["ACTIF"]
        })

        def mock_fetch_route(query):
            q = query.lower()
            if "clients" in q:
                return clients_df
            elif "attendances" in q:
                return attendances_df
            elif "memberships" in q:
                return memberships_df
            return pd.DataFrame()

        mock_fetch.side_effect = mock_fetch_route

        result = get_client_features()
        assert len(result) == 1
        row = result.iloc[0]
        assert row["client_id"] == 2
        assert row["avg_session_duration"] == 60.0
        assert row["membership_type"] == "TRIMESTRIEL"
        assert row["has_active_membership"] == 1
