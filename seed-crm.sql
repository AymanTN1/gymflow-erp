INSERT INTO clients (nom_complet, email, telephone, cin, date_inscription, statut) VALUES ('Karim Tazi', 'karim@gmail.com', '0601020304', 'AB123456', CURRENT_TIMESTAMP, 'ACTIF');
INSERT INTO clients (nom_complet, email, telephone, cin, date_inscription, statut) VALUES ('Fatima Zahra', 'fatima@gmail.com', '0655443322', 'CD789012', CURRENT_TIMESTAMP, 'ACTIF');
INSERT INTO clients (nom_complet, email, telephone, cin, date_inscription, statut) VALUES ('Amine Benjelloun', 'amine@gmail.com', '0611223344', 'EF345678', CURRENT_TIMESTAMP, 'ACTIF');

-- L'ID de Karim devrait être 1, Fatima 2, Amine 3
-- Karim: Abonnement expire demain (EXPIRE_BIENTOT)
INSERT INTO memberships (client_id, type_abonnement, prix_paye, date_debut, date_fin, statut) VALUES (1, '1 MOIS', 250.00, CURRENT_TIMESTAMP - interval '29 days', CURRENT_TIMESTAMP + interval '1 day', 'ACTIF');

-- Fatima: Abonnement expiré il y a 5 jours (EXPIRE)
INSERT INTO memberships (client_id, type_abonnement, prix_paye, date_debut, date_fin, statut) VALUES (2, '3 MOIS', 600.00, CURRENT_TIMESTAMP - interval '95 days', CURRENT_TIMESTAMP - interval '5 days', 'EXPIRE');

-- Amine: Abonnement tout neuf (ACTIF)
INSERT INTO memberships (client_id, type_abonnement, prix_paye, date_debut, date_fin, statut) VALUES (3, '1 AN', 2000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '1 year', 'ACTIF');
