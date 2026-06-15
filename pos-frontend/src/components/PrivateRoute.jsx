import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

const defaultFor = (role) => role === 'cashier' ? '/pos' : '/'

export default function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to={defaultFor(user.role)} replace />
  return children
}
