import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/useAuthStore'
import { getMe } from './api/auth'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Warehouse from './pages/Warehouse'
import Categories from './pages/Categories'
import Workers from './pages/Workers'
import Shifts from './pages/Shifts'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Kitchen from './pages/Kitchen'
import Assembler from './pages/Assembler'
import TableMap from './pages/TableMap'
import ModifierGroups from './pages/ModifierGroups'
import Stocktake from './pages/Stocktake'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import OnlineMenu from './pages/OnlineMenu'

function AppContent() {
  const { isAuthenticated, setUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) getMe().then((r) => setUser(r.data)).catch(() => {})
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login"  element={<Login />} />
        <Route path="/menu"   element={<OnlineMenu />} />
        <Route path="*"       element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/pos"       element={<PrivateRoute roles={['admin','manager','cashier']}><POS /></PrivateRoute>} />
        <Route path="/products"  element={<PrivateRoute roles={['admin','manager']}><Products /></PrivateRoute>} />
        <Route path="/warehouse" element={<PrivateRoute roles={['admin','manager']}><Warehouse /></PrivateRoute>} />
        <Route path="/categories" element={<PrivateRoute roles={['admin','manager']}><Categories /></PrivateRoute>} />
        <Route path="/orders"    element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/shifts"    element={<PrivateRoute roles={['admin','manager','cashier']}><Shifts /></PrivateRoute>} />
        <Route path="/workers"   element={<PrivateRoute roles={['admin']}><Workers /></PrivateRoute>} />
        <Route path="/reports"   element={<PrivateRoute roles={['admin','manager']}><Reports /></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute roles={['admin','manager','cashier']}><Customers /></PrivateRoute>} />
        <Route path="/suppliers" element={<PrivateRoute roles={['admin','manager']}><Suppliers /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/kitchen"   element={<PrivateRoute roles={['admin','manager','chef']}><Kitchen /></PrivateRoute>} />
        <Route path="/assembler" element={<PrivateRoute roles={['admin','manager','assembler']}><Assembler /></PrivateRoute>} />
        <Route path="/table-map" element={<PrivateRoute roles={['admin','manager','cashier']}><TableMap /></PrivateRoute>} />
        <Route path="/modifiers" element={<PrivateRoute roles={['admin','manager']}><ModifierGroups /></PrivateRoute>} />
        <Route path="/stocktake" element={<PrivateRoute roles={['admin','manager']}><Stocktake /></PrivateRoute>} />
        <Route path="/menu"      element={<OnlineMenu />} />
        <Route path="/login"     element={<Navigate to="/" replace />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>
}
