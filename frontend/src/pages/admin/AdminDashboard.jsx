import { apiFetch } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    apiFetch('http://localhost:8080/api/finances/transactions')
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error(err));

    apiFetch('http://localhost:8080/api/reports/evolution')
      .then(res => res.json())
      .then(data => setChartData(data))
      .catch(err => console.error("Erreur fetch rapports:", err));

    apiFetch('http://localhost:8080/api/checkin/active-count')
      .then(res => res.json())
      .then(data => setActiveCount(data.count))
      .catch(err => console.error("Erreur fetch count:", err));

    const eventSource = new EventSource('http://localhost:8080/api/checkin/stream');
    eventSource.addEventListener('countUpdate', (event) => {
      const data = JSON.parse(event.data);
      setActiveCount(data.count);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Compute MRR and active members based on DB
  // Obtenir le mois actif pour les statistiques (mois actuel YYYY-MM, ou le plus récent disponible)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const currentMonthTransactions = transactions.filter(t => t.dateTransaction && t.dateTransaction.substring(0, 7) === currentMonthStr);
  
  const activeTransactions = currentMonthTransactions.length > 0
    ? currentMonthTransactions
    : (() => {
        if (transactions.length === 0) return [];
        const latestMonth = transactions.reduce((latest, t) => {
          const m = t.dateTransaction ? t.dateTransaction.substring(0, 7) : "";
          return m > latest ? m : latest;
        }, "");
        return transactions.filter(t => t.dateTransaction && t.dateTransaction.substring(0, 7) === latestMonth);
      })();

  const activeMonthName = activeTransactions.length > 0 
    ? new Date(activeTransactions[0].dateTransaction).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : "";

  const incomes = activeTransactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.montant, 0);
  const expenses = activeTransactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.montant, 0);
  const net = incomes - expenses;
  const profitMargin = incomes > 0 ? ((net / incomes) * 100).toFixed(1) : "0.0";

  // Calculer le MRR actuel (Revenus d'abonnements du mois actif)
  const mrr = activeTransactions
    .filter(t => t.type === 'INCOME' && t.categorie === 'ABONNEMENT')
    .reduce((a, b) => a + b.montant, 0);

  // Calculer la catégorie de dépenses principale
  const expensesByCat = {};
  activeTransactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    expensesByCat[t.categorie] = (expensesByCat[t.categorie] || 0) + t.montant;
  });
  let biggestExpenseCat = "Aucune";
  let biggestExpenseAmount = 0;
  Object.keys(expensesByCat).forEach(cat => {
    if (expensesByCat[cat] > biggestExpenseAmount) {
      biggestExpenseAmount = expensesByCat[cat];
      biggestExpenseCat = cat;
    }
  });

  // Calculer la catégorie de revenus principale
  const incomesByCat = {};
  activeTransactions.filter(t => t.type === 'INCOME').forEach(t => {
    incomesByCat[t.categorie] = (incomesByCat[t.categorie] || 0) + t.montant;
  });
  let biggestIncomeCat = "Aucune";
  let biggestIncomeAmount = 0;
  Object.keys(incomesByCat).forEach(cat => {
    if (incomesByCat[cat] > biggestIncomeAmount) {
      biggestIncomeAmount = incomesByCat[cat];
      biggestIncomeCat = cat;
    }
  });

  const handleDownload = async (url, filename) => {
    try {
      const response = await apiFetch(url);
      if (!response.ok) throw new Error("Erreur lors de l'exportation");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      alert("Une erreur est survenue lors de la génération du fichier.");
    }
  };

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-4">
          <h2 className="fw-bold mb-0">Dashboard Global</h2>
          <div className="badge bg-success bg-opacity-25 text-success border border-success p-2 px-3 fs-6 rounded-pill animate-pulse">
            <span className="me-2">🔴 LIVE</span> {activeCount} personnes en salle
          </div>
        </div>
        <div className="d-flex gap-2">
          <button 
            onClick={() => handleDownload('http://localhost:8080/api/reports/export/csv', 'rapport_financier.csv')} 
            className="btn btn-outline-light px-3 d-flex align-items-center gap-2"
          >
            <span>📊</span> CSV (Excel)
          </button>
          <button 
            onClick={() => handleDownload('http://localhost:8080/api/reports/export/pdf', 'rapport_financier.pdf')} 
            className="btn btn-gold px-3 d-flex align-items-center gap-2"
          >
            <span>📄</span> PDF
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* KPI Cards */}
        <div className="col-12 col-md-4">
          <div className="card card-premium p-4 text-center">
            <span className="text-muted small fw-bold mb-2">MRR ({activeMonthName})</span>
            <h2 className="text-gold fw-bold mb-1">
              {mrr.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
            </h2>
            <span className="text-success small">↑ Basé sur les abonnements</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card card-premium p-4 text-center">
            <span className="text-muted small fw-bold mb-2">MEMBRES ACTIFS</span>
            <h2 className="text-white fw-bold mb-1">842</h2>
            <span className="text-success small">↑ +45 nouveaux</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card card-premium p-4 text-center">
            <span className="text-muted small fw-bold mb-2">BÉNÉFICE NET ({activeMonthName})</span>
            <h2 className={net >= 0 ? "text-success fw-bold mb-1" : "text-danger fw-bold mb-1"}>
              {net.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
            </h2>
            <span className="text-warning small">Calcul en temps réel</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Évolution des Revenus, Dépenses & Gain Net</h4>
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFCC00" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#FFCC00" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#2ecc71" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" tick={{fill: '#888888'}} />
                  <YAxis stroke="#888888" tick={{fill: '#888888'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(18,18,18,0.9)', borderRadius: '8px', border: '1px solid #FFCC00' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value) => Number(value).toFixed(2) + " DH"}
                  />
                  <Area type="monotone" dataKey="Revenus" stroke="#FFCC00" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenus)" name="Revenus (DH)" />
                  <Area type="monotone" dataKey="Dépenses" stroke="#ff4d4d" strokeWidth={3} fillOpacity={1} fill="url(#colorDepenses)" name="Dépenses (DH)" />
                  <Area type="monotone" dataKey="Benefice" stroke="#2ecc71" strokeWidth={3} fillOpacity={1} fill="url(#colorBenefice)" name="Gain Net (DH)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="col-12 col-lg-4">
          <div className="card card-premium p-4 h-100 d-flex flex-column">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Flux Trésorerie ({activeMonthName})</h4>
            
            <div className="d-flex justify-content-between mb-3 border-bottom border-secondary pb-2">
              <span className="text-muted">Total Entrées</span>
              <span className="text-success fw-bold">
                +{incomes.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
              </span>
            </div>
            
            <div className="d-flex justify-content-between mb-3 border-bottom border-secondary pb-2">
              <span className="text-muted">Total Sorties</span>
              <span className="text-danger fw-bold">
                -{expenses.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
              </span>
            </div>

            <div className="d-flex justify-content-between mb-3 border-bottom border-secondary pb-2">
              <span className="text-muted">Source principale</span>
              <span className="text-white fw-bold">
                {biggestIncomeCat} ({biggestIncomeAmount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH)
              </span>
            </div>

            <div className="d-flex justify-content-between mb-3 border-bottom border-secondary pb-2">
              <span className="text-muted">Charge principale</span>
              <span className="text-white fw-bold">
                {biggestExpenseCat} ({biggestExpenseAmount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH)
              </span>
            </div>

            <div className="d-flex justify-content-between mb-3 border-bottom border-secondary pb-2">
              <span className="text-muted">Marge Bénéficiaire</span>
              <span className="text-info fw-bold">{profitMargin}%</span>
            </div>

            <div className="d-flex justify-content-between mt-auto bg-dark p-3 rounded border border-warning">
              <span className="fw-bold text-white">RÉSULTAT NET</span>
              <span className={`fw-bold ${net >= 0 ? 'text-success' : 'text-danger'}`}>
                {net >= 0 ? '+' : ''}{net.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
              </span>
            </div>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
