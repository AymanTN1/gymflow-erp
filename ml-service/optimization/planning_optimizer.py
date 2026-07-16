"""
Planning Optimizer — Integer Linear Programming (ILP) with PuLP.
Solves the coach-to-slot assignment problem to maximize schedule quality.
"""
import pulp
import numpy as np
from database import fetch_dataframe
from datetime import datetime, timedelta


# Time slots for a typical gym week
DEFAULT_SLOTS = []
DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
TIME_BLOCKS = [
    ("08:00", "10:00", "Matin"),
    ("10:00", "12:00", "Mi-journee"),
    ("14:00", "16:00", "Apres-midi"),
    ("16:00", "18:00", "Fin apres-midi"),
    ("18:00", "20:00", "Soiree"),
]

for day in DAYS:
    for start, end, label in TIME_BLOCKS:
        DEFAULT_SLOTS.append({
            "id": f"{day}_{start}",
            "day": day,
            "start": start,
            "end": end,
            "label": f"{day} {label} ({start}-{end})",
        })


class PlanningOptimizer:
    def __init__(self):
        self.last_solution = None
        self.solver_status = None

    def _get_coaches_from_db(self):
        """Load coaches from the database."""
        try:
            df = fetch_dataframe("SELECT id, nom, role FROM users WHERE role = 'COACH'")
            coaches = []
            for _, row in df.iterrows():
                coaches.append({
                    "id": int(row["id"]),
                    "name": row["nom"],
                    "max_slots_per_week": 15,  # default max
                    "speciality": "general",
                })
            return coaches
        except Exception as e:
            print(f"[Optimizer] Error loading coaches: {e}")
            return []

    def _generate_availability(self, coaches, slots):
        """
        Generate a realistic availability matrix.
        In production, this would come from coach preferences in the DB.
        """
        np.random.seed(42)
        availability = {}
        for coach in coaches:
            for slot in slots:
                # Coaches generally available 70% of slots
                availability[(coach["id"], slot["id"])] = 1 if np.random.random() > 0.3 else 0
                # Everyone available Monday/Tuesday morning (typical pattern)
                if slot["day"] in ["Lundi", "Mardi"] and slot["start"] in ["08:00", "10:00"]:
                    availability[(coach["id"], slot["id"])] = 1
        return availability

    def _generate_demand(self, slots):
        """
        Generate expected demand per slot.
        In production, this would come from the forecasting model.
        """
        demand = {}
        for slot in slots:
            base = 15  # avg clients per slot
            # Peak hours have more demand
            if slot["start"] in ["18:00", "16:00"]:
                base = 25
            elif slot["start"] in ["08:00"]:
                base = 20
            elif slot["start"] in ["14:00"]:
                base = 10
            # Saturday lower demand
            if slot["day"] == "Samedi":
                base = int(base * 0.7)
            demand[slot["id"]] = base
        return demand

    def _compute_score(self, coach, slot, demand):
        """
        Compute adequacy score for assigning a coach to a slot.
        Higher score = better match.
        """
        base_score = demand.get(slot["id"], 10)

        # Bonus for peak hours (we want good coverage)
        if slot["start"] in ["18:00", "16:00"]:
            base_score *= 1.3

        return round(base_score, 2)

    def optimize(self, coaches=None, slots=None):
        """
        Solve the coach scheduling optimization problem using ILP.

        Model:
          Maximize: sum(score[i][j] * x[i][j])
          Subject to:
            C1: x[i][j] <= availability[i][j]           (availability constraint)
            C2: sum_j(x[i][j]) <= max_slots[i]          (max hours per coach)
            C3: sum_i(x[i][j]) >= 1 for high-demand     (minimum coverage)
            C4: sum_i(x[i][j]) <= 2                     (max 2 coaches per slot)
            C5: rest constraint (at least 1 day off)
        """
        # Load data
        if coaches is None:
            coaches = self._get_coaches_from_db()
        if not coaches:
            coaches = [
                {"id": 1, "name": "Coach Youssef", "max_slots_per_week": 15, "speciality": "general"},
                {"id": 2, "name": "Coach Amine", "max_slots_per_week": 12, "speciality": "cardio"},
                {"id": 3, "name": "Coach Sara", "max_slots_per_week": 10, "speciality": "yoga"},
            ]
        if slots is None:
            slots = DEFAULT_SLOTS

        availability = self._generate_availability(coaches, slots)
        demand = self._generate_demand(slots)

        # ========== PULP MODEL ==========
        prob = pulp.LpProblem("Coach_Scheduling_Optimization", pulp.LpMaximize)

        # Decision variables: x[i,j] = 1 if coach i assigned to slot j
        x = pulp.LpVariable.dicts(
            "assign",
            ((c["id"], s["id"]) for c in coaches for s in slots),
            cat="Binary"
        )

        # Compute scores
        scores = {}
        for c in coaches:
            for s in slots:
                scores[(c["id"], s["id"])] = self._compute_score(c, s, demand)

        # === OBJECTIVE: Maximize total adequacy score ===
        prob += pulp.lpSum(
            scores[(c["id"], s["id"])] * x[(c["id"], s["id"])]
            for c in coaches for s in slots
        ), "Total_Score"

        # === CONSTRAINT C1: Availability ===
        for c in coaches:
            for s in slots:
                prob += x[(c["id"], s["id"])] <= availability.get((c["id"], s["id"]), 0), \
                    f"Avail_{c['id']}_{s['id']}"

        # === CONSTRAINT C2: Max slots per week per coach ===
        for c in coaches:
            prob += pulp.lpSum(
                x[(c["id"], s["id"])] for s in slots
            ) <= c["max_slots_per_week"], f"MaxSlots_{c['id']}"

        # === CONSTRAINT C3: Minimum coverage for high-demand slots ===
        for s in slots:
            if demand.get(s["id"], 0) >= 15:
                prob += pulp.lpSum(
                    x[(c["id"], s["id"])] for c in coaches
                ) >= 1, f"MinCoverage_{s['id']}"

        # === CONSTRAINT C4: Max 2 coaches per slot ===
        for s in slots:
            prob += pulp.lpSum(
                x[(c["id"], s["id"])] for c in coaches
            ) <= 2, f"MaxPerSlot_{s['id']}"

        # === CONSTRAINT C5: Rest — each coach has at least 1 day off ===
        for c in coaches:
            y = pulp.LpVariable.dicts(
                f"works_{c['id']}",
                DAYS,
                cat="Binary"
            )
            for day in DAYS:
                day_slots = [s for s in slots if s["day"] == day]
                for s in day_slots:
                    prob += x[(c["id"], s["id"])] <= y[day], f"Link_{c['id']}_{day}_{s['id']}"
            prob += pulp.lpSum(y[day] for day in DAYS) <= len(DAYS) - 1, f"Rest_{c['id']}"

        # === SOLVE ===
        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=30)
        prob.solve(solver)

        self.solver_status = pulp.LpStatus[prob.status]

        # === EXTRACT SOLUTION ===
        schedule = []
        coach_map = {c["id"]: c["name"] for c in coaches}
        total_score = 0

        for c in coaches:
            for s in slots:
                if x[(c["id"], s["id"])].varValue == 1:
                    sc = scores[(c["id"], s["id"])]
                    total_score += sc
                    schedule.append({
                        "coach_id": c["id"],
                        "coach_name": coach_map[c["id"]],
                        "slot_id": s["id"],
                        "day": s["day"],
                        "start": s["start"],
                        "end": s["end"],
                        "label": s["label"],
                        "score": sc,
                    })

        # Sort by day order then time
        day_order = {d: i for i, d in enumerate(DAYS)}
        schedule.sort(key=lambda x: (day_order.get(x["day"], 99), x["start"]))

        # Compute stats
        covered_slots = len(set(a["slot_id"] for a in schedule))
        total_slots = len(slots)

        # Coach workload summary
        coach_workload = {}
        for a in schedule:
            cname = a["coach_name"]
            if cname not in coach_workload:
                coach_workload[cname] = 0
            coach_workload[cname] += 1

        self.last_solution = {
            "status": self.solver_status,
            "optimal_schedule": schedule,
            "total_score": round(total_score, 2),
            "covered_slots": covered_slots,
            "total_slots": total_slots,
            "coverage_pct": round(covered_slots / max(total_slots, 1) * 100, 1),
            "coach_workload": coach_workload,
            "constraints": {
                "C1": "Disponibilite des coachs",
                "C2": "Limite horaire hebdomadaire",
                "C3": "Couverture minimale des creneaux a forte demande",
                "C4": "Maximum 2 coachs par creneau",
                "C5": "Minimum 1 jour de repos par coach",
            },
            "solver": "PuLP CBC (Integer Linear Programming)",
        }

        print(f"[Optimizer] Solution: {self.solver_status}, score={total_score:.1f}, "
              f"coverage={covered_slots}/{total_slots}")

        return self.last_solution

    def get_suggestions(self):
        """Generate improvement suggestions based on the current solution."""
        if not self.last_solution:
            return {"suggestions": ["Lancez d'abord l'optimisation pour obtenir des suggestions."]}

        suggestions = []
        sol = self.last_solution

        if sol["coverage_pct"] < 80:
            suggestions.append(
                f"La couverture est de {sol['coverage_pct']}%. "
                f"Envisagez de recruter un coach supplementaire pour couvrir les creneaux manquants."
            )

        for coach, slots_count in sol["coach_workload"].items():
            if slots_count > 12:
                suggestions.append(
                    f"{coach} est assigne a {slots_count} creneaux cette semaine. "
                    f"Considerez une meilleure repartition."
                )
            elif slots_count < 3:
                suggestions.append(
                    f"{coach} n'a que {slots_count} creneaux. "
                    f"Verifiez sa disponibilite ou proposez-lui plus de sessions."
                )

        if not suggestions:
            suggestions.append("Le planning actuel est optimal. Aucune amelioration necessaire.")

        return {"suggestions": suggestions}


# Singleton
planning_optimizer = PlanningOptimizer()
