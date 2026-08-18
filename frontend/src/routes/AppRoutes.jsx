import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { UploadProvider } from '../context/UploadContext';
import LoginPage from '../pages/LoginPage';
import AppShell from '../layouts/AppShell';
import DashboardPage from '../pages/DashboardPage';
import LoansListPage from '../pages/LoansListPage';
import LoanDetailPage from '../pages/LoanDetailPage';
import LendBorrowPage from '../pages/LendBorrowPage';
import LendBorrowDetailPage from '../pages/LendBorrowDetailPage';
import PersonHistoryPage from '../pages/PersonHistoryPage';
import IncomePage from '../pages/IncomePage';
import GoalsPage from '../pages/GoalsPage';
import GoalHistoryPage from '../pages/GoalHistoryPage';
import StatementsPage from '../pages/StatementsPage';
import ChatPage from '../pages/ChatPage';

// Simple React Query client configuration avoiding aggressive retries for standard usage.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, 
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UploadProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={<AppShell />}>
                <Route index element={<DashboardPage />} />
              
              <Route path="loans" element={<LoansListPage />} />
              <Route path="loans/:id" element={<LoanDetailPage />} />
              
              <Route path="lend-borrow" element={<LendBorrowPage />} />
              <Route path="lend-borrow/:id" element={<LendBorrowDetailPage />} />
              <Route path="lend-borrow/person/:email" element={<PersonHistoryPage />} />
              
              <Route path="income" element={<IncomePage />} />
              
              <Route path="goals" element={<GoalsPage />} />
              <Route path="goals/:id" element={<GoalHistoryPage />} />
              
              <Route path="statements" element={<StatementsPage />} />
              <Route path="chat" element={<ChatPage />} />
              
              {/* Other modules stubbed for the time being */}
              <Route path="settings" element={<div>Settings Placeholder</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </UploadProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
