"""
Churn Prediction Model — Random Forest + Logistic Regression ensemble.
Predicts the probability of a client leaving the gym.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.preprocessing import StandardScaler

# Feature columns used for prediction
FEATURE_COLS = [
    "days_since_last_visit",
    "avg_visits_per_week",
    "visits_last_7d",
    "visit_trend",
    "total_visits",
    "membership_days_left",
    "has_active_membership",
    "total_months_as_member",
]


class ChurnPredictor:
    def __init__(self):
        self.rf_model = RandomForestClassifier(
            n_estimators=100, max_depth=6, random_state=42, class_weight="balanced"
        )
        self.lr_model = LogisticRegression(
            max_iter=1000, random_state=42, class_weight="balanced"
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.metrics = {}

    def _generate_training_data(self, n_samples=500):
        """
        Generate synthetic training data based on known churn patterns in gyms.
        This simulates what a real dataset would look like.
        """
        np.random.seed(42)
        data = []

        for _ in range(n_samples):
            profile = np.random.choice(["loyal", "regular", "declining", "churned"], p=[0.3, 0.25, 0.2, 0.25])

            if profile == "loyal":
                row = {
                    "days_since_last_visit": np.random.randint(0, 4),
                    "avg_visits_per_week": round(np.random.uniform(3.0, 6.0), 2),
                    "visits_last_7d": np.random.randint(3, 7),
                    "visit_trend": round(np.random.uniform(-0.2, 0.5), 2),
                    "total_visits": np.random.randint(50, 300),
                    "membership_days_left": np.random.randint(30, 365),
                    "has_active_membership": 1,
                    "total_months_as_member": round(np.random.uniform(6, 36), 1),
                    "churn": 0,
                }
            elif profile == "regular":
                row = {
                    "days_since_last_visit": np.random.randint(1, 8),
                    "avg_visits_per_week": round(np.random.uniform(1.5, 3.5), 2),
                    "visits_last_7d": np.random.randint(1, 4),
                    "visit_trend": round(np.random.uniform(-0.5, 0.3), 2),
                    "total_visits": np.random.randint(20, 100),
                    "membership_days_left": np.random.randint(10, 200),
                    "has_active_membership": 1,
                    "total_months_as_member": round(np.random.uniform(2, 18), 1),
                    "churn": 0 if np.random.random() > 0.15 else 1,
                }
            elif profile == "declining":
                row = {
                    "days_since_last_visit": np.random.randint(7, 20),
                    "avg_visits_per_week": round(np.random.uniform(0.3, 1.5), 2),
                    "visits_last_7d": np.random.randint(0, 2),
                    "visit_trend": round(np.random.uniform(-1.0, -0.3), 2),
                    "total_visits": np.random.randint(10, 80),
                    "membership_days_left": np.random.randint(-10, 30),
                    "has_active_membership": 1 if np.random.random() > 0.3 else 0,
                    "total_months_as_member": round(np.random.uniform(1, 12), 1),
                    "churn": 1 if np.random.random() > 0.3 else 0,
                }
            else:  # churned
                row = {
                    "days_since_last_visit": np.random.randint(15, 60),
                    "avg_visits_per_week": round(np.random.uniform(0, 0.5), 2),
                    "visits_last_7d": 0,
                    "visit_trend": round(np.random.uniform(-1.0, -0.5), 2),
                    "total_visits": np.random.randint(3, 40),
                    "membership_days_left": np.random.randint(-60, 5),
                    "has_active_membership": 0 if np.random.random() > 0.1 else 1,
                    "total_months_as_member": round(np.random.uniform(0.5, 8), 1),
                    "churn": 1,
                }
            data.append(row)

        return pd.DataFrame(data)

    def train(self):
        """Train both models on synthetic data."""
        df = self._generate_training_data(n_samples=500)

        X = df[FEATURE_COLS].values
        y = df["churn"].values

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        # Scale features for Logistic Regression
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train Random Forest
        self.rf_model.fit(X_train, y_train)
        rf_pred = self.rf_model.predict(X_test)

        # Train Logistic Regression
        self.lr_model.fit(X_train_scaled, y_train)
        lr_pred = self.lr_model.predict(X_test_scaled)

        # Store metrics
        self.metrics = {
            "random_forest": {
                "accuracy": round(accuracy_score(y_test, rf_pred), 4),
                "precision": round(precision_score(y_test, rf_pred, zero_division=0), 4),
                "recall": round(recall_score(y_test, rf_pred, zero_division=0), 4),
                "f1_score": round(f1_score(y_test, rf_pred, zero_division=0), 4),
            },
            "logistic_regression": {
                "accuracy": round(accuracy_score(y_test, lr_pred), 4),
                "precision": round(precision_score(y_test, lr_pred, zero_division=0), 4),
                "recall": round(recall_score(y_test, lr_pred, zero_division=0), 4),
                "f1_score": round(f1_score(y_test, lr_pred, zero_division=0), 4),
            },
            "feature_importance": dict(zip(FEATURE_COLS, [round(x, 4) for x in self.rf_model.feature_importances_])),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
        }

        self.is_trained = True
        print(f"[ChurnModel] Trained — RF accuracy: {self.metrics['random_forest']['accuracy']}, "
              f"LR accuracy: {self.metrics['logistic_regression']['accuracy']}")

    def predict(self, features_df: pd.DataFrame) -> list:
        """
        Predict churn probability for each client.
        Returns a list of dicts with client info + churn_score + risk_level.
        """
        if not self.is_trained:
            self.train()

        if features_df.empty:
            return []

        X = features_df[FEATURE_COLS].values
        X_scaled = self.scaler.transform(X)

        # Ensemble: weighted average (RF 60%, LR 40%)
        rf_proba = self.rf_model.predict_proba(X)[:, 1]
        lr_proba = self.lr_model.predict_proba(X_scaled)[:, 1]
        ensemble_proba = 0.6 * rf_proba + 0.4 * lr_proba

        results = []
        for i, (_, row) in enumerate(features_df.iterrows()):
            score = round(float(ensemble_proba[i]) * 100, 1)
            risk = "ELEVE" if score >= 70 else "MOYEN" if score >= 40 else "FAIBLE"
            results.append({
                "client_id": int(row["client_id"]),
                "nom": row["nom"],
                "email": row.get("email", ""),
                "telephone": row.get("telephone", ""),
                "churn_score": score,
                "risk_level": risk,
                "days_since_last_visit": int(row["days_since_last_visit"]),
                "avg_visits_per_week": float(row["avg_visits_per_week"]),
                "visits_last_7d": int(row["visits_last_7d"]),
                "visit_trend": float(row["visit_trend"]),
                "total_visits": int(row["total_visits"]),
                "membership_days_left": int(row["membership_days_left"]),
                "has_active_membership": bool(row["has_active_membership"]),
                "total_months_as_member": float(row["total_months_as_member"]),
            })

        # Sort by churn_score descending
        results.sort(key=lambda x: x["churn_score"], reverse=True)
        return results


# Singleton instance
churn_predictor = ChurnPredictor()
