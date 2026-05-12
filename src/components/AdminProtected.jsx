import { Navigate } from 'react-router-dom';

export default function AdminProtected({ children }) {
  if (!localStorage.getItem('adminToken')) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
