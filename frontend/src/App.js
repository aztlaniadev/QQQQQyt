import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Import components
import Homepage from './components/Homepage';
import Login from './components/Login';
import Register from './components/Register';
import CompanyRegister from './components/CompanyRegister';
import QuestionsList from './components/QuestionsList';
import QuestionDetail from './components/QuestionDetail';
import ArticlesList from './components/ArticlesList';
import Connect from './components/Connect';
import Store from './components/Store';
import Jobs from './components/Jobs';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import ProfileSettings from './components/ProfileSettings';

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/registro-empresa" element={<CompanyRegister />} />
            <Route path="/perguntas" element={<QuestionsList />} />
            <Route path="/perguntas/:id" element={<QuestionDetail />} />
            <Route path="/artigos" element={<ArticlesList />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/loja" element={<Store />} />
            <Route path="/vagas" element={<Jobs />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/perfil" element={<ProfileSettings />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;