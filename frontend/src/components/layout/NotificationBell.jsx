import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell({ role }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Dans notre système, les admins reçoivent souvent les notifs RECEPTION
  // On ajuste le role demandé selon les besoins
  const listeningRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : role;

  useEffect(() => {
    // 1. Charger l'historique non lu
    apiFetch(`http://localhost:8080/api/notifications/unread?role=${listeningRole}`)
      .then(res => res.json())
      .then(data => {
        setNotifications(data);
        setUnreadCount(data.length);
      })
      .catch(err => console.error("Erreur chargement notifs", err));

    // 2. Connexion SSE pour le temps réel
    const eventSource = new EventSource(`http://localhost:8080/api/notifications/stream?role=${listeningRole}`);
    
    eventSource.addEventListener('notification', (event) => {
      const newNotif = JSON.parse(event.data);
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Optionnel: Jouer un petit son (si autorisé par le navigateur)
      // new Audio('/notification.mp3').play().catch(e => {});
    });

    return () => {
      eventSource.close();
    };
  }, [listeningRole]);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const markAsRead = async (id) => {
    try {
      await apiFetch(`http://localhost:8080/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await apiFetch(`http://localhost:8080/api/notifications/read-all?role=${listeningRole}`, { method: 'POST' });
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'WARNING': return '⚠️';
      case 'SUCCESS': return '✅';
      case 'DANGER': return '❌';
      default: return 'ℹ️';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} à ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button 
        className="btn btn-dark border border-warning border-opacity-25 rounded-circle d-flex justify-content-center align-items-center position-relative"
        style={{ width: '40px', height: '40px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="position-absolute top-100 end-0 mt-2 card-premium p-0 shadow-lg" style={{ width: '320px', zIndex: 1050, border: '1px solid rgba(255,204,0,0.3)' }}>
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
            <h6 className="fw-bold mb-0">Notifications</h6>
            {unreadCount > 0 && (
              <button className="btn btn-sm btn-link text-muted p-0 text-decoration-none" style={{ fontSize: '12px' }} onClick={markAllAsRead}>
                Tout marquer lu
              </button>
            )}
          </div>
          
          <div className="overflow-auto" style={{ maxHeight: '350px' }}>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted">
                <span className="fs-1 d-block mb-2">📭</span>
                <small>Aucune nouvelle notification</small>
              </div>
            ) : (
              <div className="list-group list-group-flush bg-transparent">
                {notifications.map(notif => (
                  <button 
                    key={notif.id} 
                    className="list-group-item list-group-item-action bg-transparent border-bottom border-secondary p-3 text-start hover-bg-dark"
                    onClick={() => markAsRead(notif.id)}
                    style={{ transition: 'background-color 0.2s' }}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-start gap-2">
                      <span className="fs-5 flex-shrink-0">{getIconForType(notif.type)}</span>
                      <div className="flex-grow-1">
                        <p className="mb-1 text-white small" style={{ lineHeight: '1.4' }}>{notif.message}</p>
                        <small className="text-muted" style={{ fontSize: '10px' }}>{formatDate(notif.createdAt)}</small>
                      </div>
                      <div className="bg-gold rounded-circle flex-shrink-0 mt-1" style={{ width: '8px', height: '8px' }}></div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-top border-secondary text-center">
            <small className="text-muted" style={{ fontSize: '11px' }}>Les notifications sont effacées une fois lues.</small>
          </div>
        </div>
      )}
      
      <style>{`
        .hover-bg-dark:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
    </div>
  );
}
