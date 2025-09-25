import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CodeGeneratorPage from './pages/CodeGeneratorPage';

function App() {
  // For now, we'll use a simple isAuthenticated flag.
  // Later, this will be replaced with a proper auth context.
  const isAuthenticated = false;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/"
          element={isAuthenticated ? <CodeGeneratorPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;

