"""
Client Segmentation Model — K-Means Clustering.
Groups clients into behavior-based segments.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

CLUSTERING_FEATURES = [
    "avg_visits_per_week",
    "preferred_hour",
    "preferred_day",
    "avg_session_duration",
    "total_visits",
    "total_months_as_member",
]

# Human-readable segment labels based on cluster centroids
SEGMENT_LABELS = {
    "morning_regular": {"name": "Matinaux", "emoji": "🌅", "description": "Viennent regulierement le matin avant 10h"},
    "evening_regular": {"name": "Nocturnes", "emoji": "🌙", "description": "Preferent les seances en soiree apres 18h"},
    "hardcore": {"name": "Assidus", "emoji": "🏆", "description": "Membres tres engages, 4+ visites par semaine"},
    "weekend": {"name": "Weekend Warriors", "emoji": "📅", "description": "Viennent principalement le weekend"},
    "occasional": {"name": "Occasionnels", "emoji": "😴", "description": "Frequentation faible, moins de 1 visite par semaine"},
}


class ClientSegmenter:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.n_clusters = 4
        self.is_trained = False
        self.cluster_labels = {}
        self.metrics = {}

    def _determine_segment_label(self, centroid, feature_names):
        """Assign a human-readable label to a cluster based on its centroid values."""
        feat_dict = dict(zip(feature_names, centroid))

        visits = feat_dict.get("avg_visits_per_week", 0)
        hour = feat_dict.get("preferred_hour", 12)
        day = feat_dict.get("preferred_day", 2)

        if visits >= 3.5:
            return SEGMENT_LABELS["hardcore"]
        elif hour <= 10:
            return SEGMENT_LABELS["morning_regular"]
        elif hour >= 17:
            return SEGMENT_LABELS["evening_regular"]
        elif day >= 5:
            return SEGMENT_LABELS["weekend"]
        else:
            return SEGMENT_LABELS["occasional"]

    def train(self, features_df: pd.DataFrame):
        """Train K-Means on client features."""
        if features_df.empty or len(features_df) < 4:
            print("[Clustering] Pas assez de clients pour le clustering")
            return

        available_features = [f for f in CLUSTERING_FEATURES if f in features_df.columns]
        X = features_df[available_features].fillna(0).values

        # Determine optimal k using silhouette score (between 2 and min(6, n_samples-1))
        max_k = min(6, len(X) - 1)
        best_k = 3
        best_score = -1

        if len(X) >= 4:
            for k in range(2, max_k + 1):
                try:
                    km = KMeans(n_clusters=k, random_state=42, n_init=10)
                    labels = km.fit_predict(self.scaler.fit_transform(X))
                    score = silhouette_score(self.scaler.transform(X), labels)
                    if score > best_score:
                        best_score = score
                        best_k = k
                except Exception:
                    continue

        self.n_clusters = best_k
        X_scaled = self.scaler.fit_transform(X)
        self.model = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)
        labels = self.model.fit_predict(X_scaled)

        # Assign labels to clusters based on centroids (inverse transform to original scale)
        centroids_original = self.scaler.inverse_transform(self.model.cluster_centers_)
        self.cluster_labels = {}
        used_labels = set()
        for i, centroid in enumerate(centroids_original):
            label = self._determine_segment_label(centroid, available_features)
            # Avoid duplicate labels
            if label["name"] in used_labels:
                label = {"name": f"Groupe {i+1}", "emoji": "👥", "description": f"Segment client numero {i+1}"}
            used_labels.add(label["name"])
            self.cluster_labels[i] = label

        self.metrics = {
            "n_clusters": self.n_clusters,
            "silhouette_score": round(best_score, 4) if best_score > 0 else None,
            "n_clients": len(X),
        }

        self.is_trained = True
        print(f"[Clustering] Trained with k={self.n_clusters}, silhouette={best_score:.4f}")

    def predict(self, features_df: pd.DataFrame) -> list:
        """Assign each client to a segment."""
        if not self.is_trained or features_df.empty:
            return []

        available_features = [f for f in CLUSTERING_FEATURES if f in features_df.columns]
        X = features_df[available_features].fillna(0).values
        X_scaled = self.scaler.transform(X)
        labels = self.model.predict(X_scaled)

        results = []
        for i, (_, row) in enumerate(features_df.iterrows()):
            cluster_id = int(labels[i])
            segment_info = self.cluster_labels.get(cluster_id, {"name": "Inconnu", "emoji": "❓", "description": ""})
            results.append({
                "client_id": int(row["client_id"]),
                "nom": row["nom"],
                "segment_name": segment_info["name"],
                "segment_emoji": segment_info["emoji"],
                "segment_description": segment_info["description"],
                "avg_visits_per_week": float(row.get("avg_visits_per_week", 0)),
                "preferred_hour": int(row.get("preferred_hour", 0)),
                "preferred_day": int(row.get("preferred_day", 0)),
                "total_visits": int(row.get("total_visits", 0)),
            })

        return results

    def get_segment_summary(self, features_df: pd.DataFrame) -> list:
        """Return summary statistics per segment."""
        predictions = self.predict(features_df)
        if not predictions:
            return []

        df = pd.DataFrame(predictions)
        summary = []
        for name, group in df.groupby("segment_name"):
            segment_info = next((s for s in self.cluster_labels.values() if s["name"] == name), {})
            summary.append({
                "segment_name": name,
                "emoji": segment_info.get("emoji", "👥"),
                "description": segment_info.get("description", ""),
                "count": len(group),
                "avg_visits_per_week": round(group["avg_visits_per_week"].mean(), 2),
                "avg_total_visits": round(group["total_visits"].mean(), 1),
            })

        summary.sort(key=lambda x: x["count"], reverse=True)
        return summary


# Singleton
client_segmenter = ClientSegmenter()
