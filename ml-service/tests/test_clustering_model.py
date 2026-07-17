"""
Tests for the Client Segmentation Model (K-Means Clustering).
Validates clustering behavior, segment labeling, silhouette scoring,
and edge cases.
"""
import pytest
import numpy as np
import pandas as pd
from models.clustering_model import ClientSegmenter, SEGMENT_LABELS, CLUSTERING_FEATURES


class TestClusteringTraining:
    """Tests for K-Means training."""

    def test_train_sets_is_trained(self, trained_clustering_model):
        """After training, is_trained must be True."""
        assert trained_clustering_model.is_trained is True

    def test_train_sets_optimal_k(self, trained_clustering_model):
        """Optimal k should be between 2 and 6."""
        k = trained_clustering_model.n_clusters
        assert 2 <= k <= 6, f"k={k} is out of expected range"

    def test_train_computes_silhouette_score(self, trained_clustering_model):
        """Silhouette score must be computed and positive."""
        score = trained_clustering_model.metrics.get("silhouette_score")
        assert score is not None
        assert score > 0, f"Silhouette score should be positive, got {score}"

    def test_train_records_client_count(self, trained_clustering_model, sample_client_features):
        """n_clients metric should match input size."""
        assert trained_clustering_model.metrics["n_clients"] == len(sample_client_features)

    def test_cluster_labels_assigned(self, trained_clustering_model):
        """Each cluster must have an assigned label."""
        k = trained_clustering_model.n_clusters
        assert len(trained_clustering_model.cluster_labels) == k
        for i in range(k):
            label = trained_clustering_model.cluster_labels[i]
            assert "name" in label
            assert "emoji" in label
            assert "description" in label

    def test_cluster_labels_unique(self, trained_clustering_model):
        """No two clusters should have the same label name."""
        names = [l["name"] for l in trained_clustering_model.cluster_labels.values()]
        assert len(names) == len(set(names)), f"Duplicate labels: {names}"

    def test_train_refuses_too_few_samples(self):
        """Training with < 4 clients should not set is_trained."""
        model = ClientSegmenter()
        small_df = pd.DataFrame({
            "avg_visits_per_week": [2.0, 3.0],
            "preferred_hour": [8, 19],
            "preferred_day": [1, 3],
            "avg_session_duration": [60, 45],
            "total_visits": [50, 20],
            "total_months_as_member": [12, 3],
        })
        model.train(small_df)
        assert model.is_trained is False

    def test_train_handles_empty_dataframe(self):
        """Training on empty DataFrame should not crash."""
        model = ClientSegmenter()
        model.train(pd.DataFrame())
        assert model.is_trained is False


class TestSegmentLabeling:
    """Tests for the _determine_segment_label logic."""

    def test_label_hardcore(self):
        """High avg_visits (>= 3.5) should label as 'Assidus'."""
        model = ClientSegmenter()
        centroid = [4.0, 10, 2, 60, 100, 12]
        features = CLUSTERING_FEATURES
        label = model._determine_segment_label(centroid, features)
        assert label["name"] == "Assidus"

    def test_label_morning_regular(self):
        """Low preferred_hour (<= 10) should label as 'Matinaux'."""
        model = ClientSegmenter()
        centroid = [2.0, 8, 2, 55, 40, 6]
        features = CLUSTERING_FEATURES
        label = model._determine_segment_label(centroid, features)
        assert label["name"] == "Matinaux"

    def test_label_evening_regular(self):
        """High preferred_hour (>= 17) should label as 'Nocturnes'."""
        model = ClientSegmenter()
        centroid = [2.5, 19, 2, 50, 60, 8]
        features = CLUSTERING_FEATURES
        label = model._determine_segment_label(centroid, features)
        assert label["name"] == "Nocturnes"

    def test_label_weekend(self):
        """High preferred_day (>= 5) should label as 'Weekend Warriors'."""
        model = ClientSegmenter()
        centroid = [2.0, 14, 5, 55, 30, 4]
        features = CLUSTERING_FEATURES
        label = model._determine_segment_label(centroid, features)
        assert label["name"] == "Weekend Warriors"

    def test_label_occasional(self):
        """Low visits, mid hour/day should default to 'Occasionnels'."""
        model = ClientSegmenter()
        centroid = [1.0, 14, 2, 40, 15, 3]
        features = CLUSTERING_FEATURES
        label = model._determine_segment_label(centroid, features)
        assert label["name"] == "Occasionnels"


class TestClusteringPrediction:
    """Tests for prediction and summary output."""

    def test_predict_assigns_all_clients(self, trained_clustering_model, sample_client_features):
        """Every client must receive a segment assignment."""
        results = trained_clustering_model.predict(sample_client_features)
        assert len(results) == len(sample_client_features)

    def test_predict_correct_keys(self, trained_clustering_model, sample_client_features):
        """Each prediction must contain required keys."""
        results = trained_clustering_model.predict(sample_client_features)
        required = {"client_id", "nom", "segment_name", "segment_emoji", "segment_description"}
        for r in results:
            assert required.issubset(r.keys()), f"Missing: {required - r.keys()}"

    def test_predict_untrained_returns_empty(self, sample_client_features):
        """Predicting with untrained model should return empty list."""
        model = ClientSegmenter()
        results = model.predict(sample_client_features)
        assert results == []

    def test_segment_summary_counts(self, trained_clustering_model, sample_client_features):
        """Sum of segment counts should equal total clients."""
        summary = trained_clustering_model.get_segment_summary(sample_client_features)
        total = sum(s["count"] for s in summary)
        assert total == len(sample_client_features)

    def test_segment_summary_structure(self, trained_clustering_model, sample_client_features):
        """Summary entries must have required keys."""
        summary = trained_clustering_model.get_segment_summary(sample_client_features)
        assert len(summary) > 0
        for s in summary:
            assert "segment_name" in s
            assert "count" in s
            assert "avg_visits_per_week" in s
            assert "avg_total_visits" in s
            assert s["count"] > 0

    def test_segment_summary_sorted_by_count(self, trained_clustering_model, sample_client_features):
        """Summary should be sorted by count descending."""
        summary = trained_clustering_model.get_segment_summary(sample_client_features)
        counts = [s["count"] for s in summary]
        assert counts == sorted(counts, reverse=True)
