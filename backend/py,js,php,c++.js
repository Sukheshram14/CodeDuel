const dotenv = require("dotenv");
const axios = require("axios");
const readline = require("readline");
dotenv.config();

// Judge0 API Configuration
const RAPID_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const RAPID_API_HOST = "judge0-ce.p.rapidapi.com";
const RAPID_API_KEY = "0ce835aec9msh46bf5b3599268b2p1e5219jsnc8e666ba0469";

// Problem Set
const problems = [
  {
    id: 1,
    title: "Reverse String",
    description:
      "Write a function that takes a string and returns the reversed version of it.",
    testCases: [
      { input: '"hello"', expectedOutput: '"olleh"', isHidden: false },
      { input: '"Code Duel"', expectedOutput: '"leuD edoC"', isHidden: false },
      { input: '"racecar"', expectedOutput: '"racecar"', isHidden: true }
    ],
  },
  {
    id: 2,
    title: "Factorial",
    description:
      "Write a function that takes a number n and returns n! (n factorial).",
    testCases: [
      { input: "5", expectedOutput: "120", isHidden: false },
      { input: "3", expectedOutput: "6", isHidden: false },
      { input: "10", expectedOutput: "3628800", isHidden: true }
    ],
  },
  {
    id: 3,
    title: "Fibonacci Sequence",
    description:
      "Write a function that takes a number n and returns the nth Fibonacci number.",
    testCases: [
      { input: "5", expectedOutput: "5", isHidden: false },
      { input: "8", expectedOutput: "21", isHidden: false },
      { input: "12", expectedOutput: "144", isHidden: true }
    ],
  },
  {
    id: 4,
    title: "Anagram Check",
    description:
      "Write a function that takes two strings and returns true if they are anagrams, false otherwise.",
    testCases: [
      {
        input: '["listen", "silent"]',
        expectedOutput: "true",
        isHidden: false,
      },
      { input: '["hello", "world"]', expectedOutput: "false", isHidden: false },
      { input: '["rail safety", "fairy tales"]', expectedOutput: "true", isHidden: true }
    ],
  },
  {
    id: 5,
    title: "Array Sum",
    description:
      "Write a function that takes an array of numbers and returns the sum.",
    testCases: [
      { input: "[1, 2, 3, 4, 5]", expectedOutput: "15", isHidden: false },
      { input: "[10, -2, 30]", expectedOutput: "38", isHidden: false },
      { input: "[100, 200, 300]", expectedOutput: "600", isHidden: true }
    ],
  },
];

// Boilerplate for Python, JavaScript, and PHP (as provided)
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
    // Remove brackets and quotes using std::remove
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

// Map problem IDs to expected input types for C++
const inputTypeMapping = {
  1: "string", // Reverse String
  2: "int", // Factorial
  3: "int", // Fibonacci Sequence
  4: "vector<string>", // Anagram Check
  5: "vector<int>", // Array Sum
};

// Language IDs for Judge0
const languageIds = { python: 71, javascript: 63, php: 68, cpp: 52 };

// Create a readline interface
const rlInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Step 1: Choose a problem
console.log("\n🔹 **Available Problems:**");
problems.forEach((p) => console.log(`${p.id}. ${p.title}`));

rlInterface.question(
  "\nEnter 'random' to pick a random problem or enter a problem ID: ",
  (choice) => {
    let problem;
    if (choice.toLowerCase() === "random") {
      problem = problems[Math.floor(Math.random() * problems.length)];
    } else {
      problem = problems.find((p) => p.id === parseInt(choice));
      if (!problem) {
        console.log("❌ Invalid problem ID. Please try again.");
        rlInterface.close();
        return;
      }
    }

    console.log(`\n🔹 **Selected Problem: ${problem.title}**`);
    console.log(problem.description);

    // Step 2: Ask for Programming Language
    rlInterface.question(
      "\nEnter the programming language (JavaScript/Python/PHP/CPP): ",
      (language) => {
        language = language.toLowerCase();

        let finalBoilerplate;
        let langId = languageIds[language];
        if (!langId) {
          console.log(
            "❌ Unsupported language. Please use JavaScript, Python, PHP, or CPP."
          );
          rlInterface.close();
          return;
        }

        // For C++, select the proper boilerplate template based on the input type mapping.
        if (language === "cpp") {
          const parameterType = inputTypeMapping[problem.id] || "string";
          finalBoilerplate = cppBoilerplateTemplates[parameterType];
          if (!finalBoilerplate) {
            console.log(
              "❌ No boilerplate template for the specified input type."
            );
            rlInterface.close();
            return;
          }
        } else {
          finalBoilerplate = boilerplate[language];
        }

        // Step 3: Ask for User Function Code (multi-line input)
        console.log(
          "\n✍️  Paste your function code below and press **Ctrl+D** when done (Windows: Ctrl+Z + Enter):\n"
        );
        let userCode = "";
        rlInterface.on("line", (input) => {
          userCode += input + "\n";
        });
        rlInterface.on("close", () => {
          userCode = userCode.trim();

          // Extract function name dynamically
          const functionNameMatch = userCode.match(/(\w+)\(/);
          if (!functionNameMatch) {
            console.log(
              "❌ Invalid function format. Please follow the example."
            );
            return;
          }
          const functionName = functionNameMatch[1];

          // Format user code (ensure proper placement of includes, etc.)
          let formattedUserCode = userCode
            .replace(/#include/g, "\n#include")
            .replace(/using\s+namespace\s+std\s*;/g, "\nusing namespace std;\n")
            .trim();

          let finalCode;
          if (language === "cpp") {
            finalCode = finalBoilerplate(functionName).replace(
              "USER_FUNCTION_PLACEHOLDER",
              formattedUserCode
            );
          } else {
            finalCode = boilerplate[language]
              .replace("USER_FUNCTION_PLACEHOLDER", formattedUserCode)
              .replace(/USER_FUNCTION_NAME/g, functionName);
          }

          // For debugging, you might want to log the final code:
          // console.log("Generated Code:\n", finalCode);

          console.log("\n🚀 Running your code against test cases...\n");

          async function runTestCases() {
            for (const testCase of problem.testCases) {
              await submitTestCase(finalCode, langId, testCase, problem.title);
            }
          }
          runTestCases();
        });
      }
    );
  }
);

// Function to submit code to Judge0 API
async function submitTestCase(sourceCode, languageId, testCase, problemTitle) {
  try {
    const requestData = {
      source_code: Buffer.from(sourceCode).toString("base64"),
      language_id: languageId,
      stdin: Buffer.from(testCase.input).toString("base64"),
      expected_output: Buffer.from(testCase.expectedOutput).toString("base64"),
      base64_encoded: true,
      wait: true,
    };
    const response = await axios.post(
      `${RAPID_API_URL}/?base64_encoded=true&wait=true`,
      requestData,
      {
        headers: {
          "X-RapidAPI-Key": RAPID_API_KEY,
          "X-RapidAPI-Host": RAPID_API_HOST,
          "Content-Type": "application/json",
        },
      }
    );
    const status = response.data.status
      ? response.data.status.description
      : "Unknown";
    const actualOutput = response.data.stdout
      ? Buffer.from(response.data.stdout, "base64").toString("utf-8").trim()
      : "No output";
    const errors = response.data.stderr
      ? Buffer.from(response.data.stderr, "base64").toString("utf-8").trim()
      : "No errors";
    const compileOutput = response.data.compile_output
      ? Buffer.from(response.data.compile_output, "base64")
          .toString("utf-8")
          .trim()
      : null;
    const stderr = response.data.stderr?.trim() || "";
    const message = response.data.message || "";
    console.log(`\n📌 **Test Case:**`);
    console.log(`   🔹 **Problem:** ${problemTitle}`);
    console.log(
      `   🔹 **Input:** ${testCase.isHidden ? "<Hidden>" : testCase.input}`
    );
    console.log(
      `   ✅ **Expected Output:** ${
        testCase.isHidden ? "<Hidden>" : testCase.expectedOutput
      }`
    );
    console.log(`   📜 **Actual Output:** ${actualOutput}`);
    console.log(`   ⚠️ **Errors:** ${stderr || "No errors"}`);
    console.log(`   🏷 **Execution Status:** ${status}`);
    if (status !== "Accepted") {
      console.log("   ❌ **Result: Failed ❌**");
      if (compileOutput) {
        console.log(`   🛠 **Compilation Error:**\n${compileOutput}`);
      }
      if (stderr) {
        console.log(`   ⚠️ **Runtime Error:**\n${stderr}`);
      }
      if (message) {
        console.log(`   📢 **Message:** ${message}`);
      }
      console.log(
        "   🖥 **Full API Response:**",
        JSON.stringify(response.data, null, 2)
      );
    } else {
      console.log("   ✅ **Result: Passed ✅**");
    }
  } catch (error) {
    console.error(
      "🚨 Error submitting test case:",
      error.response?.data || error.message
    );
  }
}
