#!/bin/bash

echo "🔑 Setting up Google Gemini API Key..."

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp server/env-template server/.env
    echo "✅ Created server/.env file"
else
    echo "📝 .env file already exists"
fi

echo ""
echo "🔧 Next steps:"
echo "1. Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Edit server/.env file and replace 'your_gemini_api_key_here' with your actual API key"
echo "3. Restart the server: npm run dev"
echo ""
echo "Example .env content:"
echo "GEMINI_API_KEY=AIzaSyC..."
echo "PORT=5002"
echo "NODE_ENV=development"
echo ""
echo "🎉 Setup complete! The app will use Gemini AI for code generation once you add your API key."
