"""
Tests for the Attendance Forecasting Model.
Validates default patterns, daily/hourly forecasts, peak hours analysis,
trend calculations, and boundary conditions.
"""
import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from unittest.mock import patch
from models.forecasting_model import AttendanceForecaster


class TestForecastingDefaults:
    """Tests for default pattern initialization."""

    def test_set_defaults_marks_trained(self, default_forecaster):
        """After _set_defaults(), is_trained must be True."""
        assert default_forecaster.is_trained is True

    def test_set_defaults_weekly_pattern(self, default_forecaster):
        """Default weekly pattern should have 7 entries (Mon-Sun)."""
        assert len(default_forecaster.daily_pattern) == 7
        for dow in range(7):
            assert dow in default_forecaster.daily_pattern

    def test_set_defaults_hourly_pattern(self, default_forecaster):
        """Default hourly pattern should have 24 entries."""
        assert len(default_forecaster.hourly_pattern) == 24
        for h in range(24):
            assert h in default_forecaster.hourly_pattern

    def test_set_defaults_peak_hours_higher(self, default_forecaster):
        """Evening peak hours (17-19) should have higher weight than midday."""
        evening_avg = np.mean([default_forecaster.hourly_pattern[h] for h in [17, 18, 19]])
        midday_avg = np.mean([default_forecaster.hourly_pattern[h] for h in [12, 13]])
        assert evening_avg > midday_avg

    def test_set_defaults_base_level(self, default_forecaster):
        """Default base level should be positive."""
        assert default_forecaster.base_level > 0

    def test_set_defaults_weekend_lower(self, default_forecaster):
        """Sunday should have lower weight than weekdays."""
        sunday_weight = default_forecaster.daily_pattern[6]
        monday_weight = default_forecaster.daily_pattern[0]
        assert sunday_weight < monday_weight


class TestForecastingTraining:
    """Tests for training with mock DB data."""

    def test_train_with_sufficient_data(self, mock_db_attendance):
        """Training with 90 days of data should succeed."""
        model = AttendanceForecaster()
        with patch("models.forecasting_model.fetch_dataframe", return_value=mock_db_attendance):
            model.train()
        assert model.is_trained is True
        assert model.base_level > 0

    def test_train_with_insufficient_data(self):
        """Training with < 7 records should fall back to defaults."""
        model = AttendanceForecaster()
        small_df = pd.DataFrame({
            "check_in_time": [datetime.now() - timedelta(hours=i) for i in range(3)]
        })
        with patch("models.forecasting_model.fetch_dataframe", return_value=small_df):
            model.train()
        assert model.is_trained is True
        assert model.base_level == 25.0  # default value

    def test_train_with_empty_data(self):
        """Training with empty DB should set defaults."""
        model = AttendanceForecaster()
        with patch("models.forecasting_model.fetch_dataframe", return_value=pd.DataFrame()):
            model.train()
        assert model.is_trained is True

    def test_train_with_db_error(self):
        """Training should handle DB errors gracefully."""
        model = AttendanceForecaster()
        with patch("models.forecasting_model.fetch_dataframe", side_effect=Exception("Connection refused")):
            model.train()
        assert model.is_trained is False


class TestDailyForecast:
    """Tests for daily forecast output."""

    def test_forecast_daily_returns_correct_length(self, default_forecaster):
        """forecast_daily(7) should return exactly 7 entries."""
        forecasts = default_forecaster.forecast_daily(7)
        assert len(forecasts) == 7

    def test_forecast_daily_custom_length(self, default_forecaster):
        """forecast_daily(14) should return 14 entries."""
        forecasts = default_forecaster.forecast_daily(14)
        assert len(forecasts) == 14

    def test_forecast_daily_max_30(self, default_forecaster):
        """forecast_daily(100) should be capped at 30."""
        forecasts = default_forecaster.forecast_daily(100)
        assert len(forecasts) == 30

    def test_forecast_daily_bounds(self, default_forecaster):
        """lower_bound <= predicted_visits <= upper_bound for each forecast."""
        forecasts = default_forecaster.forecast_daily(7)
        for f in forecasts:
            assert f["lower_bound"] <= f["predicted_visits"] <= f["upper_bound"]

    def test_forecast_daily_french_day_names(self, default_forecaster):
        """Day names should be in French."""
        valid_days = {"Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"}
        forecasts = default_forecaster.forecast_daily(7)
        for f in forecasts:
            assert f["jour"] in valid_days, f"Invalid day name: {f['jour']}"

    def test_forecast_daily_has_date_string(self, default_forecaster):
        """Each forecast must have a valid date string."""
        forecasts = default_forecaster.forecast_daily(7)
        for f in forecasts:
            assert "date" in f
            # Should be parseable
            datetime.strptime(f["date"], "%Y-%m-%d")

    def test_forecast_daily_no_negative_predictions(self, default_forecaster):
        """Predicted visits should never be negative."""
        forecasts = default_forecaster.forecast_daily(30)
        for f in forecasts:
            assert f["predicted_visits"] >= 0
            assert f["lower_bound"] >= 0


class TestHourlyForecast:
    """Tests for hourly forecast output."""

    def test_forecast_hourly_range(self, default_forecaster):
        """Hourly forecast should cover gym hours (6h-22h = 17 entries)."""
        forecasts = default_forecaster.forecast_hourly()
        assert len(forecasts) == 17  # hours 6 through 22
        hours = [f["hour"] for f in forecasts]
        assert hours[0] == "06:00"
        assert hours[-1] == "22:00"

    def test_forecast_hourly_no_negatives(self, default_forecaster):
        """Hourly predictions should never be negative."""
        forecasts = default_forecaster.forecast_hourly()
        for f in forecasts:
            assert f["predicted_visits"] >= 0

    def test_forecast_hourly_specific_date(self, default_forecaster):
        """Forecast for a specific date should work."""
        forecasts = default_forecaster.forecast_hourly("2026-07-20")
        assert len(forecasts) == 17

    def test_forecast_hourly_format(self, default_forecaster):
        """Hour format should be HH:00."""
        forecasts = default_forecaster.forecast_hourly()
        for f in forecasts:
            assert f["hour"].endswith(":00")
            hour_val = int(f["hour"].split(":")[0])
            assert 6 <= hour_val <= 22


class TestPeakHours:
    """Tests for peak hours analysis."""

    def test_peak_hours_structure(self, default_forecaster):
        """Peak hours response must have required keys."""
        result = default_forecaster.get_peak_hours()
        required = {"morning_peak", "evening_peak", "busiest_day", "quietest_day",
                     "avg_daily_visits", "trend_pct", "trend_direction"}
        assert required.issubset(result.keys())

    def test_morning_peak_in_range(self, default_forecaster):
        """Morning peak should be between 06:00 and 12:00."""
        result = default_forecaster.get_peak_hours()
        hour = int(result["morning_peak"].split(":")[0])
        assert 6 <= hour <= 12

    def test_evening_peak_in_range(self, default_forecaster):
        """Evening peak should be between 16:00 and 22:00."""
        result = default_forecaster.get_peak_hours()
        hour = int(result["evening_peak"].split(":")[0])
        assert 16 <= hour <= 22

    def test_trend_direction_labels(self, default_forecaster):
        """Trend direction should be one of hausse/baisse/stable."""
        result = default_forecaster.get_peak_hours()
        assert result["trend_direction"] in ["hausse", "baisse", "stable"]

    def test_busiest_day_is_french(self, default_forecaster):
        """Busiest/quietest day names should be in French."""
        result = default_forecaster.get_peak_hours()
        valid = {"Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"}
        assert result["busiest_day"] in valid
        assert result["quietest_day"] in valid
