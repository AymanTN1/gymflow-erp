"""
Attendance Forecasting Model — Time series prediction using
weighted moving averages with weekly seasonality.
Lightweight alternative to Prophet that works reliably in Docker.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from database import fetch_dataframe


class AttendanceForecaster:
    def __init__(self):
        self.daily_pattern = {}  # day_of_week -> avg visits
        self.hourly_pattern = {}  # hour -> avg visits
        self.trend = 0.0  # daily trend (growth/decline)
        self.base_level = 0.0
        self.is_trained = False

    def train(self):
        """Train the forecasting model on historical attendance data."""
        try:
            df = fetch_dataframe(
                "SELECT check_in_time FROM attendances WHERE check_in_time IS NOT NULL"
            )
        except Exception as e:
            print(f"[Forecast] DB error: {e}")
            return

        if df.empty or len(df) < 7:
            print("[Forecast] Pas assez de donnees pour l'entrainement")
            self._set_defaults()
            return

        df["check_in_time"] = pd.to_datetime(df["check_in_time"])
        df["date"] = df["check_in_time"].dt.date
        df["hour"] = df["check_in_time"].dt.hour
        df["day_of_week"] = df["check_in_time"].dt.dayofweek

        # Daily visits count
        daily = df.groupby("date").size().reset_index(name="visits")
        daily["date"] = pd.to_datetime(daily["date"])
        daily = daily.sort_values("date")

        # Base level (average daily visits)
        self.base_level = daily["visits"].mean()

        # Weekly seasonality pattern (0=Monday, 6=Sunday)
        day_pattern = df.groupby("day_of_week").size()
        total = day_pattern.sum()
        for dow in range(7):
            self.daily_pattern[dow] = round(day_pattern.get(dow, 0) / max(total, 1) * 7, 4)

        # Hourly pattern
        hour_pattern = df.groupby("hour").size()
        total_h = hour_pattern.sum()
        for h in range(24):
            self.hourly_pattern[h] = round(hour_pattern.get(h, 0) / max(total_h, 1) * 24, 4)

        # Trend: compare last 2 weeks vs previous 2 weeks
        if len(daily) >= 28:
            recent = daily.tail(14)["visits"].mean()
            previous = daily.iloc[-28:-14]["visits"].mean()
            self.trend = (recent - previous) / max(previous, 1)
        else:
            self.trend = 0.0

        self.is_trained = True
        print(f"[Forecast] Trained — base_level={self.base_level:.1f}, trend={self.trend:.4f}")

    def _set_defaults(self):
        """Set default patterns when no data is available."""
        # Typical gym pattern
        default_weekly = {0: 1.1, 1: 1.2, 2: 1.0, 3: 1.15, 4: 0.95, 5: 0.8, 6: 0.3}
        default_hourly = {h: 0.2 for h in range(24)}
        for h in [7, 8, 9]: default_hourly[h] = 1.2
        for h in [10, 11]: default_hourly[h] = 1.0
        for h in [12, 13]: default_hourly[h] = 0.6
        for h in [17, 18, 19]: default_hourly[h] = 1.8
        for h in [20]: default_hourly[h] = 1.3

        self.daily_pattern = default_weekly
        self.hourly_pattern = default_hourly
        self.base_level = 25.0
        self.trend = 0.01
        self.is_trained = True

    def forecast_daily(self, days: int = 7) -> list:
        """Forecast daily attendance for the next N days."""
        days = min(days, 30)
        if not self.is_trained:
            self.train()

        today = datetime.now().date()
        forecasts = []

        for d in range(1, days + 1):
            target_date = today + timedelta(days=d)
            dow = target_date.weekday()

            # Base prediction with seasonality and trend
            seasonal_factor = self.daily_pattern.get(dow, 1.0)
            trend_adjustment = 1.0 + (self.trend * d / 30)  # gradual trend
            predicted = self.base_level * seasonal_factor * trend_adjustment

            # Add some realistic uncertainty
            lower = max(0, predicted * 0.8)
            upper = predicted * 1.2

            day_names = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

            forecasts.append({
                "date": str(target_date),
                "jour": day_names[dow],
                "predicted_visits": round(predicted),
                "lower_bound": round(lower),
                "upper_bound": round(upper),
            })

        return forecasts

    def forecast_hourly(self, target_date: str = None) -> list:
        """Forecast hourly attendance for a specific date."""
        if not self.is_trained:
            self.train()

        if target_date:
            date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
        else:
            date_obj = (datetime.now() + timedelta(days=1)).date()

        dow = date_obj.weekday()
        daily_factor = self.daily_pattern.get(dow, 1.0)

        forecasts = []
        for hour in range(6, 23):  # Gym hours: 6h-22h
            hourly_factor = self.hourly_pattern.get(hour, 0.5)
            predicted = self.base_level * daily_factor * hourly_factor / 10  # per-hour fraction

            forecasts.append({
                "hour": f"{hour:02d}:00",
                "predicted_visits": max(0, round(predicted)),
            })

        return forecasts

    def get_peak_hours(self) -> dict:
        """Return peak hours analysis."""
        if not self.is_trained:
            self.train()

        # Find peak hours
        sorted_hours = sorted(self.hourly_pattern.items(), key=lambda x: x[1], reverse=True)
        morning_peak = next((h for h, _ in sorted_hours if 6 <= h <= 12), 9)
        evening_peak = next((h for h, _ in sorted_hours if 16 <= h <= 22), 18)

        # Busiest day
        sorted_days = sorted(self.daily_pattern.items(), key=lambda x: x[1], reverse=True)
        day_names = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
        busiest_day = day_names[sorted_days[0][0]] if sorted_days else "Lundi"
        quietest_day = day_names[sorted_days[-1][0]] if sorted_days else "Dimanche"

        return {
            "morning_peak": f"{morning_peak:02d}:00",
            "evening_peak": f"{evening_peak:02d}:00",
            "busiest_day": busiest_day,
            "quietest_day": quietest_day,
            "avg_daily_visits": round(self.base_level, 1),
            "trend_pct": round(self.trend * 100, 2),
            "trend_direction": "hausse" if self.trend > 0.02 else "baisse" if self.trend < -0.02 else "stable",
        }


# Singleton
attendance_forecaster = AttendanceForecaster()
