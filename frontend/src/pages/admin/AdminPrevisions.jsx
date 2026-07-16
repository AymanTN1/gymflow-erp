import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminPrevisions() {
  const [dailyForecast, setDailyForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [peakHours, setPeakHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dailyRes, hourlyRes, peakRes] = await Promise.all([
        apiFetch('http://localhost:8000/api/ml/forecast/daily?days=7'),
        apiFetch('http://localhost:8000/api/ml/forecast/hourly'),
        apiFetch('http://localhost:8000/api/ml/forecast/peak-hours')
      ]);

      if (dailyRes.ok) {
        const dailyData = await dailyRes.ok ? await dailyRes.json() : {};
        setDailyForecast(dailyData.forecasts || []);
      }
      if (hourlyRes.ok) {
        const hourlyData = await hourlyRes.ok ? await hourlyRes.json() : {};
        setHourlyForecast(hourlyData.forecasts || []);
      }
      if (peakRes.ok) {
        setPeakHours(await peakRes.json());
      }
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Le microservice d'analyse predictive est hors ligne.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">📈 Prévisions d'Affluence et Fréquentation</h2>
        <button className="btn btn-outline-light" onClick={fetchData}>🔄 Actualiser</button>
      </div>

      {error && (
        <div className="alert alert-danger border-danger bg-danger bg-opacity-10 text-danger mb-4">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="text-muted mt-2">Calcul des modeles de previsions de frequentation...</p>
        </div>
      ) : (
        <>
          {/* ANALYSE PICS D'AFFLUENCE */}
          {peakHours && (
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="card-premium p-4 text-center h-100 border-warning border-opacity-25">
                  <h6 className="text-muted mb-2">Pic Matin</h6>
                  <h3 className="fw-bold text-warning">{peakHours.morning_peak}</h3>
                  <p className="small text-muted mb-0">Affluence elevee</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card-premium p-4 text-center h-100 border-warning border-opacity-25">
                  <h6 className="text-muted mb-2">Pic Soirée</h6>
                  <h3 className="fw-bold text-warning">{peakHours.evening_peak}</h3>
                  <p className="small text-muted mb-0">Affluence maximale</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card-premium p-4 text-center h-100 border-success border-opacity-25">
                  <h6 className="text-muted mb-2">Jour le plus chargé</h6>
                  <h3 className="fw-bold text-success">{peakHours.busiest_day}</h3>
                  <p className="small text-muted mb-0">Forte frequentation</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card-premium p-4 text-center h-100 border-info border-opacity-25">
                  <h6 className="text-muted mb-2">Tendance Générale</h6>
                  <h3 className="fw-bold text-info">{peakHours.trend_direction?.toUpperCase()}</h3>
                  <p className="small text-muted mb-0">Taux de variation: {peakHours.trend_pct}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="row g-4">
            {/* PRÉVISIONS JOURNALIÈRES SUR 7 JOURS */}
            <div className="col-lg-7">
              <div className="card-premium p-4 h-100">
                <h5 className="text-gold mb-4">Estimation des entrées journalières (7 prochains jours)</h5>
                
                <div className="table-responsive">
                  <table className="table table-dark table-hover align-middle mb-0">
                    <thead>
                      <tr className="border-bottom border-warning border-opacity-25">
                        <th className="bg-transparent text-muted">Date</th>
                        <th className="bg-transparent text-muted">Jour</th>
                        <th className="bg-transparent text-muted text-center">Visiteurs Estimés</th>
                        <th className="bg-transparent text-muted text-center">Fourchette (Min - Max)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyForecast.map(f => (
                        <tr key={f.date} className="border-bottom border-secondary border-opacity-10">
                          <td className="bg-transparent">{f.date}</td>
                          <td className="bg-transparent fw-bold text-gold">{f.jour}</td>
                          <td className="bg-transparent text-center fw-bold fs-5">{f.predicted_visits}</td>
                          <td className="bg-transparent text-center text-muted">
                            {f.lower_bound} - {f.upper_bound} personnes
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* PRÉVISIONS HORAIRES (DEMAIN) */}
            <div className="col-lg-5">
              <div className="card-premium p-4 h-100">
                <h5 className="text-gold mb-4">Profil d'affluence prévu (Demain)</h5>
                
                <div className="d-flex flex-column gap-3">
                  {hourlyForecast.map(h => {
                    const barWidth = Math.min(100, (h.predicted_visits / 20) * 100);
                    const isPeak = h.predicted_visits >= 8;
                    
                    return (
                      <div key={h.hour} className="d-flex align-items-center gap-3">
                        <span className="text-muted small" style={{ width: '50px' }}>{h.hour}</span>
                        <div className="progress flex-grow-1" style={{ height: '14px', background: 'rgba(255,255,255,0.05)' }}>
                          <div 
                            className={`progress-bar ${isPeak ? 'bg-warning' : 'bg-info bg-opacity-75'}`} 
                            role="progressbar" 
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                        <span className={`fw-bold small ${isPeak ? 'text-warning' : 'text-muted'}`} style={{ width: '40px', textAlign: 'right' }}>
                          {h.predicted_visits}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ErpLayout>
  );
}
