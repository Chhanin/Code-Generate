const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateCode = async (text, language) => {
  // Check if Gemini API key is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("Attempting to generate code with Gemini 1.5 Flash...");

      const prompt = `Generate ${language} code for the following request: "${text}". 
      
      Requirements:
      - Write clean, well-commented code
      - Include proper error handling where appropriate
      - Follow best practices for ${language}
      - Make the code functional and ready to use
      - Only return the code, no explanations or markdown formatting`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedCode = response.text();

      return generatedCode.trim();
    } catch (error) {
      console.error("Gemini API error:", error);
      // Fallback to template-based generation
      return generateTemplateCode(text, language);
    }
  } else {
    // Fallback to template-based generation if no API key
    return generateTemplateCode(text, language);
  }
};

const generateTemplateCode = (text, language) => {
  const templates = {
    javascript: generateJavaScriptCode,
    python: generatePythonCode,
    java: generateJavaCode,
    cpp: generateCppCode,
    html: generateHtmlCode,
    css: generateCssCode,
    react: generateReactCode,
  };

  const generator = templates[language.toLowerCase()];
  if (!generator) {
    throw new Error(`Unsupported language: ${language}`);
  }

  return generator(text);
};

const generateJavaScriptCode = (text) => {
  return `// Generated JavaScript code for: "${text}"
function ${camelCase(text)}() {
    // TODO: Implement the functionality
    console.log("${text}");
    return "${text}";
}

// Example usage
const result = ${camelCase(text)}();
console.log(result);`;
};

const generatePythonCode = (text) => {
  return `# Generated Python code for: "${text}"
def ${snakeCase(text)}():
    """Function to handle: ${text}"""
    print("${text}")
    return "${text}"

# Example usage
if __name__ == "__main__":
    result = ${snakeCase(text)}()
    print(result)`;
};

const generateJavaCode = (text) => {
  const className = pascalCase(text);
  return `// Generated Java code for: "${text}"
public class ${className} {
    public static void main(String[] args) {
        System.out.println("${text}");
    }
    
    public static String ${camelCase(text)}() {
        return "${text}";
    }
}`;
};

const generateCppCode = (text) => {
  return `// Generated C++ code for: "${text}"
#include <iostream>
#include <string>

std::string ${camelCase(text)}() {
    return "${text}";
}

int main() {
    std::cout << ${camelCase(text)}() << std::endl;
    return 0;
}`;
};

const generateHtmlCode = (text) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${text}</title>
</head>
<body>
    <h1>${text}</h1>
    <p>This is a generated HTML page for: ${text}</p>
</body>
</html>`;
};

const generateCssCode = (text) => {
  return `/* Generated CSS for: ${text} */
.${kebabCase(text)} {
    /* Add your styles here */
    color: #333;
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}

.${kebabCase(text)}-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}`;
};

const generateReactCode = (text) => {
  const componentName = pascalCase(text);
  return `import React from 'react';

// Generated React component for: "${text}"
const ${componentName} = () => {
    return (
        <div className="${kebabCase(text)}">
            <h1>${text}</h1>
            <p>This is a generated React component for: ${text}</p>
        </div>
    );
};

export default ${componentName};`;
};

// Helper functions
const camelCase = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
};

const snakeCase = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const pascalCase = (str) => {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

const kebabCase = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

module.exports = {
  generateCode,
};
