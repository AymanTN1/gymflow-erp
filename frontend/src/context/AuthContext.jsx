import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté au chargement
    const storedUser = localStorage.getItem('gymflow_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        const userData = {
          token: data.token,
          id: data.id,
          nom: data.nom,
          email: data.email,
          role: data.role
        };
        localStorage.setItem('gymflow_user', JSON.stringify(userData));
        setUser(userData);
        navigate(data.redirect || '/');
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Identifiants invalides' };
      }
    } catch (error) {
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  };

  const logout = () => {
    localStorage.removeItem('gymflow_user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
