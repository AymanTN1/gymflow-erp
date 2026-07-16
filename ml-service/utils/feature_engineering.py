"""
Feature engineering — extract ML features from raw database tables.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from database import fetch_dataframe


def get_client_features() -> pd.DataFrame:
    """
    Build a feature matrix for all active clients from the DB.
    Returns a DataFrame with one row per client and computed features.
    """
    # 1. Load clients
    clients_df = fetch_dataframe("SELECT id, nom_complet, email, telephone, date_inscription, statut FROM clients")
    if clients_df.empty:
        return pd.DataFrame()

    # 2. Load attendances
    attendances_df = fetch_dataframe("SELECT client_id, check_in_time, check_out_time, status FROM attendances")

    # 3. Load memberships
    memberships_df = fetch_dataframe("SELECT client_id, type_abonnement, date_debut, date_fin, statut FROM memberships")

    now = datetime.now()

    features = []
    for _, client in clients_df.iterrows():
        cid = client["id"]

        # --- Attendance features ---
        client_att = attendances_df[attendances_df["client_id"] == cid].copy() if not attendances_df.empty else pd.DataFrame()

        if not client_att.empty:
            client_att["check_in_time"] = pd.to_datetime(client_att["check_in_time"])
            last_visit = client_att["check_in_time"].max()
            days_since_last = (now - last_visit).days

            # Visits in last 30 days
            cutoff_30d = now - timedelta(days=30)
            visits_30d = len(client_att[client_att["check_in_time"] >= cutoff_30d])
            avg_visits_week_30d = visits_30d / 4.3

            # Visits in last 7 days
            cutoff_7d = now - timedelta(days=7)
            visits_7d = len(client_att[client_att["check_in_time"] >= cutoff_7d])

            # Visit trend (this week vs previous week)
            cutoff_14d = now - timedelta(days=14)
            visits_prev_week = len(client_att[
                (client_att["check_in_time"] >= cutoff_14d) &
                (client_att["check_in_time"] < cutoff_7d)
            ])
            visit_trend = (visits_7d - visits_prev_week) / max(visits_prev_week, 1)

            total_visits = len(client_att)

            # Average session duration (if checkout available)
            if "check_out_time" in client_att.columns:
                valid = client_att.dropna(subset=["check_out_time"]).copy()
                if not valid.empty:
                    valid["check_out_time"] = pd.to_datetime(valid["check_out_time"])
                    valid["duration_min"] = (valid["check_out_time"] - valid["check_in_time"]).dt.total_seconds() / 60
                    avg_duration = valid["duration_min"].mean()
                else:
                    avg_duration = 60.0
            else:
                avg_duration = 60.0

            # Preferred hour
            preferred_hour = client_att["check_in_time"].dt.hour.mode()
            preferred_hour = preferred_hour.iloc[0] if len(preferred_hour) > 0 else 10

            # Preferred day (0=Mon, 6=Sun)
            preferred_day = client_att["check_in_time"].dt.dayofweek.mode()
            preferred_day = preferred_day.iloc[0] if len(preferred_day) > 0 else 0
        else:
            days_since_last = 999
            avg_visits_week_30d = 0.0
            visits_7d = 0
            visit_trend = -1.0
            total_visits = 0
            avg_duration = 0.0
            preferred_hour = 10
            preferred_day = 0

        # --- Membership features ---
        client_mem = memberships_df[memberships_df["client_id"] == cid] if not memberships_df.empty else pd.DataFrame()

        if not client_mem.empty:
            latest_mem = client_mem.sort_values("date_fin", ascending=False).iloc[0]
            date_fin = pd.to_datetime(latest_mem["date_fin"])
            membership_days_left = (date_fin - now).days
            has_active = latest_mem["statut"] == "ACTIF"
            membership_type = latest_mem["type_abonnement"]
        else:
            membership_days_left = -30
            has_active = False
            membership_type = "NONE"

        # --- Anciennete ---
        date_inscr = pd.to_datetime(client["date_inscription"])
        total_months = (now - date_inscr).days / 30.0

        features.append({
            "client_id": cid,
            "nom": client["nom_complet"],
            "email": client.get("email", ""),
            "telephone": client.get("telephone", ""),
            "statut": client.get("statut", ""),
            # ML features
            "days_since_last_visit": days_since_last,
            "avg_visits_per_week": round(avg_visits_week_30d, 2),
            "visits_last_7d": visits_7d,
            "visit_trend": round(visit_trend, 2),
            "total_visits": total_visits,
            "membership_days_left": membership_days_left,
            "has_active_membership": 1 if has_active else 0,
            "total_months_as_member": round(total_months, 1),
            "avg_session_duration": round(avg_duration, 1),
            "preferred_hour": preferred_hour,
            "preferred_day": preferred_day,
            "membership_type": membership_type,
        })

    return pd.DataFrame(features)
