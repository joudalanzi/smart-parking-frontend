import { Navigate } from 'react-router-dom';

export default function AdminProtected({ children }) {
  if (!localStorage.getItem('adminToken')) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}
