import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Trash2 } from 'lucide-react';

const SavedCodes = () => {
  const { 
    savedCodes, 
    handleCopyCode, 
    handleDownloadCode, 
    handleDeleteCode, 
    getLanguageForHighlighter 
  } = useOutletContext();
  return (
    <div className="saved-codes">
      <h2>Saved Codes</h2>
      <div className="saved-codes-content">
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
  );
};

export default SavedCodes;
