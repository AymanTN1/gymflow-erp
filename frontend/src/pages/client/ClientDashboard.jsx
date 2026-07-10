import { apiFetch } from '../../utils/api';
import { useState, useEffect, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Link } from 'react-router-dom';
import ErpLayout from '../../components/layout/ErpLayout';

const CLIENT_ID = 1; // Simulé pour l'instant

export default function ClientDashboard() {
  const [scanStatus, setScanStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    // Charger profil, stats et affluence en parallèle
    Promise.all([
      apiFetch(`http://localhost:8080/api/client/${CLIENT_ID}/profile`).then(r => r.json()),
      apiFetch(`http://localhost:8080/api/client/${CLIENT_ID}/stats`).then(r => r.json()),
      apiFetch('http://localhost:8080/api/checkin/active-count').then(r => r.json())
    ]).then(([prof, st, count]) => {
      setProfile(prof);
      setStats(st);
      setActiveCount(count.count);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });

    // SSE pour affluence temps réel
    const eventSource = new EventSource('http://localhost:8080/api/checkin/stream');
    eventSource.addEventListener('countUpdate', (event) => {
      const data = JSON.parse(event.data);
      setActiveCount(data.count);
    });
    return () => eventSource.close();
  }, []);

  // Dessiner le graphique quand les stats sont chargées
  useEffect(() => {
    if (stats?.historiqueVisites && chartRef.current) {
      drawChart();
    }
  }, [stats]);

  const drawChart = () => {
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    const data = stats.historiqueVisites;
    const maxVisites = Math.max(...data.map(d => d.visites), 1);
    
    // DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    
    ctx.clearRect(0, 0, w, h);
    
    // Grille horizontale
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }
    
    // Labels Y
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const val = Math.round(maxVisites - (maxVisites / 4) * i);
      ctx.fillText(val, padding.left - 8, y + 4);
    }
    
    const barWidth = chartW / data.length;
    
    // Gradient pour les barres
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, '#FFCC00');
    gradient.addColorStop(1, 'rgba(255,204,0,0.2)');
    
    // Dessiner les barres avec animation
    data.forEach((d, i) => {
      const barH = (d.visites / maxVisites) * chartH;
      const x = padding.left + i * barWidth + barWidth * 0.15;
      const bw = barWidth * 0.7;
      const y = padding.top + chartH - barH;
      
      // Barre
      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Rounded top
      const radius = Math.min(6, bw / 2);
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + bw - radius, y);
      ctx.quadraticCurveTo(x + bw, y, x + bw, y + radius);
      ctx.lineTo(x + bw, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
      
      // Valeur au-dessus
      if (d.visites > 0) {
        ctx.fillStyle = '#FFCC00';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.visites, x + bw / 2, y - 6);
      }
      
      // Label du mois en dessous
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.mois, x + bw / 2, h - padding.bottom + 20);
    });
  };

  const handleScan = async (text) => {
    if (text) {
      setScanning(false);
      try {
        const res = await apiFetch('http://localhost:8080/api/checkin/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: text, clientId: String(CLIENT_ID) })
        });
        if (res.ok) {
          const data = await res.json();
          setScanStatus(data.status);
        } else {
          setScanStatus('DANGER');
        }
      } catch (err) {
        setScanStatus('DANGER');
      }
    }
  };

  const getAffluenceBadge = () => {
    if (activeCount < 10) return { text: "Faible", class: "bg-success", emoji: "🟢" };
    if (activeCount < 25) return { text: "Moyenne", class: "bg-warning text-dark", emoji: "🟡" };
    return { text: "Forte", class: "bg-danger", emoji: "🔴" };
  };

  const affluence = getAffluenceBadge();

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ErpLayout role="CLIENT">
        <div className="text-center py-5">
          <div className="spinner-border text-warning" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-muted mt-3">Chargement de votre espace...</p>
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout role="CLIENT">
      {/* Header avec nom et affluence */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            Bonjour, <span className="text-gold">{profile?.nomComplet || 'Client'}</span> 👋
          </h2>
          <p className="text-muted small mb-0">Voici le résumé de votre activité sportive.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Affluence :</span>
          <span className={`badge ${affluence.class} border p-2`}>
            {affluence.emoji} {affluence.text} ({activeCount})
          </span>
        </div>
      </div>

      {/* Bannière abonnement expiré */}
      {profile && !profile.abonnementActif && (
        <div className="alert mb-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 p-4"
          style={{ backgroundColor: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '12px' }}>
          <div>
            <h6 className="fw-bold text-danger mb-1">⚠️ Votre abonnement a expiré</h6>
            <p className="text-muted small mb-0">Renouvelez pour continuer vos entraînements.</p>
          </div>
          <Link to="/client/payment" className="btn btn-gold px-4 py-2 fw-bold flex-shrink-0" style={{ borderRadius: '10px' }}>
            💳 Renouveler
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card-premium p-3 text-center h-100">
            <div style={{ fontSize: '32px' }}>🔥</div>
            <h3 className="text-gold fw-bold mb-0">{stats?.streak || 0}</h3>
            <small className="text-muted">Jours consécutifs</small>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-premium p-3 text-center h-100">
            <div style={{ fontSize: '32px' }}>🏃</div>
            <h3 className="text-white fw-bold mb-0">{stats?.visitesCeMois || 0}</h3>
            <small className="text-muted">Visites ce mois</small>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-premium p-3 text-center h-100">
            <div style={{ fontSize: '32px' }}>🎯</div>
            <h3 className="text-white fw-bold mb-0">{stats?.coursSuivis || 0}</h3>
            <small className="text-muted">Cours suivis</small>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card-premium p-3 text-center h-100">
            <div style={{ fontSize: '32px' }}>⏱️</div>
            <h3 className="text-white fw-bold mb-0">{stats?.dureeMoyenneMinutes || 0}<small className="fs-6 text-muted"> min</small></h3>
            <small className="text-muted">Durée moy. session</small>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Graphique d'assiduité */}
        <div className="col-12 col-lg-8">
          <div className="card-premium p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">📊 Assiduité (6 derniers mois)</h5>
              <span className="badge bg-dark border border-warning border-opacity-25 px-3 py-2">
                {stats?.totalVisites || 0} visites au total
              </span>
            </div>
            <canvas
              ref={chartRef}
              style={{ width: '100%', height: '220px' }}
            />
          </div>
        </div>

        {/* Pointage */}
        <div className="col-12 col-lg-4">
          <div className="card-premium p-4 h-100 text-center d-flex flex-column justify-content-center align-items-center">
            <h5 className="text-gold fw-bold mb-4">Pointage à l'Entrée</h5>

            {scanning ? (
              <div style={{ width: '100%', maxWidth: '220px', borderRadius: '15px', overflow: 'hidden' }}>
                <Scanner onResult={(text) => handleScan(text)} />
                <button className="btn btn-outline-danger mt-3 w-100" onClick={() => setScanning(false)}>Annuler</button>
              </div>
            ) : (
              <>
                <button
                  className="btn btn-gold w-100 py-3 fw-bold fs-5 shadow-lg d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setScanning(true)}
                  style={{ borderRadius: '15px' }}
                >
                  <span className="fs-3">📷</span> Scanner
                </button>
                <p className="text-muted small mt-3 mb-0">Scannez le QR Code de la salle pour entrer.</p>
              </>
            )}

            {scanStatus === 'SUCCESS' && <div className="alert alert-success mt-3 w-100 py-2">✅ Pointage Réussi</div>}
            {scanStatus === 'WARNING' && <div className="alert alert-warning mt-3 w-100 py-2">⚠️ Expire bientôt</div>}
            {scanStatus === 'DANGER' && <div className="alert alert-danger mt-3 w-100 py-2">❌ Accès Refusé</div>}
          </div>
        </div>
      </div>

      {/* Mon Profil + Abonnement */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6">
          <div className="card-premium p-4 h-100">
            <h5 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-3">👤 Mon Profil</h5>
            
            <div className="d-flex align-items-center gap-3 mb-4">
              {profile?.photoUrl ? (
                <img src={`http://localhost:8080${profile.photoUrl}`} alt="Profile" className="rounded-circle border border-warning shadow-sm" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
              ) : (
                <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center text-white border border-secondary shadow-sm" style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                  {profile?.nomComplet?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h5 className="mb-0 text-white fw-bold">{profile?.nomComplet}</h5>
                <span className="badge bg-gold text-dark mt-1">Membre Officiel</span>
              </div>
            </div>

            <div className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Email</span>
                <span className="text-white">{profile?.email || '—'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Téléphone</span>
                <span className="text-white">{profile?.telephone || '—'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Inscrit depuis</span>
                <span className="text-white">{formatDate(profile?.dateInscription)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Abonnements souscrits</span>
                <span className="text-gold fw-bold">{profile?.totalAbonnements || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card-premium p-4 h-100">
            <h5 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-3">📋 Abonnement Actif</h5>
            {profile?.abonnementActif ? (
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Type</span>
                  <span className="text-gold fw-bold">{profile.abonnementActif.typeAbonnement}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Date de début</span>
                  <span className="text-white">{formatDate(profile.abonnementActif.dateDebut)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Expire le</span>
                  <span className="text-white">{formatDate(profile.abonnementActif.dateFin)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Montant payé</span>
                  <span className="text-success fw-bold">{profile.abonnementActif.prixPaye} DH</span>
                </div>
                <div className="mt-2">
                  <span className="badge bg-success px-3 py-2">✅ Actif</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="fs-1 d-block mb-2">😔</span>
                <p className="text-muted mb-3">Aucun abonnement actif.</p>
                <Link to="/client/payment" className="btn btn-gold px-4 py-2 fw-bold">
                  💳 S'abonner maintenant
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raccourcis */}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <Link to="/client/booking" className="card-premium p-3 text-center d-block text-decoration-none" style={{ transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '28px' }}>🗓️</div>
            <small className="text-muted">Réserver un Cours</small>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/client/invoices" className="card-premium p-3 text-center d-block text-decoration-none" style={{ transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '28px' }}>📄</div>
            <small className="text-muted">Mes Factures</small>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/client/payment" className="card-premium p-3 text-center d-block text-decoration-none" style={{ transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '28px' }}>💳</div>
            <small className="text-muted">Paiement</small>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <div className="card-premium p-3 text-center" style={{ opacity: 0.5 }}>
            <div style={{ fontSize: '28px' }}>💬</div>
            <small className="text-muted">Chat Coach</small>
            <div><span className="badge bg-dark border border-secondary" style={{ fontSize: '9px' }}>Bientôt</span></div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/client/chat" className="card-premium p-3 text-center d-block text-decoration-none border-warning" style={{ transition: 'transform 0.2s', backgroundColor: 'rgba(230, 184, 0, 0.1)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '28px' }}>💬</div>
            <small className="text-gold fw-bold">Chat Coach</small>
          </Link>
        </div>
      </div>
    </ErpLayout>
  );
}
