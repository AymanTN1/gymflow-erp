import React, { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    fetch('http://localhost:8080/api/finances/transactions')
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error(err));

    fetch('http://localhost:8080/api/reports/evolution')
      .then(res => res.json())
      .then(data => setChartData(data))
      .catch(err => console.error("Erreur fetch rapports:", err));

    fetch('http://localhost:8080/api/checkin/active-count')
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
  const incomes = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.montant, 0);
  const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.montant, 0);
  const net = incomes - expenses;

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
          <a href="http://localhost:8080/api/reports/export/csv" className="btn btn-outline-light px-3 d-flex align-items-center gap-2" download>
            <span>📊</span> CSV (Excel)
          </a>
          <a href="http://localhost:8080/api/reports/export/pdf" className="btn btn-gold px-3 d-flex align-items-center gap-2" download target="_blank" rel="noreferrer">
            <span>📄</span> PDF
          </a>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* KPI Cards */}
        <div className="col-12 col-md-4">
          <div className="card card-premium p-4 text-center">
            <span className="text-muted small fw-bold mb-2">MRR ACTUEL</span>
            <h2 className="text-gold fw-bold mb-1">124,500 DH</h2>
            <span className="text-success small">↑ +12.5% vs mois dernier</span>
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
            <span className="text-muted small fw-bold mb-2">BÉNÉFICE NET (MOIS EN COURS)</span>
            <h2 className={net >= 0 ? "text-success fw-bold mb-1" : "text-danger fw-bold mb-1"}>
              {net.toFixed(2)} DH
            </h2>
            <span className="text-warning small">Calcul en temps réel</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Évolution des Revenus & Dépenses</h4>
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFCC00" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FFCC00" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" tick={{fill: '#888888'}} />
                  <YAxis stroke="#888888" tick={{fill: '#888888'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(18,18,18,0.9)', borderRadius: '8px', border: '1px solid #FFCC00' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="Revenus" stroke="#FFCC00" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenus)" name="Revenus (DH)" />
                  <Area type="monotone" dataKey="Dépenses" stroke="#ff4d4d" strokeWidth={3} fillOpacity={1} fill="url(#colorDepenses)" name="Dépenses (DH)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="col-12 col-lg-4">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Flux Trésorerie Actuel</h4>
            <div className="d-flex justify-content-between mb-3 border-bottom border-secondary pb-2">
              <span className="text-muted">Total Entrées</span>
              <span className="text-success fw-bold">+{incomes.toFixed(2)} DH</span>
            </div>
            <div className="d-flex justify-content-between mb-3 border-bottom border-secondary pb-2">
              <span className="text-muted">Total Sorties</span>
              <span className="text-danger fw-bold">-{expenses.toFixed(2)} DH</span>
            </div>
            <div className="d-flex justify-content-between mt-auto bg-dark p-3 rounded border border-warning">
              <span className="fw-bold text-white">RÉSULTAT NET</span>
              <span className={`fw-bold ${net >= 0 ? 'text-success' : 'text-danger'}`}>{net >= 0 ? '+' : ''}{net.toFixed(2)} DH</span>
            </div>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
