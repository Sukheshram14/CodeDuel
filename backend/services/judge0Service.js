const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

// Judge0 API Configuration
const RAPID_API_URL = process.env.RAPID_API_URL || "https://judge0-ce.p.rapidapi.com/submissions";
const RAPID_API_HOST = process.env.RAPID_API_HOST || "judge0-ce.p.rapidapi.com";
// const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_KEYS = process.env.RAPID_API_KEYS.split(",");
let keyIndex = 0;
let attempts = 0;

const getApiKey = () => RAPID_API_KEYS[keyIndex];

const rotateApiKey = () => {
  keyIndex = (keyIndex + 1) % RAPID_API_KEYS.length;
  attempts++;
};



// Language IDs for Judge0
const languageIds = { 
  python: 71, 
  javascript: 63, 
  php: 68, 
  cpp: 52 
};

// Boilerplate for Python, JavaScript, and PHP
const boilerplate = {
  python: `
import sys
import json

def read_input():
    return json.loads(sys.stdin.read().strip())

# Injected user function here
USER_FUNCTION_PLACEHOLDER

def main():
    input_data = read_input()
    if isinstance(input_data, list) and len(input_data) == 2:
        result = USER_FUNCTION_NAME(*input_data)
    else:
        result = USER_FUNCTION_NAME(input_data)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
`,
  javascript: `
process.stdin.on('data', function(data) {
    const input = JSON.parse(data.toString().trim());
    // Injected user function here
    USER_FUNCTION_PLACEHOLDER
    let result;
    if (Array.isArray(input) && input.length === 2) {
        result = USER_FUNCTION_NAME(...input);
    } else {
        result = USER_FUNCTION_NAME(input);
    }
    console.log(JSON.stringify(result));
});
`,
  php: `<?php
function read_input() {
    return json_decode(trim(fgets(STDIN)), true);
}

// Injected user function here
USER_FUNCTION_PLACEHOLDER

$input = read_input();
if (is_array($input) && count($input) === 2) {
    $result = USER_FUNCTION_NAME($input[0], $input[1]);
} else {
    $result = USER_FUNCTION_NAME($input);
}
echo json_encode($result);
?>`,
};

// C++ Boilerplate Templates for Different Input Types
const cppBoilerplateTemplates = {
  string: (functionName) => `
#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

USER_FUNCTION_PLACEHOLDER

int main() {
    string input;
    getline(cin, input);
    input = input.substr(1, input.length() - 2); // Remove quotes
    cout << ${functionName}(input) << endl;
    return 0;
}
`,
  int: (functionName) => `
#include <iostream>
using namespace std;

USER_FUNCTION_PLACEHOLDER

int main() {
    int input;
    cin >> input;
    cout << ${functionName}(input) << endl;
    return 0;
}
`,
  "vector<int>": (functionName) => `
#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
using namespace std;

USER_FUNCTION_PLACEHOLDER

int main() {
    string line;
    getline(cin, line);
    // Remove brackets and spaces
    line.erase(std::remove(line.begin(), line.end(), '['), line.end());
    line.erase(std::remove(line.begin(), line.end(), ']'), line.end());
    line.erase(std::remove(line.begin(), line.end(), ' '), line.end());
    stringstream ss(line);
    vector<int> input;
    string token;
    while(getline(ss, token, ',')) {
        if(!token.empty()){
            input.push_back(stoi(token));
        }
    }
    cout << ${functionName}(input) << endl;
    return 0;
}
`,
  "vector<string>": (functionName) => `
#include <iostream>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

USER_FUNCTION_PLACEHOLDER

int main() {
    string line;
    getline(cin, line);
    // Remove brackets and quotes
    line.erase(std::remove(line.begin(), line.end(), '['), line.end());
    line.erase(std::remove(line.begin(), line.end(), ']'), line.end());
    line.erase(std::remove(line.begin(), line.end(), '\"'), line.end());
    
    stringstream ss(line);
    vector<string> inputs;
    string word;
    while(getline(ss, word, ',')) {
        size_t start = word.find_first_not_of(" ");
        size_t end = word.find_last_not_of(" ");
        if(start != string::npos && end != string::npos)
            inputs.push_back(word.substr(start, end - start + 1));
    }
    if(inputs.size() >= 2)
        cout << (${functionName}(inputs[0], inputs[1]) ? "true" : "false") << endl;
    return 0;
}
`,
};

// Map problem types to expected input types for C++
const inputTypeMapping = {
  "string": "string",
  "number": "int",
  "array-number": "vector<int>",
  "array-string": "vector<string>"
};

/**
 * Extracts the function name from user code
 * @param {string} userCode - The user's submitted code
 * @param {string} language - Programming language (javascript, python, php, or cpp)
 * @returns {string} - Extracted function name
 */
const extractFunctionName = (userCode, language) => {
  try {
    // Different regex patterns for different languages
    const patterns = {
      javascript: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
      python: /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
      php: /function\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*\(/,
      cpp: /[a-zA-Z_][a-zA-Z0-9_]*\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/
    };

    const match = userCode.match(patterns[language]);
    if (match && match[1]) {
      return match[1];
    }
    
    // Default function names if extraction fails
    const defaults = {
      javascript: "solution",
      python: "solution",
      php: "solution",
      cpp: "solution"
    };
    
    return defaults[language];
  } catch (error) {
    console.error("Error extracting function name:", error);
    return "solution"; // Default fallback name
  }
};

/**
 * Prepare code with the appropriate boilerplate
 * @param {string} userCode - User's solution code
 * @param {string} language - Programming language
 * @param {string} problemType - Type of problem (for C++ template selection)
 * @returns {string} - The prepared code with boilerplate
 */
const prepareCode = (userCode, language, problemType) => {
  try {
    // Extract function name from user code
    const functionName = extractFunctionName(userCode, language);
    let finalCode = "";

    if (language === "cpp") {
      // For C++, select the appropriate template based on problem type
      const parameterType = inputTypeMapping[problemType] || "string";
      const cppTemplate = cppBoilerplateTemplates[parameterType];
      
      if (!cppTemplate) {
        throw new Error("No boilerplate template for the specified input type");
      }
      
      // Insert user's code into the template
      finalCode = cppTemplate(functionName).replace(
        "USER_FUNCTION_PLACEHOLDER",
        userCode
      );
    } else {
      // For other languages, use standard boilerplate
      finalCode = boilerplate[language]
        .replace("USER_FUNCTION_PLACEHOLDER", userCode)
        .replace(/USER_FUNCTION_NAME/g, functionName);
    }
    
    return finalCode;
  } catch (error) {
    console.error("Error preparing code:", error);
    throw error;
  }
};

/**
 * Submit code to Judge0 API
 * @param {string} sourceCode - Prepared code with boilerplate
 * @param {string} language - Programming language
 * @param {string} input - Test case input
 * @param {string} expectedOutput - Expected output
 * @returns {Promise<Object>} - Judge0 API response
 */
const submitToJudge0 = async (sourceCode, language, input, expectedOutput) => {
  try {
    const langId = languageIds[language];
    if (!langId) {
      throw new Error("Unsupported language");
    }

    const requestData = {
      source_code: Buffer.from(sourceCode).toString("base64"),
      language_id: langId,
      stdin: Buffer.from(input).toString("base64"),
      expected_output: Buffer.from(expectedOutput).toString("base64"),
      base64_encoded: true,
      wait: true,
    };

    console.log(`Sending request to Judge0 API for language ID: ${langId}`);
    
    try {
      const response = await axios.post(
        `${RAPID_API_URL}/?base64_encoded=true&wait=true`,
        requestData,
        {
          headers: {
            "X-RapidAPI-Key": getApiKey(),
            "X-RapidAPI-Host": RAPID_API_HOST,
            "Content-Type": "application/json",
          },
        }
      );
      return processJudge0Response(response.data);
    } catch (apiError) {
      console.error("Judge0 API Error:", apiError.message);
      
      // // Check specifically for rate limiting errors
      // if (apiError.response && apiError.response.status === 429) {
      //   console.error("Rate limit exceeded for Judge0 API");
      //   return {
      //     status: {
      //       id: 0,
      //       description: "API Rate Limit Exceeded"
      //     },
      //     memory: 0,
      //     time: 0,
      //     stdout: "The code execution service is currently unavailable due to rate limiting. Please try again later.",
      //     stderr: null,
      //     compile_output: null,
      //     passed: false
      //   };
      // }
      if (apiError.response && apiError.response.status === 429) {
  console.error("Rate limit hit for current RapidAPI key");

  if (attempts >= RAPID_API_KEYS.length - 1) {
    return {
      status: {
        id: 0,
        description: "All API Keys Exhausted"
      },
      memory: 0,
      time: 0,
      stdout: "All execution service keys are currently rate-limited. Please try again later.",
      stderr: null,
      compile_output: null,
      passed: false
    };
  }

  rotateApiKey();
  return submitToJudge0(sourceCode, language, input, expectedOutput);
}

      
      // For other API errors
      return {
        status: {
          id: 0,
          description: "API Error"
        },
        memory: 0,
        time: 0,
        stdout: null,
        stderr: apiError.message,
        compile_output: apiError.response?.data ? JSON.stringify(apiError.response.data) : null,
        passed: false
      };
    }
  } catch (error) {
    console.error("Judge0 Service Error:", error);
    
    return {
      status: {
        id: 0,
        description: "Error"
      },
      memory: 0,
      time: 0,
      stdout: null,
      stderr: error.message,
      compile_output: null,
      passed: false,
    };
  }
};

/**
 * Process Judge0 API response
 * @param {Object} responseData - Judge0 API response data
 * @returns {Object} - Processed result
 */
const processJudge0Response = (responseData) => {
  try {
    const status = responseData.status ? responseData.status : { id: 0, description: "Unknown" };
    
    // Decode outputs - handle possible null values
    let stdout = null;
    let stderr = null;
    let compile_output = null;
    
    if (responseData.stdout) {
      stdout = Buffer.from(responseData.stdout, "base64").toString("utf-8").trim();
    }
    
    if (responseData.stderr) {
      stderr = Buffer.from(responseData.stderr, "base64").toString("utf-8").trim();
    }
    
    if (responseData.compile_output) {
      compile_output = Buffer.from(responseData.compile_output, "base64").toString("utf-8").trim();
    }
    
    // Check if the submission passed
    const passed = status.id === 3; // Status ID 3 is "Accepted" in Judge0
    
    return {
      status,
      memory: responseData.memory || 0,
      time: responseData.time || 0,
      stdout,
      stderr,
      compile_output,
      passed
    };
  } catch (error) {
    console.error("Error processing Judge0 response:", error);
    return {
      status: {
        id: 0,
        description: "Error"
      },
      memory: 0,
      time: 0,
      stdout: null,
      stderr: "Error processing Judge0 response: " + error.message,
      compile_output: null,
      passed: false
    };
  }
};

module.exports = {
  prepareCode,
  submitToJudge0,
  processJudge0Response,
  languageIds
}; 