# Code Generator

A web application that generates code from text prompts with support for multiple programming languages and database storage.

## Features

- 🚀 **Text-to-Code Generation**: Convert natural language descriptions into code
- 🌐 **Multiple Languages**: Support for JavaScript, Python, Java, C++, HTML, CSS, and React
- 💾 **Database Storage**: Save prompts and generated code to SQLite database
- 📋 **Copy & Download**: Easy code copying and file downloading
- 🎨 **Modern UI**: Beautiful, responsive interface with syntax highlighting
- 🔄 **CRUD Operations**: Create, read, and delete saved codes

## Tech Stack

### Frontend

- React 18
- Axios for API calls
- React Syntax Highlighter for code display
- Lucide React for icons
- CSS3 with modern styling

### Backend

- Node.js with Express
- SQLite3 for database
- CORS enabled for cross-origin requests
- RESTful API design

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd CodeGenerator
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Start the development servers**

   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## Usage

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Generate Code**:

   - Enter a description of what you want to build
   - Select a programming language
   - Click "Generate Code"

3. **Save Code**:

   - After generating code, click "Save Code" to store it in the database

4. **Manage Saved Codes**:
   - View all saved codes in the right panel
   - Copy, download, or delete saved codes
   - Each saved code includes the original prompt and generated code

## API Endpoints

### POST /api/generate-code

Generate code from a text prompt.

**Request Body:**

```json
{
  "text": "Create a function that calculates factorial",
  "language": "javascript"
}
```

**Response:**

```json
{
  "success": true,
  "promptId": 1,
  "code": "// Generated JavaScript code...",
  "language": "javascript"
}
```

### GET /api/saved-codes

Retrieve all saved prompts and generated codes.

**Response:**

```json
[
  {
    "prompt_id": 1,
    "prompt_text": "Create a function that calculates factorial",
    "language": "javascript",
    "prompt_created_at": "2024-01-01T12:00:00.000Z",
    "code": "// Generated JavaScript code...",
    "code_created_at": "2024-01-01T12:00:00.000Z"
  }
]
```

### DELETE /api/saved-codes/:id

Delete a saved prompt and its generated code.

## Database Schema

### prompts table

- `id` (INTEGER PRIMARY KEY)
- `text` (TEXT) - The original prompt
- `language` (VARCHAR) - Selected programming language
- `created_at` (DATETIME) - Timestamp

### generated_code table

- `id` (INTEGER PRIMARY KEY)
- `prompt_id` (INTEGER) - Foreign key to prompts table
- `code` (TEXT) - Generated code
- `created_at` (DATETIME) - Timestamp

## Customization

### Adding New Languages

1. **Update the code generator** (`server/codeGenerator.js`):

   ```javascript
   const templates = {
     // ... existing languages
     "your-language": generateYourLanguageCode,
   };
   ```

2. **Add the generator function**:

   ```javascript
   const generateYourLanguageCode = (text) => {
     return `// Your language code template for: "${text}"`;
   };
   ```

3. **Update the frontend** (`client/src/App.js`):
   ```javascript
   const languages = [
     // ... existing languages
     { value: "your-language", label: "Your Language" },
   ];
   ```

### Integrating with AI Services

Replace the template-based code generation in `server/codeGenerator.js` with actual AI service calls:

```javascript
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateCode = async (text, language) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a code generator. Generate ${language} code based on the user's description.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
};
```

## Development

### Project Structure

```
CodeGenerator/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Express server
│   ├── database.js        # Database setup
│   ├── codeGenerator.js   # Code generation logic
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm run install-all` - Install dependencies for all packages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
