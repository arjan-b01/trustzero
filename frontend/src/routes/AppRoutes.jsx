import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Pages imports
import Landing from '../pages/Landing';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import Wallet from '../pages/wallet/Wallet';
import EscrowList from '../pages/escrow/EscrowList';
import CreateEscrow from '../pages/escrow/CreateEscrow';
import EscrowDetails from '../pages/escrow/EscrowDetails';
import DisputeList from '../pages/dispute/DisputeList';
import DisputeDetails from '../pages/dispute/DisputeDetails';
import AuditLogs from '../pages/audit/AuditLogs';
import Profile from '../pages/profile/Profile';
import NotFound from '../pages/NotFound';

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected Dashboard Layout Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Wallet />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrows"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EscrowList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrows/create"
        element={
          <ProtectedRoute allowedRoles={['BUYER']}>
            <DashboardLayout>
              <CreateEscrow />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrows/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EscrowDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/disputes"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DisputeList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/disputes/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DisputeDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AuditLogs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
