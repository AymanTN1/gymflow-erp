import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';
import { useAuth } from '../../context/AuthContext';

export default function CoachChat() {
  const { user } = useAuth(); // Le coach connecté
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch all clients
    const fetchClients = async () => {
      try {
        const res = await apiFetch('http://localhost:8080/api/reception/clients');
        if (res.ok) {
          const allClients = await res.json();
          setClients(allClients);
          if (allClients.length > 0) {
            setSelectedClient(allClients[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (user?.id && selectedClient) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user, selectedClient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedClient) return;
    try {
      const res = await apiFetch(`http://localhost:8080/api/messages/conversation?type1=STAFF&id1=${user.id}&type2=CLIENT&id2=${selectedClient.id}`);
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
    if (!newMessage.trim() || !selectedClient) return;

    try {
      const msg = {
        senderType: 'STAFF',
        senderId: user.id,
        receiverType: 'CLIENT',
        receiverId: selectedClient.id,
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
    <ErpLayout role="COACH">
      <div className="d-flex flex-column h-100" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        <h2 className="fw-bold mb-4">💬 Messagerie Clients</h2>
        
        <div className="row flex-grow-1 overflow-hidden g-3">
          {/* Liste des clients */}
          <div className="col-md-4 h-100 d-flex flex-column">
            <div className="card-premium p-3 h-100 overflow-auto">
              <h5 className="text-gold mb-3">Mes Clients</h5>
              {clients.map(c => (
                <div 
                  key={c.id} 
                  className={`p-3 rounded mb-2 cursor-pointer ${selectedClient?.id === c.id ? 'bg-gold text-dark' : 'bg-dark text-white border border-secondary'}`}
                  style={{ cursor: 'pointer', transition: '0.2s' }}
                  onClick={() => setSelectedClient(c)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div className={`rounded-circle d-flex justify-content-center align-items-center ${selectedClient?.id === c.id ? 'bg-dark text-gold' : 'bg-secondary text-white'}`} style={{ width: '40px', height: '40px' }}>
                      {c.nomComplet.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">{c.nomComplet}</h6>
                      <small className={selectedClient?.id === c.id ? 'text-dark opacity-75' : 'text-muted'}>ID: #{c.id}</small>
                    </div>
                  </div>
                </div>
              ))}
              {clients.length === 0 && <p className="text-muted">Aucun client disponible.</p>}
            </div>
          </div>

          {/* Zone de chat */}
          <div className="col-md-8 h-100 d-flex flex-column">
            <div className="card-premium p-0 h-100 d-flex flex-column overflow-hidden">
              {/* En-tête chat */}
              {selectedClient && (
                <div className="p-3 border-bottom border-warning border-opacity-25 bg-theme-header d-flex align-items-center gap-3">
                  <div className="bg-gold rounded-circle d-flex justify-content-center align-items-center text-dark fw-bold" style={{ width: '40px', height: '40px' }}>
                    {selectedClient.nomComplet.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">{selectedClient.nomComplet}</h5>
                    <small className="text-success">Client GymFlow</small>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {!selectedClient ? (
                  <div className="h-100 d-flex justify-content-center align-items-center text-muted">
                    Sélectionnez un client pour discuter.
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted">
                    <span className="fs-1 mb-2">👋</span>
                    <p>Aucun message avec {selectedClient.nomComplet}.</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMe = m.senderType === 'STAFF' && m.senderId === user.id;
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
              {selectedClient && (
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
