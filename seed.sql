-- Users
INSERT INTO users (nom, email, mot_de_passe, role) VALUES ('M. Ayman (Propriétaire)', 'admin@happyfitness.ma', 'admin123', 'ADMIN') ON CONFLICT DO NOTHING;
INSERT INTO users (nom, email, mot_de_passe, role) VALUES ('Youssef (Coach)', 'youssef@happyfitness.ma', 'coach123', 'COACH') ON CONFLICT DO NOTHING;
INSERT INTO users (nom, email, mot_de_passe, role) VALUES ('Sara (Réception)', 'sara@happyfitness.ma', 'rec123', 'RECEPTION') ON CONFLICT DO NOTHING;

-- Transactions
INSERT INTO transactions (type, categorie, montant, description, date_transaction) VALUES ('EXPENSE', 'REDAL', 2500.00, 'Facture eau et électricité du mois de Mai', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO transactions (type, categorie, montant, description, date_transaction) VALUES ('EXPENSE', 'GAZ', 450.00, '10 bouteilles de gaz pour les douches', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO transactions (type, categorie, montant, description, date_transaction) VALUES ('INCOME', 'ABONNEMENT', 124500.00, 'Revenus des abonnements globaux du mois en cours', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO transactions (type, categorie, montant, description, date_transaction) VALUES ('EXPENSE', 'MAINTENANCE', 1200.00, 'Réparation de 2 tapis de course', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;

-- Payroll (Fiche de Paie)
-- Assumons que Youssef a l'ID 2 (généralement 1 est Admin, 2 est Coach, 3 est Reception).
INSERT INTO payrolls (employe_id, nom_employe, salaire_base, type_paiement, cnss, prime, total_paye, mois_ou_semaine, date_paiement) VALUES (2, 'Youssef (Coach)', 4000.00, 'MENSUEL', 250.00, 500.00, 4250.00, 'Juin 2026', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;

-- Transaction pour le salaire
INSERT INTO transactions (type, categorie, montant, description, date_transaction) VALUES ('EXPENSE', 'SALAIRE', 4250.00, 'Paie de Youssef (Coach) - Juin 2026', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
