import React, { useState, useEffect } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Code, Save, Trash2, Copy, Download } from "lucide-react";

function App() {
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

  // Load saved codes on component mount
  useEffect(() => {
    loadSavedCodes();
  }, []);

  const loadSavedCodes = async () => {
    try {
      const response = await axios.get("/api/saved-codes");
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
      const response = await axios.post("/api/generate-code", {
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

  const handleSaveCode = async () => {
    if (!generatedCode) {
      setError("No code to save");
      return;
    }

    try {
      await axios.post("/api/generate-code", {
        text: prompt,
        language: language,
      });

      setSuccess("Code saved successfully!");
      loadSavedCodes();
    } catch (error) {
      setError("Failed to save code");
      console.error("Error saving code:", error);
    }
  };

  const handleDeleteCode = async (promptId) => {
    try {
      await axios.delete(`/api/saved-codes/${promptId}`);
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

  return (
    <div className="container">
      <header className="header">
        <h1>
          <Code
            size={48}
            style={{ marginRight: "15px", verticalAlign: "middle" }}
          />
          Code Generator
        </h1>
        <p>Transform your ideas into code with AI-powered generation</p>
      </header>

      <div className="main-content">
        <div className="card">
          <h2>Generate Code</h2>
          <form onSubmit={handleGenerateCode}>
            <div className="form-group">
              <label htmlFor="prompt">Describe what you want to build:</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a function that calculates the factorial of a number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="language">Select Programming Language:</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Code"}
            </button>
          </form>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          {generatedCode && (
            <div className="code-output">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <h3>Generated Code:</h3>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => handleCopyCode(generatedCode)}
                    className="btn btn-small"
                    style={{ flex: "1", minWidth: "120px" }}
                  >
                    <Copy size={16} style={{ marginRight: "5px" }} />
                    Copy
                  </button>
                  <button
                    onClick={() => handleDownloadCode(generatedCode, language)}
                    className="btn btn-small"
                    style={{ flex: "1", minWidth: "120px" }}
                  >
                    <Download size={16} style={{ marginRight: "5px" }} />
                    Download
                  </button>
                </div>
              </div>
              <SyntaxHighlighter
                language={getLanguageForHighlighter(language)}
                style={tomorrow}
                showLineNumbers
              >
                {generatedCode}
              </SyntaxHighlighter>
              <button
                onClick={handleSaveCode}
                className="btn"
                style={{ marginTop: "15px" }}
              >
                <Save size={16} style={{ marginRight: "5px" }} />
                Save Code
              </button>
            </div>
          )}
        </div>

        <div className="saved-codes">
          <h2>Saved Codes</h2>
          {savedCodes.length === 0 ? (
            <p>No saved codes yet. Generate some code to see them here!</p>
          ) : (
            savedCodes.map((item) => (
              <div key={item.prompt_id} className="saved-item">
                <h3>{item.prompt_text}</h3>
                <div className="meta">
                  Language: {item.language} | Created:{" "}
                  {new Date(item.prompt_created_at).toLocaleString()}
                </div>
                {item.code && (
                  <div className="code-preview">
                    <SyntaxHighlighter
                      language={getLanguageForHighlighter(item.language)}
                      style={tomorrow}
                      showLineNumbers
                    >
                      {item.code}
                    </SyntaxHighlighter>
                  </div>
                )}
                <div className="actions">
                  <button
                    onClick={() => handleCopyCode(item.code)}
                    className="btn btn-small"
                  >
                    <Copy size={14} style={{ marginRight: "5px" }} />
                    Copy
                  </button>
                  <button
                    onClick={() => handleDownloadCode(item.code, item.language)}
                    className="btn btn-small"
                  >
                    <Download size={14} style={{ marginRight: "5px" }} />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteCode(item.prompt_id)}
                    className="btn btn-small btn-danger"
                  >
                    <Trash2 size={14} style={{ marginRight: "5px" }} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
