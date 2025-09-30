import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api";
import { Code } from "lucide-react";
import { Outlet, Link, useLocation } from 'react-router-dom';

function CodeGeneratorPage() {
  const { auth, logout } = useContext(AuthContext);
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedCodes, setSavedCodes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "react", label: "React" },
  ];

  // Load saved codes only when authentication is confirmed
  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated) {
      loadSavedCodes();
    }
  }, [auth.loading, auth.isAuthenticated]);

  const loadSavedCodes = async () => {
    try {
      const response = await api.get("/saved-codes");
      setSavedCodes(response.data);
    } catch (error) {
      console.error("Error loading saved codes:", error);
    }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/generate-code", {
        text: prompt,
        language: language,
      });

      setGeneratedCode(response.data.code);
      setSuccess("Code generated successfully!");

      // Reload saved codes to show the new one
      loadSavedCodes();
    } catch (error) {
      setError("Failed to generate code. Please try again.");
      console.error("Error generating code:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteCode = async (promptId) => {
    try {
      await api.delete(`/saved-codes/${promptId}`);
      setSuccess("Code deleted successfully!");
      loadSavedCodes();
    } catch (error) {
      setError("Failed to delete code");
      console.error("Error deleting code:", error);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setSuccess("Code copied to clipboard!");
  };

  const handleDownloadCode = (code, language) => {
    const extension = getFileExtension(language);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      html: "html",
      css: "css",
      react: "jsx",
    };
    return extensions[lang] || "txt";
  };

  const getLanguageForHighlighter = (lang) => {
    const mapping = {
      cpp: "cpp",
      javascript: "javascript",
      python: "python",
      java: "java",
      html: "html",
      css: "css",
      react: "jsx",
    };
    return mapping[lang] || "text";
  };

  const location = useLocation();

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1>
            <Code
              size={48}
              style={{ marginRight: "15px", verticalAlign: "middle" }}
            />
            Code Generator
          </h1>
          <button onClick={logout} className="btn btn-small btn-danger">Logout</button>
        </div>
        <p>Transform your ideas into code with AI-powered generation</p>
      </header>

      <nav className="main-nav">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Generate
        </Link>
        <Link to="/saved" className={`nav-link ${location.pathname === '/saved' ? 'active' : ''}`}>
          Saved Codes
        </Link>
      </nav>

      <div className="main-content">
        <Outlet context={{
          prompt, setPrompt,
          language, setLanguage,
          languages,
          handleGenerateCode,
          isLoading,
          error, success,
          generatedCode,
          handleCopyCode,
          handleDownloadCode,
          getLanguageForHighlighter,
          savedCodes,
          handleDeleteCode
        }} />
      </div>
    </div>
  );
}

export default CodeGeneratorPage;
