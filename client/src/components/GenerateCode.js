import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Save } from 'lucide-react';

const GenerateCode = () => {
  const { 
    prompt, setPrompt, 
    language, setLanguage, 
    languages, 
    handleGenerateCode, 
    isLoading, 
    error, success, 
    generatedCode, 
    handleCopyCode, 
    handleDownloadCode, 
    handleSaveCode, 
    getLanguageForHighlighter 
  } = useOutletContext();
  return (
    <div className="card">
      <div className="card-header">
        <h2>Generate Code</h2>
      </div>
      <div className="card-content">
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
    </div>
  );
};

export default GenerateCode;
