import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Si l'utilisateur n'a pas le bon rôle, on le renvoie vers son espace
    switch (user.role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <Navigate to="/admin" replace />;
      case 'RECEPTION':
        return <Navigate to="/reception" replace />;
      case 'COACH':
        return <Navigate to="/coach" replace />;
      case 'CLIENT':
        return <Navigate to="/client" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}
