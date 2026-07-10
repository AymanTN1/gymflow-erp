import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';
import { useAuth } from '../../context/AuthContext';

export default function ClientChat() {
  const { user } = useAuth(); // Le client connecté
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch all coaches to allow client to select one
    const fetchCoaches = async () => {
      try {
        const res = await apiFetch('http://localhost:8080/api/users');
        if (res.ok) {
          const allUsers = await res.json();
          const coachList = allUsers.filter(u => u.role === 'COACH');
          setCoaches(coachList);
          if (coachList.length > 0) {
            setSelectedCoach(coachList[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (user?.clientId && selectedCoach) {
      fetchMessages();
      // Polling simple pour les nouveaux messages toutes les 5 secondes
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user, selectedCoach]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedCoach) return;
    try {
      const res = await apiFetch(`http://localhost:8080/api/messages/conversation?type1=CLIENT&id1=${user.clientId}&type2=STAFF&id2=${selectedCoach.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCoach) return;

    try {
      const msg = {
        senderType: 'CLIENT',
        senderId: user.clientId,
        receiverType: 'STAFF',
        receiverId: selectedCoach.id,
        content: newMessage
      };

      const res = await apiFetch('http://localhost:8080/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages([...messages, savedMsg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <ErpLayout role="CLIENT">
      <div className="d-flex flex-column h-100" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        <h2 className="fw-bold mb-4">💬 Messagerie Coach</h2>
        
        <div className="row flex-grow-1 overflow-hidden g-3">
          {/* Liste des coachs */}
          <div className="col-md-4 h-100 d-flex flex-column">
            <div className="card-premium p-3 h-100 overflow-auto">
              <h5 className="text-gold mb-3">Mes Coachs</h5>
              {coaches.map(c => (
                <div 
                  key={c.id} 
                  className={`p-3 rounded mb-2 cursor-pointer ${selectedCoach?.id === c.id ? 'bg-gold text-dark' : 'bg-dark text-white border border-secondary'}`}
                  style={{ cursor: 'pointer', transition: '0.2s' }}
                  onClick={() => setSelectedCoach(c)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div className={`rounded-circle d-flex justify-content-center align-items-center ${selectedCoach?.id === c.id ? 'bg-dark text-gold' : 'bg-secondary text-white'}`} style={{ width: '40px', height: '40px' }}>
                      {c.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">{c.nom}</h6>
                      <small className={selectedCoach?.id === c.id ? 'text-dark opacity-75' : 'text-muted'}>Coach Sportif</small>
                    </div>
                  </div>
                </div>
              ))}
              {coaches.length === 0 && <p className="text-muted">Aucun coach disponible.</p>}
            </div>
          </div>

          {/* Zone de chat */}
          <div className="col-md-8 h-100 d-flex flex-column">
            <div className="card-premium p-0 h-100 d-flex flex-column overflow-hidden">
              {/* En-tête chat */}
              {selectedCoach && (
                <div className="p-3 border-bottom border-warning border-opacity-25 bg-theme-header d-flex align-items-center gap-3">
                  <div className="bg-gold rounded-circle d-flex justify-content-center align-items-center text-dark fw-bold" style={{ width: '40px', height: '40px' }}>
                    {selectedCoach.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">{selectedCoach.nom}</h5>
                    <small className="text-success">En ligne</small>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {!selectedCoach ? (
                  <div className="h-100 d-flex justify-content-center align-items-center text-muted">
                    Sélectionnez un coach pour commencer à discuter.
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted">
                    <span className="fs-1 mb-2">👋</span>
                    <p>Envoyez un message pour démarrer la conversation.</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMe = m.senderType === 'CLIENT' && m.senderId === user.clientId;
                    return (
                      <div key={m.id} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div 
                          className={`p-3 rounded-4`}
                          style={{ 
                            maxWidth: '75%', 
                            backgroundColor: isMe ? 'var(--accent-gold)' : 'var(--bg-dark)',
                            color: isMe ? '#000' : 'var(--text-light)',
                            border: isMe ? 'none' : '1px solid var(--grid-line)'
                          }}
                        >
                          <p className="mb-1">{m.content}</p>
                          <small className={isMe ? 'text-dark opacity-75' : 'text-muted'} style={{ fontSize: '10px' }}>
                            {new Date(m.dateEnvoi).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedCoach && (
                <div className="p-3 border-top border-warning border-opacity-25">
                  <form onSubmit={sendMessage} className="d-flex gap-2">
                    <input 
                      type="text" 
                      className="form-control form-control-dark" 
                      placeholder="Écrivez votre message..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="btn btn-gold px-4 fw-bold">
                      Envoyer
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
