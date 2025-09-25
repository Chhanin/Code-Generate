import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CodeGeneratorPage from './pages/CodeGeneratorPage';
import { AuthProvider, AuthContext } from './context/AuthContext';

const AppRoutes = () => {
  const { auth } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={!auth.isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!auth.isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      <Route 
        path="/"
        element={auth.isAuthenticated ? <CodeGeneratorPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

