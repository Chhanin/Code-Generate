const OpenAI = require('openai');

// OpenAI API configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateCode = async (text, language) => {
  // Check if OpenAI API key is available
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      console.log("🤖 OpenAI API Key present, attempting AI generation...");
      
      const prompt = createEnhancedPrompt(text, language);
      console.log("Enhanced prompt created for:", text);

      // Try different OpenAI models in order of preference
      const modelsToTry = [
        'gpt-4o-mini',
        'gpt-3.5-turbo',
        'gpt-4'
      ];

      for (const modelName of modelsToTry) {
        try {
          console.log(`🔄 Trying OpenAI model: ${modelName}`);
          
          const completion = await openai.chat.completions.create({
            model: modelName,
            messages: [
              {
                role: "system",
                content: `You are an expert ${language} developer. Generate high-quality, production-ready code. Return ONLY the code without any markdown formatting, explanations, or additional text.`
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7,
            top_p: 0.9
          });

          if (completion.choices && completion.choices[0] && completion.choices[0].message) {
            let generatedCode = completion.choices[0].message.content;
            
            // Clean up the response
            generatedCode = cleanGeneratedCode(generatedCode, language);
            
            console.log(`✅ Successfully generated code with OpenAI ${modelName}`);
            return generatedCode.trim();
          }
        } catch (modelError) {
          console.log(`❌ Model ${modelName} failed:`, modelError.message);
          
          // If rate limited, wait and retry once
          if (modelError.status === 429) {
            console.log("⏳ Rate limited, waiting 5 seconds...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            try {
              const retryCompletion = await openai.chat.completions.create({
                model: modelName,
                messages: [
                  {
                    role: "system",
                    content: `You are an expert ${language} developer. Generate high-quality, production-ready code. Return ONLY the code without any markdown formatting, explanations, or additional text.`
                  },
                  {
                    role: "user",
                    content: prompt
                  }
                ],
                max_tokens: 2000,
                temperature: 0.7,
                top_p: 0.9
              });

              if (retryCompletion.choices && retryCompletion.choices[0] && retryCompletion.choices[0].message) {
                let generatedCode = retryCompletion.choices[0].message.content;
                generatedCode = cleanGeneratedCode(generatedCode, language);
                console.log(`✅ Successfully generated code with OpenAI ${modelName} (retry)`);
                return generatedCode.trim();
              }
            } catch (retryError) {
              console.log(`❌ Retry failed for ${modelName}`);
            }
          }
          continue;
        }
      }
      
      throw new Error("All OpenAI models failed");
    } catch (error) {
      console.error("🚨 OpenAI API error:", error.message);
      console.log("📋 Falling back to enhanced template-based generation");
      return generateEnhancedTemplateCode(text, language);
    }
  } else {
    console.log("No OpenAI API key configured, using enhanced template-based generation");
    return generateEnhancedTemplateCode(text, language);
  }
};

// Enhanced prompt creation for better AI results
const createEnhancedPrompt = (text, language) => {
  const languageSpecificGuidelines = {
    javascript: "Use modern ES6+ syntax, include proper error handling, and follow JavaScript best practices. Include JSDoc comments where appropriate.",
    python: "Follow PEP 8 style guidelines, use type hints where appropriate, include docstrings, and implement proper error handling.",
    java: "Follow Java naming conventions, include proper exception handling, use appropriate design patterns, and add comprehensive JavaDoc comments.",
    cpp: "Use modern C++17/20 features, include proper memory management, use STL containers and algorithms, and add comprehensive comments.",
    html: "Create complete HTML5 document with DOCTYPE, head, body, proper form elements (input, label, button), inline CSS styling, and JavaScript functionality. Include all necessary HTML tags and attributes for a fully functional page.",
    css: "Use modern CSS3 features, follow BEM methodology or similar, include responsive design principles, and add helpful comments.",
    react: "Create functional components using React hooks, follow React best practices, include proper prop validation, and use modern JSX syntax."
  };

  const guidelines = languageSpecificGuidelines[language.toLowerCase()] || "Follow best practices for the specified language.";
  
  // Special handling for HTML login/form requests
  let specialInstructions = "";
  if (language.toLowerCase() === 'html' && (text.toLowerCase().includes('login') || text.toLowerCase().includes('form'))) {
    specialInstructions = `

SPECIAL REQUIREMENTS FOR LOGIN PAGE:
- Include complete HTML document structure (<!DOCTYPE html>, <html>, <head>, <body>)
- Add proper form elements: <form>, <input type="email">, <input type="password">, <button>
- Include <label> elements for accessibility
- Add inline CSS for styling and layout
- Include JavaScript for form validation and submission
- Make it visually appealing with modern design
- Ensure all form elements are properly connected with labels
- Add responsive design for mobile devices`;
  }

  return `You are an expert ${language} developer. Generate high-quality, production-ready ${language} code for the following request:

"${text}"

Requirements:
- ${guidelines}
- Write clean, readable, and well-structured code
- Include comprehensive comments explaining the logic
- Implement proper error handling and input validation
- Make the code functional and ready to use immediately
- Include example usage or test cases where appropriate
- Follow industry best practices and coding standards
- Optimize for performance and maintainability${specialInstructions}

IMPORTANT: Return ONLY the complete, functional code without any markdown formatting, explanations, or additional text. The response should be pure ${language} code that can be directly executed or used.`;
};

// Clean up generated code by removing markdown formatting
const cleanGeneratedCode = (code, language) => {
  // Remove markdown code blocks
  code = code.replace(/```[\w]*\n?/g, '');
  code = code.replace(/```/g, '');
  
  // Remove any leading/trailing explanatory text
  const lines = code.split('\n');
  let startIndex = 0;
  let endIndex = lines.length - 1;
  
  // Find the actual code start (skip explanatory text)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (isCodeLine(line, language)) {
      startIndex = i;
      break;
    }
  }
  
  // Find the actual code end
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (isCodeLine(line, language) && line !== '') {
      endIndex = i;
      break;
    }
  }
  
  return lines.slice(startIndex, endIndex + 1).join('\n');
};

// Helper function to identify if a line contains actual code
const isCodeLine = (line, language) => {
  if (!line || line.trim() === '') return false;
  
  const codePatterns = {
    javascript: /^(function|const|let|var|class|import|export|if|for|while|return|\{|\}|;)/,
    python: /^(def|class|import|from|if|for|while|return|#|'''|"""|\s{4})/,
    java: /^(public|private|protected|class|import|package|if|for|while|return|\{|\}|;)/,
    cpp: /^(#include|using|class|struct|int|void|if|for|while|return|\{|\}|;)/,
    html: /^(<|<!DOCTYPE)/,
    css: /^([.#]?[\w-]+\s*\{|\s*[\w-]+:|\})/,
    react: /^(import|export|const|function|class|return|<|\{|\})/
  };
  
  const pattern = codePatterns[language.toLowerCase()];
  return pattern ? pattern.test(line) : true;
};

const generateEnhancedTemplateCode = (text, language) => {
  const templates = {
    javascript: generateEnhancedJavaScriptCode,
    python: generateEnhancedPythonCode,
    java: generateEnhancedJavaCode,
    cpp: generateEnhancedCppCode,
    html: generateEnhancedHtmlCode,
    css: generateEnhancedCssCode,
    react: generateEnhancedReactCode,
  };

  const generator = templates[language.toLowerCase()];
  if (!generator) {
    throw new Error(`Unsupported language: ${language}`);
  }

  return generator(text);
};

const generateTemplateCode = (text, language) => {
  // Keep the old function for backward compatibility
  return generateEnhancedTemplateCode(text, language);
};

const generateEnhancedJavaScriptCode = (text) => {
  const functionName = camelCase(text);
  
  // Detect common patterns and generate appropriate code
  if (text.toLowerCase().includes('factorial')) {
    return `/**
 * Calculates the factorial of a given number
 * @param {number} n - The number to calculate factorial for
 * @returns {number} The factorial of n
 * @throws {Error} If n is negative or not an integer
 */
function calculateFactorial(n) {
    if (typeof n !== 'number' || !Number.isInteger(n)) {
        throw new Error('Input must be an integer');
    }
    if (n < 0) {
        throw new Error('Factorial is not defined for negative numbers');
    }
    if (n === 0 || n === 1) {
        return 1;
    }
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Example usage
try {
    console.log('Factorial of 5:', calculateFactorial(5)); // 120
    console.log('Factorial of 0:', calculateFactorial(0)); // 1
} catch (error) {
    console.error('Error:', error.message);
}`;
  }
  
  if (text.toLowerCase().includes('fibonacci')) {
    return `/**
 * Generates the Fibonacci sequence up to n terms
 * @param {number} n - Number of terms to generate
 * @returns {number[]} Array containing the Fibonacci sequence
 */
function generateFibonacci(n) {
    if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
        throw new Error('Input must be a positive integer');
    }
    
    if (n === 1) return [0];
    if (n === 2) return [0, 1];
    
    const sequence = [0, 1];
    for (let i = 2; i < n; i++) {
        sequence[i] = sequence[i - 1] + sequence[i - 2];
    }
    
    return sequence;
}

/**
 * Gets the nth Fibonacci number (optimized with memoization)
 * @param {number} n - The position in the sequence
 * @returns {number} The nth Fibonacci number
 */
const fibonacciMemo = (() => {
    const cache = new Map();
    
    function fib(n) {
        if (n <= 1) return n;
        if (cache.has(n)) return cache.get(n);
        
        const result = fib(n - 1) + fib(n - 2);
        cache.set(n, result);
        return result;
    }
    
    return fib;
})();

// Example usage
console.log('First 10 Fibonacci numbers:', generateFibonacci(10));
console.log('10th Fibonacci number:', fibonacciMemo(10));`;
  }
  
  if (text.toLowerCase().includes('calculator')) {
    return `/**
 * A comprehensive calculator class with basic arithmetic operations
 */
class Calculator {
    constructor() {
        this.history = [];
    }
    
    /**
     * Adds two numbers
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} Sum of a and b
     */
    add(a, b) {
        this._validateNumbers(a, b);
        const result = a + b;
        this._addToHistory('add', a, b, result);
        return result;
    }
    
    /**
     * Subtracts second number from first
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} Difference of a and b
     */
    subtract(a, b) {
        this._validateNumbers(a, b);
        const result = a - b;
        this._addToHistory('subtract', a, b, result);
        return result;
    }
    
    /**
     * Multiplies two numbers
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} Product of a and b
     */
    multiply(a, b) {
        this._validateNumbers(a, b);
        const result = a * b;
        this._addToHistory('multiply', a, b, result);
        return result;
    }
    
    /**
     * Divides first number by second
     * @param {number} a - Dividend
     * @param {number} b - Divisor
     * @returns {number} Quotient of a and b
     * @throws {Error} If divisor is zero
     */
    divide(a, b) {
        this._validateNumbers(a, b);
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        const result = a / b;
        this._addToHistory('divide', a, b, result);
        return result;
    }
    
    /**
     * Calculates power of a number
     * @param {number} base - Base number
     * @param {number} exponent - Exponent
     * @returns {number} Result of base^exponent
     */
    power(base, exponent) {
        this._validateNumbers(base, exponent);
        const result = Math.pow(base, exponent);
        this._addToHistory('power', base, exponent, result);
        return result;
    }
    
    /**
     * Calculates square root of a number
     * @param {number} n - Number to find square root of
     * @returns {number} Square root of n
     * @throws {Error} If n is negative
     */
    sqrt(n) {
        this._validateNumbers(n);
        if (n < 0) {
            throw new Error('Cannot calculate square root of negative number');
        }
        const result = Math.sqrt(n);
        this._addToHistory('sqrt', n, null, result);
        return result;
    }
    
    /**
     * Gets calculation history
     * @returns {Array} Array of calculation history
     */
    getHistory() {
        return [...this.history];
    }
    
    /**
     * Clears calculation history
     */
    clearHistory() {
        this.history = [];
    }
    
    /**
     * Validates that inputs are numbers
     * @private
     */
    _validateNumbers(...numbers) {
        for (const num of numbers) {
            if (num !== null && (typeof num !== 'number' || isNaN(num))) {
                throw new Error('All inputs must be valid numbers');
            }
        }
    }
    
    /**
     * Adds operation to history
     * @private
     */
    _addToHistory(operation, a, b, result) {
        this.history.push({
            operation,
            operands: b !== null ? [a, b] : [a],
            result,
            timestamp: new Date().toISOString()
        });
    }
}

// Example usage
const calc = new Calculator();

try {
    console.log('Addition: 10 + 5 =', calc.add(10, 5));
    console.log('Subtraction: 10 - 3 =', calc.subtract(10, 3));
    console.log('Multiplication: 4 * 6 =', calc.multiply(4, 6));
    console.log('Division: 15 / 3 =', calc.divide(15, 3));
    console.log('Power: 2^3 =', calc.power(2, 3));
    console.log('Square root: √16 =', calc.sqrt(16));
    
    console.log('\nCalculation History:');
    calc.getHistory().forEach((entry, index) => {
        console.log(\`\${index + 1}. \${entry.operation}: \${entry.operands.join(' ')} = \${entry.result}\`);
    });
} catch (error) {
    console.error('Calculator error:', error.message);
}`;
  }
  
  // Default enhanced template for other requests
  return `/**
 * ${text}
 * Generated JavaScript implementation
 */

/**
 * Main function for: ${text}
 * @param {*} input - Input parameter(s)
 * @returns {*} Processed result
 */
function ${functionName}(input) {
    try {
        // Input validation
        if (input === undefined || input === null) {
            throw new Error('Input parameter is required');
        }
        
        // Main implementation logic
        console.log('Processing:', input);
        
        // TODO: Implement specific logic for: ${text}
        const result = processInput(input);
        
        return result;
    } catch (error) {
        console.error('Error in ${functionName}:', error.message);
        throw error;
    }
}

/**
 * Helper function to process input
 * @param {*} input - Input to process
 * @returns {*} Processed result
 */
function processInput(input) {
    // Implementation depends on requirements: ${text}
    return {
        original: input,
        processed: true,
        timestamp: new Date().toISOString(),
        description: '${text}'
    };
}

/**
 * Utility function for validation
 * @param {*} value - Value to validate
 * @param {string} type - Expected type
 * @returns {boolean} True if valid
 */
function validateInput(value, type = 'any') {
    if (type === 'any') return value !== undefined && value !== null;
    return typeof value === type;
}

// Example usage and testing
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { ${functionName}, processInput, validateInput };
} else {
    // Browser environment
    try {
        const testInput = 'sample input';
        console.log('Testing ${functionName} with:', testInput);
        const result = ${functionName}(testInput);
        console.log('Result:', result);
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}`;
};

const generateEnhancedPythonCode = (text) => {
  const functionName = snakeCase(text);
  
  // Detect common patterns and generate appropriate code
  if (text.toLowerCase().includes('factorial')) {
    return `"""
Factorial calculation with error handling and optimization
"""
from typing import Union
import sys

def calculate_factorial(n: int) -> int:
    """
    Calculate the factorial of a given number.
    
    Args:
        n (int): The number to calculate factorial for
        
    Returns:
        int: The factorial of n
        
    Raises:
        TypeError: If n is not an integer
        ValueError: If n is negative
    """
    if not isinstance(n, int):
        raise TypeError("Input must be an integer")
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n == 0 or n == 1:
        return 1
    
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def factorial_recursive(n: int) -> int:
    """
    Calculate factorial using recursion (with optimization).
    
    Args:
        n (int): The number to calculate factorial for
        
    Returns:
        int: The factorial of n
    """
    if not isinstance(n, int) or n < 0:
        raise ValueError("Input must be a non-negative integer")
    if n == 0 or n == 1:
        return 1
    return n * factorial_recursive(n - 1)

# Example usage and testing
if __name__ == "__main__":
    try:
        # Test cases
        test_values = [0, 1, 5, 10]
        
        print("Factorial calculations:")
        for val in test_values:
            iterative_result = calculate_factorial(val)
            recursive_result = factorial_recursive(val)
            print(f"factorial({val}) = {iterative_result} (iterative) = {recursive_result} (recursive)")
            
    except (TypeError, ValueError) as e:
        print(f"Error: {e}")
    except RecursionError:
        print("Error: Number too large for recursive calculation")`;
  }
  
  if (text.toLowerCase().includes('fibonacci')) {
    return `"""
Fibonacci sequence generation with multiple implementations
"""
from typing import List, Dict
from functools import lru_cache

def generate_fibonacci_sequence(n: int) -> List[int]:
    """
    Generate the first n numbers in the Fibonacci sequence.
    
    Args:
        n (int): Number of Fibonacci numbers to generate
        
    Returns:
        List[int]: List containing the first n Fibonacci numbers
        
    Raises:
        ValueError: If n is not a positive integer
    """
    if not isinstance(n, int) or n <= 0:
        raise ValueError("Input must be a positive integer")
    
    if n == 1:
        return [0]
    if n == 2:
        return [0, 1]
    
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])
    
    return sequence

@lru_cache(maxsize=None)
def fibonacci_memoized(n: int) -> int:
    """
    Calculate the nth Fibonacci number using memoization.
    
    Args:
        n (int): Position in the Fibonacci sequence
        
    Returns:
        int: The nth Fibonacci number
    """
    if n <= 1:
        return n
    return fibonacci_memoized(n - 1) + fibonacci_memoized(n - 2)

class FibonacciGenerator:
    """
    A class for generating Fibonacci numbers with various methods.
    """
    
    def __init__(self):
        self._cache: Dict[int, int] = {0: 0, 1: 1}
    
    def get_nth(self, n: int) -> int:
        """
        Get the nth Fibonacci number using dynamic programming.
        
        Args:
            n (int): Position in sequence
            
        Returns:
            int: The nth Fibonacci number
        """
        if n in self._cache:
            return self._cache[n]
        
        for i in range(len(self._cache), n + 1):
            self._cache[i] = self._cache[i-1] + self._cache[i-2]
        
        return self._cache[n]
    
    def get_sequence(self, n: int) -> List[int]:
        """
        Get the first n Fibonacci numbers.
        
        Args:
            n (int): Number of terms to generate
            
        Returns:
            List[int]: First n Fibonacci numbers
        """
        return [self.get_nth(i) for i in range(n)]

# Example usage
if __name__ == "__main__":
    try:
        # Test different methods
        n = 10
        
        print(f"First {n} Fibonacci numbers:")
        sequence = generate_fibonacci_sequence(n)
        print(f"Sequence: {sequence}")
        
        print(f"\n10th Fibonacci number (memoized): {fibonacci_memoized(10)}")
        
        # Using the class
        fib_gen = FibonacciGenerator()
        print(f"15th Fibonacci number (class): {fib_gen.get_nth(15)}")
        print(f"First 8 numbers (class): {fib_gen.get_sequence(8)}")
        
    except ValueError as e:
        print(f"Error: {e}")`;
  }
  
  if (text.toLowerCase().includes('calculator')) {
    return `"""
Comprehensive calculator class with advanced operations
"""
from typing import List, Dict, Union, Optional
from datetime import datetime
import math

class Calculator:
    """
    A comprehensive calculator with basic and advanced operations.
    Includes operation history and error handling.
    """
    
    def __init__(self):
        self.history: List[Dict] = []
        self._precision = 10
    
    def add(self, a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
        """
        Add two numbers.
        
        Args:
            a: First number
            b: Second number
            
        Returns:
            Sum of a and b
        """
        self._validate_numbers(a, b)
        result = a + b
        self._add_to_history('add', [a, b], result)
        return result
    
    def subtract(self, a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
        """
        Subtract second number from first.
        
        Args:
            a: First number (minuend)
            b: Second number (subtrahend)
            
        Returns:
            Difference of a and b
        """
        self._validate_numbers(a, b)
        result = a - b
        self._add_to_history('subtract', [a, b], result)
        return result
    
    def multiply(self, a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
        """
        Multiply two numbers.
        
        Args:
            a: First number
            b: Second number
            
        Returns:
            Product of a and b
        """
        self._validate_numbers(a, b)
        result = a * b
        self._add_to_history('multiply', [a, b], result)
        return result
    
    def divide(self, a: Union[int, float], b: Union[int, float]) -> float:
        """
        Divide first number by second.
        
        Args:
            a: Dividend
            b: Divisor
            
        Returns:
            Quotient of a and b
            
        Raises:
            ZeroDivisionError: If divisor is zero
        """
        self._validate_numbers(a, b)
        if b == 0:
            raise ZeroDivisionError("Division by zero is not allowed")
        result = a / b
        self._add_to_history('divide', [a, b], result)
        return result
    
    def power(self, base: Union[int, float], exponent: Union[int, float]) -> Union[int, float]:
        """
        Calculate base raised to the power of exponent.
        
        Args:
            base: Base number
            exponent: Exponent
            
        Returns:
            Result of base^exponent
        """
        self._validate_numbers(base, exponent)
        result = math.pow(base, exponent)
        self._add_to_history('power', [base, exponent], result)
        return result
    
    def sqrt(self, n: Union[int, float]) -> float:
        """
        Calculate square root of a number.
        
        Args:
            n: Number to find square root of
            
        Returns:
            Square root of n
            
        Raises:
            ValueError: If n is negative
        """
        self._validate_numbers(n)
        if n < 0:
            raise ValueError("Cannot calculate square root of negative number")
        result = math.sqrt(n)
        self._add_to_history('sqrt', [n], result)
        return result
    
    def factorial(self, n: int) -> int:
        """
        Calculate factorial of a number.
        
        Args:
            n: Non-negative integer
            
        Returns:
            Factorial of n
            
        Raises:
            ValueError: If n is negative or not an integer
        """
        if not isinstance(n, int) or n < 0:
            raise ValueError("Factorial requires a non-negative integer")
        result = math.factorial(n)
        self._add_to_history('factorial', [n], result)
        return result
    
    def percentage(self, value: Union[int, float], percent: Union[int, float]) -> float:
        """
        Calculate percentage of a value.
        
        Args:
            value: Base value
            percent: Percentage to calculate
            
        Returns:
            Percentage of the value
        """
        self._validate_numbers(value, percent)
        result = (value * percent) / 100
        self._add_to_history('percentage', [value, percent], result)
        return result
    
    def get_history(self) -> List[Dict]:
        """
        Get calculation history.
        
        Returns:
            List of calculation history entries
        """
        return self.history.copy()
    
    def clear_history(self) -> None:
        """
        Clear calculation history.
        """
        self.history.clear()
    
    def _validate_numbers(self, *numbers) -> None:
        """
        Validate that all inputs are numbers.
        
        Args:
            *numbers: Numbers to validate
            
        Raises:
            TypeError: If any input is not a number
        """
        for num in numbers:
            if not isinstance(num, (int, float)):
                raise TypeError(f"All inputs must be numbers, got {type(num).__name__}")
    
    def _add_to_history(self, operation: str, operands: List, result: Union[int, float]) -> None:
        """
        Add operation to history.
        
        Args:
            operation: Name of the operation
            operands: List of operands used
            result: Result of the operation
        """
        self.history.append({
            'operation': operation,
            'operands': operands,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })

# Example usage and testing
if __name__ == "__main__":
    calc = Calculator()
    
    try:
        print("Calculator Operations:")
        print(f"Addition: 10 + 5 = {calc.add(10, 5)}")
        print(f"Subtraction: 10 - 3 = {calc.subtract(10, 3)}")
        print(f"Multiplication: 4 * 6 = {calc.multiply(4, 6)}")
        print(f"Division: 15 / 3 = {calc.divide(15, 3)}")
        print(f"Power: 2^3 = {calc.power(2, 3)}")
        print(f"Square root: √16 = {calc.sqrt(16)}")
        print(f"Factorial: 5! = {calc.factorial(5)}")
        print(f"Percentage: 20% of 150 = {calc.percentage(150, 20)}")
        
        print("\nCalculation History:")
        for i, entry in enumerate(calc.get_history(), 1):
            operands_str = ', '.join(map(str, entry['operands']))
            print(f"{i}. {entry['operation']}({operands_str}) = {entry['result']}")
            
    except (TypeError, ValueError, ZeroDivisionError) as e:
        print(f"Calculator error: {e}")`;
  }
  
  // Default enhanced template for other requests
  return `"""
${text}
Generated Python implementation with best practices
"""
from typing import Any, Optional, Union
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ${functionName}(input_data: Any) -> Any:
    """
    Main function for: ${text}
    
    Args:
        input_data: Input parameter(s) for processing
        
    Returns:
        Processed result
        
    Raises:
        ValueError: If input is invalid
        TypeError: If input type is not supported
    """
    try:
        # Input validation
        if input_data is None:
            raise ValueError("Input parameter is required")
        
        logger.info(f"Processing input: {input_data}")
        
        # Main implementation logic
        # TODO: Implement specific logic for: ${text}
        result = process_input(input_data)
        
        logger.info(f"Processing completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Error in ${functionName}: {e}")
        raise

def process_input(input_data: Any) -> dict:
    """
    Helper function to process input data.
    
    Args:
        input_data: Data to process
        
    Returns:
        Dictionary containing processed results
    """
    # Implementation depends on requirements: ${text}
    return {
        'original': input_data,
        'processed': True,
        'timestamp': datetime.now().isoformat(),
        'description': '${text}',
        'type': type(input_data).__name__
    }

def validate_input(value: Any, expected_type: Optional[type] = None) -> bool:
    """
    Utility function for input validation.
    
    Args:
        value: Value to validate
        expected_type: Expected type (optional)
        
    Returns:
        True if valid, False otherwise
    """
    if value is None:
        return False
    if expected_type is not None:
        return isinstance(value, expected_type)
    return True

class ${pascalCase(text)}Handler:
    """
    Class-based implementation for: ${text}
    """
    
    def __init__(self):
        self.created_at = datetime.now()
        self.operations_count = 0
    
    def handle(self, data: Any) -> Any:
        """
        Handle the main operation.
        
        Args:
            data: Input data to handle
            
        Returns:
            Processed result
        """
        self.operations_count += 1
        logger.info(f"Handling operation #{self.operations_count}")
        
        return ${functionName}(data)
    
    def get_stats(self) -> dict:
        """
        Get handler statistics.
        
        Returns:
            Dictionary with handler statistics
        """
        return {
            'created_at': self.created_at.isoformat(),
            'operations_count': self.operations_count,
            'uptime': (datetime.now() - self.created_at).total_seconds()
        }

# Example usage and testing
if __name__ == "__main__":
    try:
        # Test the function
        test_input = "sample input"
        print(f"Testing ${functionName} with: {test_input}")
        
        result = ${functionName}(test_input)
        print(f"Result: {result}")
        
        # Test the class
        handler = ${pascalCase(text)}Handler()
        class_result = handler.handle(test_input)
        print(f"Class result: {class_result}")
        print(f"Handler stats: {handler.get_stats()}")
        
    except Exception as e:
        print(f"Test failed: {e}")
`;
};

const generateEnhancedJavaCode = (text) => {
  const className = pascalCase(text);
  
  if (text.toLowerCase().includes('factorial')) {
    return `/**
 * Factorial calculation with comprehensive error handling
 * @author Code Generator
 */
public class FactorialCalculator {
    
    /**
     * Calculate factorial using iterative approach
     * @param n The number to calculate factorial for
     * @return The factorial of n
     * @throws IllegalArgumentException if n is negative
     */
    public static long calculateFactorial(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("Factorial is not defined for negative numbers");
        }
        if (n == 0 || n == 1) {
            return 1;
        }
        
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    /**
     * Calculate factorial using recursive approach
     * @param n The number to calculate factorial for
     * @return The factorial of n
     */
    public static long factorialRecursive(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("Factorial is not defined for negative numbers");
        }
        if (n == 0 || n == 1) {
            return 1;
        }
        return n * factorialRecursive(n - 1);
    }
    
    public static void main(String[] args) {
        try {
            int[] testValues = {0, 1, 5, 10};
            
            System.out.println("Factorial Calculations:");
            for (int val : testValues) {
                long iterative = calculateFactorial(val);
                long recursive = factorialRecursive(val);
                System.out.printf("factorial(%d) = %d (iterative) = %d (recursive)%n", 
                    val, iterative, recursive);
            }
        } catch (IllegalArgumentException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}`;
  }
  
  if (text.toLowerCase().includes('calculator')) {
    return `import java.util.*;

/**
 * Comprehensive calculator with advanced operations and history tracking
 */
public class Calculator {
    private List<CalculationEntry> history;
    
    public Calculator() {
        this.history = new ArrayList<>();
    }
    
    /**
     * Add two numbers
     */
    public double add(double a, double b) {
        double result = a + b;
        addToHistory("add", Arrays.asList(a, b), result);
        return result;
    }
    
    /**
     * Subtract second number from first
     */
    public double subtract(double a, double b) {
        double result = a - b;
        addToHistory("subtract", Arrays.asList(a, b), result);
        return result;
    }
    
    /**
     * Multiply two numbers
     */
    public double multiply(double a, double b) {
        double result = a * b;
        addToHistory("multiply", Arrays.asList(a, b), result);
        return result;
    }
    
    /**
     * Divide first number by second
     * @throws ArithmeticException if divisor is zero
     */
    public double divide(double a, double b) {
        if (b == 0) {
            throw new ArithmeticException("Division by zero is not allowed");
        }
        double result = a / b;
        addToHistory("divide", Arrays.asList(a, b), result);
        return result;
    }
    
    /**
     * Calculate power
     */
    public double power(double base, double exponent) {
        double result = Math.pow(base, exponent);
        addToHistory("power", Arrays.asList(base, exponent), result);
        return result;
    }
    
    /**
     * Calculate square root
     */
    public double sqrt(double n) {
        if (n < 0) {
            throw new IllegalArgumentException("Cannot calculate square root of negative number");
        }
        double result = Math.sqrt(n);
        addToHistory("sqrt", Arrays.asList(n), result);
        return result;
    }
    
    /**
     * Get calculation history
     */
    public List<CalculationEntry> getHistory() {
        return new ArrayList<>(history);
    }
    
    /**
     * Clear calculation history
     */
    public void clearHistory() {
        history.clear();
    }
    
    private void addToHistory(String operation, List<Double> operands, double result) {
        history.add(new CalculationEntry(operation, operands, result, new Date()));
    }
    
    /**
     * Inner class to represent calculation entries
     */
    public static class CalculationEntry {
        private final String operation;
        private final List<Double> operands;
        private final double result;
        private final Date timestamp;
        
        public CalculationEntry(String operation, List<Double> operands, double result, Date timestamp) {
            this.operation = operation;
            this.operands = new ArrayList<>(operands);
            this.result = result;
            this.timestamp = new Date(timestamp.getTime());
        }
        
        @Override
        public String toString() {
            return String.format("%s(%s) = %.2f at %s", 
                operation, operands.toString(), result, timestamp);
        }
    }
    
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        
        try {
            System.out.println("Calculator Operations:");
            System.out.println("Addition: 10 + 5 = " + calc.add(10, 5));
            System.out.println("Subtraction: 10 - 3 = " + calc.subtract(10, 3));
            System.out.println("Multiplication: 4 * 6 = " + calc.multiply(4, 6));
            System.out.println("Division: 15 / 3 = " + calc.divide(15, 3));
            System.out.println("Power: 2^3 = " + calc.power(2, 3));
            System.out.println("Square root: √16 = " + calc.sqrt(16));
            
            System.out.println("\\nCalculation History:");
            List<CalculationEntry> history = calc.getHistory();
            for (int i = 0; i < history.size(); i++) {
                System.out.println((i + 1) + ". " + history.get(i));
            }
        } catch (Exception e) {
            System.err.println("Calculator error: " + e.getMessage());
        }
    }
}`;
  }
  
  // Default enhanced template
  return `/**
 * ${text}
 * Generated Java implementation with best practices
 */
public class ${className} {
    
    /**
     * Main processing method for: ${text}
     * @param input Input data to process
     * @return Processed result
     */
    public static String process${className}(String input) {
        if (input == null || input.trim().isEmpty()) {
            throw new IllegalArgumentException("Input parameter is required");
        }
        
        System.out.println("Processing: " + input);
        
        // TODO: Implement specific logic for: ${text}
        return processInput(input);
    }
    
    /**
     * Helper method to process input
     * @param input Input to process
     * @return Processed result
     */
    private static String processInput(String input) {
        // Implementation depends on requirements: ${text}
        return String.format("Processed: %s at %s", input, new java.util.Date());
    }
    
    /**
     * Utility method for input validation
     * @param value Value to validate
     * @return true if valid, false otherwise
     */
    public static boolean validateInput(String value) {
        return value != null && !value.trim().isEmpty();
    }
    
    public static void main(String[] args) {
        try {
            String testInput = "sample input";
            System.out.println("Testing ${className} with: " + testInput);
            
            String result = process${className}(testInput);
            System.out.println("Result: " + result);
        } catch (Exception e) {
            System.err.println("Test failed: " + e.getMessage());
        }
    }
}`;
};

const generateEnhancedCppCode = (text) => {
  const functionName = camelCase(text);
  
  if (text.toLowerCase().includes('factorial')) {
    return `/**
 * Factorial calculation with modern C++ features
 */
#include <iostream>
#include <stdexcept>
#include <vector>
#include <chrono>

class FactorialCalculator {
public:
    /**
     * Calculate factorial using iterative approach
     */
    static long long calculateFactorial(int n) {
        if (n < 0) {
            throw std::invalid_argument("Factorial is not defined for negative numbers");
        }
        if (n == 0 || n == 1) {
            return 1;
        }
        
        long long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    /**
     * Calculate factorial using recursive approach
     */
    static long long factorialRecursive(int n) {
        if (n < 0) {
            throw std::invalid_argument("Factorial is not defined for negative numbers");
        }
        if (n == 0 || n == 1) {
            return 1;
        }
        return n * factorialRecursive(n - 1);
    }
};

int main() {
    try {
        std::vector<int> testValues = {0, 1, 5, 10};
        
        std::cout << "Factorial Calculations:" << std::endl;
        for (int val : testValues) {
            auto iterative = FactorialCalculator::calculateFactorial(val);
            auto recursive = FactorialCalculator::factorialRecursive(val);
            std::cout << "factorial(" << val << ") = " << iterative 
                     << " (iterative) = " << recursive << " (recursive)" << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
    
    return 0;
}`;
  }
  
  if (text.toLowerCase().includes('calculator')) {
    return `/**
 * Modern C++ Calculator with STL and exception handling
 */
#include <iostream>
#include <vector>
#include <string>
#include <stdexcept>
#include <cmath>
#include <chrono>
#include <iomanip>

class Calculator {
private:
    struct CalculationEntry {
        std::string operation;
        std::vector<double> operands;
        double result;
        std::chrono::system_clock::time_point timestamp;
        
        CalculationEntry(const std::string& op, const std::vector<double>& ops, double res)
            : operation(op), operands(ops), result(res), timestamp(std::chrono::system_clock::now()) {}
    };
    
    std::vector<CalculationEntry> history;
    
    void addToHistory(const std::string& operation, const std::vector<double>& operands, double result) {
        history.emplace_back(operation, operands, result);
    }

public:
    /**
     * Add two numbers
     */
    double add(double a, double b) {
        double result = a + b;
        addToHistory("add", {a, b}, result);
        return result;
    }
    
    /**
     * Subtract second number from first
     */
    double subtract(double a, double b) {
        double result = a - b;
        addToHistory("subtract", {a, b}, result);
        return result;
    }
    
    /**
     * Multiply two numbers
     */
    double multiply(double a, double b) {
        double result = a * b;
        addToHistory("multiply", {a, b}, result);
        return result;
    }
    
    /**
     * Divide first number by second
     */
    double divide(double a, double b) {
        if (b == 0.0) {
            throw std::invalid_argument("Division by zero is not allowed");
        }
        double result = a / b;
        addToHistory("divide", {a, b}, result);
        return result;
    }
    
    /**
     * Calculate power
     */
    double power(double base, double exponent) {
        double result = std::pow(base, exponent);
        addToHistory("power", {base, exponent}, result);
        return result;
    }
    
    /**
     * Calculate square root
     */
    double sqrt(double n) {
        if (n < 0) {
            throw std::invalid_argument("Cannot calculate square root of negative number");
        }
        double result = std::sqrt(n);
        addToHistory("sqrt", {n}, result);
        return result;
    }
    
    /**
     * Get calculation history
     */
    const std::vector<CalculationEntry>& getHistory() const {
        return history;
    }
    
    /**
     * Clear calculation history
     */
    void clearHistory() {
        history.clear();
    }
    
    /**
     * Print history
     */
    void printHistory() const {
        std::cout << "\\nCalculation History:" << std::endl;
        for (size_t i = 0; i < history.size(); ++i) {
            const auto& entry = history[i];
            std::cout << (i + 1) << ". " << entry.operation << "(";
            for (size_t j = 0; j < entry.operands.size(); ++j) {
                if (j > 0) std::cout << ", ";
                std::cout << entry.operands[j];
            }
            std::cout << ") = " << std::fixed << std::setprecision(2) << entry.result << std::endl;
        }
    }
};

int main() {
    Calculator calc;
    
    try {
        std::cout << "Calculator Operations:" << std::endl;
        std::cout << "Addition: 10 + 5 = " << calc.add(10, 5) << std::endl;
        std::cout << "Subtraction: 10 - 3 = " << calc.subtract(10, 3) << std::endl;
        std::cout << "Multiplication: 4 * 6 = " << calc.multiply(4, 6) << std::endl;
        std::cout << "Division: 15 / 3 = " << calc.divide(15, 3) << std::endl;
        std::cout << "Power: 2^3 = " << calc.power(2, 3) << std::endl;
        std::cout << "Square root: √16 = " << calc.sqrt(16) << std::endl;
        
        calc.printHistory();
    } catch (const std::exception& e) {
        std::cerr << "Calculator error: " << e.what() << std::endl;
    }
    
    return 0;
}`;
  }
  
  // Default enhanced template
  return `/**
 * ${text}
 * Generated C++ implementation with modern features
 */
#include <iostream>
#include <string>
#include <stdexcept>
#include <chrono>
#include <memory>

class ${pascalCase(text)}Processor {
private:
    std::string description;
    std::chrono::system_clock::time_point createdAt;

public:
    explicit ${pascalCase(text)}Processor(const std::string& desc = "${text}") 
        : description(desc), createdAt(std::chrono::system_clock::now()) {}
    
    /**
     * Main processing method for: ${text}
     */
    std::string process(const std::string& input) {
        if (input.empty()) {
            throw std::invalid_argument("Input parameter is required");
        }
        
        std::cout << "Processing: " << input << std::endl;
        
        // TODO: Implement specific logic for: ${text}
        return processInput(input);
    }
    
    /**
     * Helper method to process input
     */
    std::string processInput(const std::string& input) {
        // Implementation depends on requirements: ${text}
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        
        return "Processed: " + input + " at " + std::ctime(&time_t);
    }
    
    /**
     * Utility method for input validation
     */
    static bool validateInput(const std::string& value) {
        return !value.empty();
    }
    
    const std::string& getDescription() const { return description; }
};

int main() {
    try {
        auto processor = std::make_unique<${pascalCase(text)}Processor>();
        std::string testInput = "sample input";
        
        std::cout << "Testing ${pascalCase(text)}Processor with: " << testInput << std::endl;
        
        std::string result = processor->process(testInput);
        std::cout << "Result: " << result << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Test failed: " << e.what() << std::endl;
    }
    
    return 0;
}`;
};

const generateEnhancedHtmlCode = (text) => {
  if (text.toLowerCase().includes('form') || text.toLowerCase().includes('contact')) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form - ${text}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .form-container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); width: 100%; max-width: 500px; }
        h1 { color: #333; margin-bottom: 1.5rem; text-align: center; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 5px; font-size: 1rem; transition: border-color 0.3s; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #667eea; }
        button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.75rem 2rem; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; width: 100%; transition: transform 0.2s; }
        button:hover { transform: translateY(-2px); }
        .error { color: #e74c3c; font-size: 0.875rem; margin-top: 0.25rem; }
        .success { color: #27ae60; text-align: center; margin-top: 1rem; }
    </style>
</head>
<body>
    <div class="form-container">
        <h1>Contact Form</h1>
        <form id="contactForm" novalidate>
            <div class="form-group">
                <label for="name">Full Name *</label>
                <input type="text" id="name" name="name" required>
                <div class="error" id="nameError"></div>
            </div>
            <div class="form-group">
                <label for="email">Email Address *</label>
                <input type="email" id="email" name="email" required>
                <div class="error" id="emailError"></div>
            </div>
            <div class="form-group">
                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone">
            </div>
            <div class="form-group">
                <label for="subject">Subject *</label>
                <select id="subject" name="subject" required>
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="business">Business Proposal</option>
                </select>
                <div class="error" id="subjectError"></div>
            </div>
            <div class="form-group">
                <label for="message">Message *</label>
                <textarea id="message" name="message" rows="5" required></textarea>
                <div class="error" id="messageError"></div>
            </div>
            <button type="submit">Send Message</button>
            <div class="success" id="successMessage" style="display: none;">Message sent successfully!</div>
        </form>
    </div>
    
    <script>
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            document.querySelectorAll('.error').forEach(el => el.textContent = '');
            
            let isValid = true;
            
            // Validate name
            const name = document.getElementById('name').value.trim();
            if (!name) {
                document.getElementById('nameError').textContent = 'Name is required';
                isValid = false;
            }
            
            // Validate email
            const email = document.getElementById('email').value.trim();
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!email) {
                document.getElementById('emailError').textContent = 'Email is required';
                isValid = false;
            } else if (!emailRegex.test(email)) {
                document.getElementById('emailError').textContent = 'Please enter a valid email';
                isValid = false;
            }
            
            // Validate subject
            const subject = document.getElementById('subject').value;
            if (!subject) {
                document.getElementById('subjectError').textContent = 'Please select a subject';
                isValid = false;
            }
            
            // Validate message
            const message = document.getElementById('message').value.trim();
            if (!message) {
                document.getElementById('messageError').textContent = 'Message is required';
                isValid = false;
            } else if (message.length < 10) {
                document.getElementById('messageError').textContent = 'Message must be at least 10 characters';
                isValid = false;
            }
            
            if (isValid) {
                document.getElementById('successMessage').style.display = 'block';
                this.reset();
            }
        });
    </script>
</body>
</html>`;
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${text}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 3rem 0; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .content { padding: 2rem 0; }
        .card { background: white; padding: 2rem; margin: 1rem 0; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>${text}</h1>
            <p>Generated with modern HTML5 and responsive design</p>
        </div>
    </header>
    
    <main class="container">
        <div class="content">
            <div class="card">
                <h2>Welcome</h2>
                <p>This is a professionally generated HTML page for: <strong>${text}</strong></p>
                <p>Features include responsive design, modern CSS, and semantic HTML5 markup.</p>
            </div>
        </div>
    </main>
</body>
</html>`;
};

const generateEnhancedCssCode = (text) => {
  if (text.toLowerCase().includes('button') || text.toLowerCase().includes('component')) {
    return `/* Modern CSS Components for: ${text} */

/* CSS Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #f093fb;
    --text-color: #333;
    --bg-color: #f8f9fa;
    --white: #ffffff;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.2);
    --border-radius: 8px;
    --transition: all 0.3s ease;
}

/* Modern Button Components */
.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: var(--transition);
    position: relative;
    overflow: hidden;
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: var(--white);
    box-shadow: var(--shadow);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.btn-secondary {
    background: transparent;
    color: var(--primary-color);
    border: 2px solid var(--primary-color);
}

.btn-secondary:hover {
    background: var(--primary-color);
    color: var(--white);
}

/* Card Component */
.card {
    background: var(--white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    padding: 1.5rem;
    margin: 1rem 0;
    transition: var(--transition);
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.card-header {
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
}

.card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
}

/* Form Components */
.form-group {
    margin-bottom: 1rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: var(--border-radius);
    transition: var(--transition);
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Utility Classes */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }

.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }

/* Responsive Design */
@media (max-width: 768px) {
    .container {
        padding: 0 0.5rem;
    }
    
    .btn {
        width: 100%;
        margin-bottom: 0.5rem;
    }
    
    .card {
        margin: 0.5rem 0;
        padding: 1rem;
    }
}

/* Animation Classes */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

.fade-in {
    animation: fadeIn 0.6s ease-out;
}

.slide-in {
    animation: slideIn 0.6s ease-out;
}`;
  }
  
  return `/* Generated CSS for: ${text} */

/* Modern CSS Reset */
*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* CSS Custom Properties */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --text-color: #333333;
    --bg-color: #f8f9fa;
    --white: #ffffff;
    --border-radius: 8px;
    --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
}

/* Base Styles */
body {
    font-family: 'Inter', 'Arial', sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--bg-color);
}

/* ${text} Specific Styles */
.${kebabCase(text)} {
    background: var(--white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    padding: 2rem;
    margin: 1rem 0;
    transition: var(--transition);
}

.${kebabCase(text)}:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.${kebabCase(text)}-header {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: var(--white);
    padding: 1.5rem;
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    margin: -2rem -2rem 2rem -2rem;
}

.${kebabCase(text)}-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.${kebabCase(text)}-content {
    padding: 1rem 0;
}

.${kebabCase(text)}-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .${kebabCase(text)}-container {
        padding: 1rem;
    }
    
    .${kebabCase(text)} {
        margin: 0.5rem 0;
        padding: 1rem;
    }
    
    .${kebabCase(text)}-header {
        margin: -1rem -1rem 1rem -1rem;
        padding: 1rem;
    }
}

/* Utility Classes */
.text-center { text-align: center; }
.mb-2 { margin-bottom: 1rem; }
.mt-2 { margin-top: 1rem; }`;
};

const generateEnhancedReactCode = (text) => {
  const componentName = pascalCase(text);
  
  if (text.toLowerCase().includes('todo') || text.toLowerCase().includes('list')) {
    return `import React, { useState, useEffect } from 'react';
import './TodoApp.css';

/**
 * TodoApp Component - A complete todo list application
 * Features: Add, edit, delete, filter, and persist todos
 */
const TodoApp = () => {
    const [todos, setTodos] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [filter, setFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    // Load todos from localStorage on component mount
    useEffect(() => {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            setTodos(JSON.parse(savedTodos));
        }
    }, []);

    // Save todos to localStorage whenever todos change
    useEffect(() => {
        localStorage.setItem('todos', JSON.stringify(todos));
    }, [todos]);

    // Add new todo
    const addTodo = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            const newTodo = {
                id: Date.now(),
                text: inputValue.trim(),
                completed: false,
                createdAt: new Date().toISOString()
            };
            setTodos([...todos, newTodo]);
            setInputValue('');
        }
    };

    // Toggle todo completion
    const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    // Delete todo
    const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    // Start editing todo
    const startEdit = (id, text) => {
        setEditingId(id);
        setEditValue(text);
    };

    // Save edited todo
    const saveEdit = (id) => {
        if (editValue.trim()) {
            setTodos(todos.map(todo =>
                todo.id === id ? { ...todo, text: editValue.trim() } : todo
            ));
        }
        setEditingId(null);
        setEditValue('');
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    // Filter todos based on current filter
    const filteredTodos = todos.filter(todo => {
        switch (filter) {
            case 'active':
                return !todo.completed;
            case 'completed':
                return todo.completed;
            default:
                return true;
        }
    });

    // Clear completed todos
    const clearCompleted = () => {
        setTodos(todos.filter(todo => !todo.completed));
    };

    const completedCount = todos.filter(todo => todo.completed).length;
    const activeCount = todos.length - completedCount;

    return (
        <div className="todo-app">
            <header className="todo-header">
                <h1>Todo Application</h1>
                <p>Stay organized and productive</p>
            </header>

            <div className="todo-container">
                {/* Add Todo Form */}
                <form onSubmit={addTodo} className="todo-form">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="What needs to be done?"
                        className="todo-input"
                    />
                    <button type="submit" className="add-btn">
                        Add Todo
                    </button>
                </form>

                {/* Filter Buttons */}
                {todos.length > 0 && (
                    <div className="todo-filters">
                        <button
                            className={\`filter-btn \${filter === 'all' ? 'active' : ''}\`}
                            onClick={() => setFilter('all')}
                        >
                            All ({todos.length})
                        </button>
                        <button
                            className={\`filter-btn \${filter === 'active' ? 'active' : ''}\`}
                            onClick={() => setFilter('active')}
                        >
                            Active ({activeCount})
                        </button>
                        <button
                            className={\`filter-btn \${filter === 'completed' ? 'active' : ''}\`}
                            onClick={() => setFilter('completed')}
                        >
                            Completed ({completedCount})
                        </button>
                    </div>
                )}

                {/* Todo List */}
                <div className="todo-list">
                    {filteredTodos.length === 0 ? (
                        <div className="empty-state">
                            <p>
                                {filter === 'all' 
                                    ? "No todos yet. Add one above!" 
                                    : \`No \${filter} todos\`
                                }
                            </p>
                        </div>
                    ) : (
                        filteredTodos.map(todo => (
                            <div key={todo.id} className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
                                <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => toggleTodo(todo.id)}
                                    className="todo-checkbox"
                                />
                                
                                {editingId === todo.id ? (
                                    <div className="edit-form">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') saveEdit(todo.id);
                                                if (e.key === 'Escape') cancelEdit();
                                            }}
                                            className="edit-input"
                                            autoFocus
                                        />
                                        <button onClick={() => saveEdit(todo.id)} className="save-btn">
                                            Save
                                        </button>
                                        <button onClick={cancelEdit} className="cancel-btn">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="todo-content">
                                        <span className="todo-text">{todo.text}</span>
                                        <div className="todo-actions">
                                            <button
                                                onClick={() => startEdit(todo.id, todo.text)}
                                                className="edit-btn"
                                                disabled={todo.completed}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteTodo(todo.id)}
                                                className="delete-btn"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                {todos.length > 0 && (
                    <div className="todo-footer">
                        <span className="todo-count">
                            {activeCount} item{activeCount !== 1 ? 's' : ''} left
                        </span>
                        {completedCount > 0 && (
                            <button onClick={clearCompleted} className="clear-btn">
                                Clear Completed
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodoApp;`;
  }
  
  return `import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * ${componentName} Component
 * Generated React component for: ${text}
 */
const ${componentName} = ({ title = "${text}", className = "" }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Component initialization
        console.log('${componentName} component mounted');
        
        // TODO: Add initialization logic for: ${text}
        initializeComponent();
        
        return () => {
            // Cleanup
            console.log('${componentName} component unmounted');
        };
    }, []);

    const initializeComponent = async () => {
        setLoading(true);
        try {
            // TODO: Implement initialization logic for: ${text}
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
            setData({
                message: \`Component initialized for: \${title}\`,
                timestamp: new Date().toISOString(),
                status: 'ready'
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (actionType) => {
        console.log(\`Action triggered: \${actionType}\`);
        // TODO: Implement action handling for: ${text}
    };

    if (loading) {
        return (
            <div className={\`\${className} loading-container\`}>
                <div className="spinner"></div>
                <p>Loading ${componentName}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={\`\${className} error-container\`}>
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={initializeComponent}>Retry</button>
            </div>
        );
    }

    return (
        <div className={\`${kebabCase(text)} \${className}\`}>
            <header className="${kebabCase(text)}-header">
                <h1>{title}</h1>
                <p>React component for: {title}</p>
            </header>
            
            <main className="${kebabCase(text)}-content">
                {data && (
                    <div className="data-display">
                        <h3>Component Status</h3>
                        <p><strong>Message:</strong> {data.message}</p>
                        <p><strong>Status:</strong> {data.status}</p>
                        <p><strong>Initialized:</strong> {new Date(data.timestamp).toLocaleString()}</p>
                    </div>
                )}
                
                <div className="actions">
                    <button 
                        onClick={() => handleAction('primary')}
                        className="btn btn-primary"
                    >
                        Primary Action
                    </button>
                    <button 
                        onClick={() => handleAction('secondary')}
                        className="btn btn-secondary"
                    >
                        Secondary Action
                    </button>
                </div>
            </main>
            
            <footer className="${kebabCase(text)}-footer">
                <p>Generated with React best practices</p>
            </footer>
        </div>
    );
};

${componentName}.propTypes = {
    title: PropTypes.string,
    className: PropTypes.string
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
