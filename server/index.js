require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database");
const codeGenerator = require("./codeGenerator");
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Root route - helpful message when visiting backend URL directly
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Code Generator backend is running',
    usefulRoutes: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login'
    ]
  });
});

// Generate code from prompt
app.post("/api/generate-code", authMiddleware, async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text || !language) {
      return res.status(400).json({ error: "Text and language are required" });
    }

    // Save prompt to database, associated with the user
    const promptId = await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO prompts (user_id, text, language) VALUES (?, ?, ?)",
        [req.user.id, text, language],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Generate code using AI
    const generatedCode = await codeGenerator.generateCode(text, language);

    // Save generated code to database
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO generated_code (prompt_id, code) VALUES (?, ?)",
        [promptId, generatedCode],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      success: true,
      promptId,
      code: generatedCode,
      language,
    });
  } catch (error) {
    console.error("Error generating code:", error);
    res.status(500).json({ error: "Failed to generate code" });
  }
});

// Get all saved prompts and codes
app.get("/api/saved-codes", authMiddleware, (req, res) => {
  const query = `
    SELECT 
      p.id as prompt_id,
      p.text as prompt_text,
      p.language,
      p.created_at as prompt_created_at,
      gc.code,
      gc.created_at as code_created_at
    FROM prompts p
    LEFT JOIN generated_code gc ON p.id = gc.prompt_id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `;

  db.all(query, [req.user.id], (err, rows) => {
    if (err) {
      console.error("Error fetching saved codes:", err);
      return res.status(500).json({ error: "Failed to fetch saved codes" });
    }
    res.json(rows);
  });
});

// Delete a saved prompt and its code
app.delete("/api/saved-codes/:id", authMiddleware, (req, res) => {
  const { id } = req.params;

  // First, verify that the prompt belongs to the user
  db.get("SELECT * FROM prompts WHERE id = ? AND user_id = ?", [id, req.user.id], (err, row) => {
    if (err) {
      console.error("Error verifying prompt ownership:", err);
      return res.status(500).json({ error: "Failed to verify ownership" });
    }
    if (!row) {
      return res.status(403).json({ error: "You do not have permission to delete this code" });
    }

    // If ownership is verified, proceed with deletion
    db.run("DELETE FROM generated_code WHERE prompt_id = ?", [id], (err) => {
      if (err) {
        console.error("Error deleting generated code:", err);
        return res.status(500).json({ error: "Failed to delete code" });
      }

      db.run("DELETE FROM prompts WHERE id = ?", [id], (err) => {
        if (err) {
          console.error("Error deleting prompt:", err);
          return res.status(500).json({ error: "Failed to delete prompt" });
        }
        res.json({ success: true });
      });
    });
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Code Generator API is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
