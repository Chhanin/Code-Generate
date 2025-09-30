import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CodeGeneratorPage from './pages/CodeGeneratorPage';
import GenerateCode from './components/GenerateCode';
import SavedCodes from './components/SavedCodes';
import { AuthProvider, AuthContext } from './context/AuthContext';

const AppRoutes = () => {
  const { auth } = useContext(AuthContext);

  // Display a loading message while the auth state is being determined
  if (auth.loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!auth.isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!auth.isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      <Route 
        path="/"
        element={auth.isAuthenticated ? <CodeGeneratorPage /> : <Navigate to="/login" />}
      >
        <Route index element={<GenerateCode />} />
        <Route path="saved" element={<SavedCodes />} />
      </Route>
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

