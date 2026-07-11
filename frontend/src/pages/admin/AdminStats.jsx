import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/checkin/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Récupérer le nombre de personnes en salle
    apiFetch('http://localhost:8080/api/checkin/active-count')
      .then(res => res.json())
      .then(data => setActiveCount(data.count))
      .catch(err => console.error("Erreur fetch active count :", err));

    // Flux de scan en temps réel (SSE)
    const eventSource = new EventSource('http://localhost:8080/api/checkin/stream');
    
    eventSource.addEventListener('countUpdate', (event) => {
      const data = JSON.parse(event.data);
      setActiveCount(data.count);
    });

    eventSource.addEventListener('scanEvent', (event) => {
      const scanData = JSON.parse(event.data);
      setRecentScans(prev => [scanData, ...prev].slice(0, 8));
      // Re-fetch les stats en arrière plan pour mettre à jour les graphiques
      fetchStats();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Déterminer les jours et heures les plus chargés
  let busiestDay = "N/A";
  let busiestHour = "N/A";
  let maxDayEntrees = -1;
  let maxHourEntrees = -1;

  if (stats) {
    stats.dailyDistribution.forEach(d => {
      if (d.entrees > maxDayEntrees) {
        maxDayEntrees = d.entrees;
        busiestDay = d.day;
      }
    });

    stats.hourlyDistribution.forEach(h => {
      if (h.entrees > maxHourEntrees) {
        maxHourEntrees = h.entrees;
        busiestHour = h.hour;
      }
    });
  }

  const getBusiestHourRange = (hourStr) => {
    if (hourStr === "N/A") return "N/A";
    const hourInt = parseInt(hourStr.replace('h00', ''));
    return `${hourStr} - ${String(hourInt + 1).padStart(2, '0')}h00`;
  };

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">📈 Analyse d'Affluence</h2>
          <p className="text-muted mb-0">Statistiques d'accès et prévisions des heures de pointe</p>
        </div>
        <div className="badge bg-success bg-opacity-25 text-success border border-success p-2 px-3 fs-6 rounded-pill align-self-start" style={{ animation: 'pulse 2s infinite' }}>
          <span className="me-2">🔴 LIVE</span> {activeCount} membres en salle
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-gold">
          <div className="spinner-border mb-2" role="status"></div>
          <div>Chargement des statistiques...</div>
        </div>
      ) : (
        <>
          {/* STATS DE HAUT DE PAGE */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card-premium p-3 text-center">
                <h1 className="text-gold fw-bold mb-1">{stats?.totalCheckins || 0}</h1>
                <p className="text-muted mb-0 small">Passages Totaux</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card-premium p-3 text-center">
                <h1 className="text-gold fw-bold mb-1">{stats?.avgDurationMinutes || 0} min</h1>
                <p className="text-muted mb-0 small">Temps Moyen de Séance</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card-premium p-3 text-center">
                <h1 className="text-warning fw-bold mb-1 text-uppercase">{busiestDay}</h1>
                <p className="text-muted mb-0 small">Jour le plus fréquenté</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card-premium p-3 text-center">
                <h1 className="text-warning fw-bold mb-1">{getBusiestHourRange(busiestHour)}</h1>
                <p className="text-muted mb-0 small">Heure de pointe principale</p>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* GRAPHIQUE 1 : PAR HEURE */}
            <div className="col-lg-8">
              <div className="card-premium p-4 h-100">
                <h5 className="text-gold mb-3">🕒 Fréquentation par Heure de la journée</h5>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer>
                    <AreaChart data={stats?.hourlyDistribution || []}>
                      <defs>
                        <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffcc00" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ffcc00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="hour" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(20, 20, 20, 0.95)',
                          border: '1px solid rgba(255, 204, 0, 0.3)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Area type="monotone" dataKey="entrees" name="Visiteurs" stroke="#ffcc00" strokeWidth={2} fillOpacity={1} fill="url(#colorEntrees)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* INSIGHTS / RECOMMANDATIONS */}
            <div className="col-lg-4">
              <div className="card-premium p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <h5 className="text-gold mb-3">💡 Insights & Recommandations</h5>
                  <ul className="list-unstyled d-flex flex-column gap-3 mb-0 small">
                    <li className="d-flex gap-2">
                      <span className="fs-5">🔥</span>
                      <div>
                        <strong>Pics d'affluence :</strong> Le moment le plus chargé est de <strong>{getBusiestHourRange(busiestHour)}</strong>. Nous conseillons de planifier des coachs supplémentaires en plateau à cette heure.
                      </div>
                    </li>
                    <li className="d-flex gap-2">
                      <span className="fs-5">📉</span>
                      <div>
                        <strong>Heures creuses :</strong> Les plages <strong>10h00 - 12h00</strong> et <strong>14h00 - 16h00</strong> sont généralement calmes. Vous pourriez y programmer des promotions ou des cours ciblés "heures creuses".
                      </div>
                    </li>
                    <li className="d-flex gap-2">
                      <span className="fs-5">📅</span>
                      <div>
                        <strong>Planification Hebdomadaire :</strong> Le <strong>{busiestDay}</strong> enregistre le plus grand nombre d'entrées. Assurez-vous que l'équipe d'accueil et le staff d'entretien soient renforcés ce jour-là.
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-4 pt-3 border-top border-warning border-opacity-10">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Moyenne d'entraînement :</span>
                    <span className="fw-bold text-gold">{stats?.avgDurationMinutes || 0} minutes</span>
                  </div>
                  <div className="progress mt-2" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${Math.min(100, ((stats?.avgDurationMinutes || 0) / 120) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* GRAPHIQUE 2 : PAR JOUR DE LA SEMAINE */}
            <div className="col-lg-6">
              <div className="card-premium p-4">
                <h5 className="text-gold mb-3">📅 Fréquentation Hebdomadaire (par Jour)</h5>
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer>
                    <BarChart data={stats?.dailyDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(20, 20, 20, 0.95)',
                          border: '1px solid rgba(255, 204, 0, 0.3)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="entrees" name="Passages" fill="#ffcc00" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* PASSAGES EN DIRECT (SSE) */}
            <div className="col-lg-6">
              <div className="card-premium p-4">
                <h5 className="text-gold mb-3">⚡ Activité Recente (Temps Réel)</h5>
                <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {recentScans.length === 0 ? (
                    <div className="text-muted text-center py-5">
                      <span className="fs-3 d-block mb-2">📡</span>
                      Aucun passage enregistré depuis l'ouverture de la page.
                    </div>
                  ) : (
                    <table className="table table-dark table-borderless align-middle mb-0" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr className="text-muted border-bottom border-warning border-opacity-10">
                          <th>Client</th>
                          <th>Statut</th>
                          <th>Heure</th>
                          <th>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentScans.map((scan, idx) => (
                          <tr key={idx} className="border-bottom border-warning border-opacity-5">
                            <td className="fw-bold">{scan.clientName}</td>
                            <td>
                              <span className={`badge ${
                                scan.status === 'SUCCESS' ? 'bg-success bg-opacity-20 text-success border border-success' :
                                scan.status === 'WARNING' ? 'bg-warning bg-opacity-20 text-warning border border-warning' :
                                'bg-danger bg-opacity-20 text-danger border border-danger'
                              } px-2`}>
                                {scan.status}
                              </span>
                            </td>
                            <td className="text-muted">
                              {new Date(scan.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="small text-muted">{scan.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ErpLayout>
  );
}
