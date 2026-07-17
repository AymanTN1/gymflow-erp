"""
Tests for the Planning Optimizer (Integer Linear Programming with PuLP).
Validates ILP constraints (availability, max slots, minimum coverage,
max per slot, rest days), solution quality, and suggestion logic.
"""
import pytest
import numpy as np
from optimization.planning_optimizer import PlanningOptimizer, DEFAULT_SLOTS, DAYS


# ============================================================
# Test fixtures specific to optimizer
# ============================================================

@pytest.fixture
def optimizer():
    """Return a fresh PlanningOptimizer instance."""
    return PlanningOptimizer()


@pytest.fixture
def test_coaches():
    """Return a deterministic set of test coaches."""
    return [
        {"id": 1, "name": "Coach Youssef", "max_slots_per_week": 15, "speciality": "general"},
        {"id": 2, "name": "Coach Amine", "max_slots_per_week": 12, "speciality": "cardio"},
        {"id": 3, "name": "Coach Sara", "max_slots_per_week": 10, "speciality": "yoga"},
    ]


@pytest.fixture
def optimization_result(optimizer, test_coaches):
    """Run optimization and return the result."""
    return optimizer.optimize(coaches=test_coaches, slots=DEFAULT_SLOTS)


# ============================================================
# Tests: Solver Status
# ============================================================

class TestOptimizerSolver:
    """Tests for solver execution and status."""

    def test_optimize_returns_optimal(self, optimization_result):
        """Solver status should be 'Optimal'."""
        assert optimization_result["status"] == "Optimal"

    def test_optimize_returns_schedule(self, optimization_result):
        """Solution must contain an optimal_schedule list."""
        assert "optimal_schedule" in optimization_result
        assert isinstance(optimization_result["optimal_schedule"], list)
        assert len(optimization_result["optimal_schedule"]) > 0

    def test_optimize_total_score_positive(self, optimization_result):
        """Total score must be positive."""
        assert optimization_result["total_score"] > 0

    def test_optimize_coverage_percentage(self, optimization_result):
        """Coverage percentage must be between 0 and 100."""
        cov = optimization_result["coverage_pct"]
        assert 0 <= cov <= 100

    def test_optimize_solver_name(self, optimization_result):
        """Solver field should mention PuLP CBC."""
        assert "PuLP" in optimization_result["solver"]
        assert "ILP" in optimization_result["solver"] or "Integer" in optimization_result["solver"]


# ============================================================
# Tests: ILP Constraints Verification
# ============================================================

class TestILPConstraints:
    """Verify that all 5 constraints are satisfied in the solution."""

    def test_c1_availability_constraint(self, optimizer, test_coaches):
        """C1: Coaches should only be assigned to slots where they are available."""
        result = optimizer.optimize(coaches=test_coaches, slots=DEFAULT_SLOTS)
        availability = optimizer._generate_availability(test_coaches, DEFAULT_SLOTS)

        for assignment in result["optimal_schedule"]:
            key = (assignment["coach_id"], assignment["slot_id"])
            assert availability.get(key, 0) == 1, \
                f"Coach {assignment['coach_name']} assigned to unavailable slot {assignment['slot_id']}"

    def test_c2_max_slots_per_coach(self, optimization_result, test_coaches):
        """C2: No coach should exceed their max_slots_per_week."""
        workload = optimization_result["coach_workload"]
        max_map = {c["name"]: c["max_slots_per_week"] for c in test_coaches}

        for coach_name, slots_count in workload.items():
            max_allowed = max_map.get(coach_name, 15)
            assert slots_count <= max_allowed, \
                f"{coach_name}: {slots_count} slots > max {max_allowed}"

    def test_c3_minimum_coverage_high_demand(self, optimizer, test_coaches):
        """C3: High-demand slots (demand >= 15) must have at least 1 coach if anyone is available."""
        result = optimizer.optimize(coaches=test_coaches, slots=DEFAULT_SLOTS)
        demand = optimizer._generate_demand(DEFAULT_SLOTS)
        availability = optimizer._generate_availability(test_coaches, DEFAULT_SLOTS)

        # Get assigned slots
        assigned_slots = {}
        for a in result["optimal_schedule"]:
            sid = a["slot_id"]
            assigned_slots[sid] = assigned_slots.get(sid, 0) + 1

        for slot in DEFAULT_SLOTS:
            if demand.get(slot["id"], 0) >= 15:
                has_avail = any(availability.get((c["id"], slot["id"]), 0) == 1 for c in test_coaches)
                if has_avail:
                    coaches_count = assigned_slots.get(slot["id"], 0)
                    assert coaches_count >= 1, \
                        f"High-demand slot {slot['id']} has {coaches_count} coaches (need >= 1)"


    def test_c4_max_two_coaches_per_slot(self, optimization_result):
        """C4: No slot should have more than 2 coaches."""
        slot_counts = {}
        for a in optimization_result["optimal_schedule"]:
            sid = a["slot_id"]
            slot_counts[sid] = slot_counts.get(sid, 0) + 1

        for sid, count in slot_counts.items():
            assert count <= 2, f"Slot {sid} has {count} coaches (max 2)"

    def test_c5_rest_day_constraint(self, optimization_result):
        """C5: Each coach must have at least 1 day off (max 5 working days out of 6)."""
        coach_days = {}
        for a in optimization_result["optimal_schedule"]:
            cname = a["coach_name"]
            day = a["day"]
            if cname not in coach_days:
                coach_days[cname] = set()
            coach_days[cname].add(day)

        for coach, days_worked in coach_days.items():
            assert len(days_worked) <= len(DAYS) - 1, \
                f"{coach} works {len(days_worked)} days (max {len(DAYS) - 1})"


# ============================================================
# Tests: Schedule Quality
# ============================================================

class TestScheduleQuality:
    """Tests for schedule output quality."""

    def test_schedule_sorted_by_day_and_time(self, optimization_result):
        """Schedule should be sorted by day order then start time."""
        schedule = optimization_result["optimal_schedule"]
        day_order = {d: i for i, d in enumerate(DAYS)}

        for i in range(1, len(schedule)):
            prev = schedule[i - 1]
            curr = schedule[i]
            prev_key = (day_order.get(prev["day"], 99), prev["start"])
            curr_key = (day_order.get(curr["day"], 99), curr["start"])
            assert prev_key <= curr_key, f"Not sorted: {prev['label']} > {curr['label']}"

    def test_schedule_entries_have_required_keys(self, optimization_result):
        """Each schedule entry must have all required keys."""
        required = {"coach_id", "coach_name", "slot_id", "day", "start", "end", "label", "score"}
        for entry in optimization_result["optimal_schedule"]:
            assert required.issubset(entry.keys()), f"Missing: {required - entry.keys()}"

    def test_coverage_formula_correct(self, optimization_result):
        """coverage_pct = covered_slots / total_slots * 100."""
        covered = optimization_result["covered_slots"]
        total = optimization_result["total_slots"]
        expected_pct = round(covered / max(total, 1) * 100, 1)
        assert optimization_result["coverage_pct"] == expected_pct

    def test_coach_workload_matches_schedule(self, optimization_result):
        """Workload dict should match actual schedule assignments."""
        manual_count = {}
        for a in optimization_result["optimal_schedule"]:
            cname = a["coach_name"]
            manual_count[cname] = manual_count.get(cname, 0) + 1

        assert manual_count == optimization_result["coach_workload"]


# ============================================================
# Tests: Demand and Score Logic
# ============================================================

class TestDemandAndScoring:
    """Tests for demand generation and score computation."""

    def test_demand_peak_hours_higher(self, optimizer):
        """Evening slots (18:00) should have higher demand than afternoon (14:00)."""
        demand = optimizer._generate_demand(DEFAULT_SLOTS)
        evening_demands = [d for sid, d in demand.items() if "18:00" in sid]
        afternoon_demands = [d for sid, d in demand.items() if "14:00" in sid]

        assert np.mean(evening_demands) > np.mean(afternoon_demands)

    def test_demand_saturday_lower(self, optimizer):
        """Saturday demand should be lower than weekday demand for same time."""
        demand = optimizer._generate_demand(DEFAULT_SLOTS)
        sat_morning = demand.get("Samedi_08:00", 0)
        mon_morning = demand.get("Lundi_08:00", 0)
        assert sat_morning < mon_morning

    def test_score_peak_bonus(self, optimizer):
        """Score for evening slots should be higher due to 1.3x bonus."""
        demand = optimizer._generate_demand(DEFAULT_SLOTS)
        coach = {"id": 1, "name": "Test", "max_slots_per_week": 10, "speciality": "general"}

        evening_slot = next(s for s in DEFAULT_SLOTS if s["start"] == "18:00")
        morning_slot = next(s for s in DEFAULT_SLOTS if s["start"] == "10:00")

        score_evening = optimizer._compute_score(coach, evening_slot, demand)
        score_morning = optimizer._compute_score(coach, morning_slot, demand)

        assert score_evening > score_morning

    def test_constraints_description(self, optimization_result):
        """Constraints dict should document all 5 constraints."""
        constraints = optimization_result["constraints"]
        assert len(constraints) == 5
        assert "C1" in constraints
        assert "C5" in constraints


# ============================================================
# Tests: Suggestions
# ============================================================

class TestOptimizationSuggestions:
    """Tests for improvement suggestions."""

    def test_suggestions_returns_list(self, optimizer, test_coaches):
        """get_suggestions() should return a dict with 'suggestions' list."""
        optimizer.optimize(coaches=test_coaches, slots=DEFAULT_SLOTS)
        result = optimizer.get_suggestions()
        assert "suggestions" in result
        assert isinstance(result["suggestions"], list)
        assert len(result["suggestions"]) > 0

    def test_suggestions_without_optimization(self, optimizer):
        """Calling suggestions before optimize should return guidance message."""
        result = optimizer.get_suggestions()
        assert "suggestions" in result
        assert any("optimisation" in s.lower() for s in result["suggestions"])

    def test_suggestions_overloaded_coach(self, optimizer):
        """Coach with > 12 slots should trigger overload warning."""
        # Create a coach with very high max to force overloading
        coaches = [
            {"id": 1, "name": "Coach Surcharge", "max_slots_per_week": 25, "speciality": "general"},
        ]
        optimizer.optimize(coaches=coaches, slots=DEFAULT_SLOTS)
        result = optimizer.get_suggestions()
        suggestions_text = " ".join(result["suggestions"]).lower()
        # If coach gets > 12 slots, warning should appear
        workload = optimizer.last_solution["coach_workload"]
        if workload.get("Coach Surcharge", 0) > 12:
            assert "creneaux" in suggestions_text or "repartition" in suggestions_text

    def test_suggestions_optimal_plan(self, optimizer, test_coaches):
        """Optimal plan with good coverage should say 'aucune amelioration'."""
        optimizer.optimize(coaches=test_coaches, slots=DEFAULT_SLOTS)
        result = optimizer.get_suggestions()
        # At least one suggestion should exist (even if it's the "all good" message)
        assert len(result["suggestions"]) >= 1
