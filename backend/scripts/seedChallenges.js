const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
require('dotenv').config();

const challenges = [
  {
    title: "Hello World",
    description: "Write a program that prints 'Hello, World!' to the console.",
    difficulty: "easy",
    inputType: "string",
    testCases: [
      {
        input: "",
        expectedOutput: "Hello, World!",
        isHidden: false
      },
      {
        input: "",
        expectedOutput: "Hello, World!",
        isHidden: true
      }
    ],
    defaultCode: {
      javascript: `// Write a program to print "Hello, World!"
// Your code here:

function main() {
    console.log("Hello, World!");
}

main();`,
      python: `# Write a program to print "Hello, World!"
# Your code here:

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
      php: `<?php
// Write a program to print "Hello, World!"
// Your code here:

function main() {
    echo "Hello, World!";
}

main();
?>`,
      cpp: `// Write a program to print "Hello, World!"
// Your code here:

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`
    }
  },
  {
    title: "Reverse String",
    description: "Write a function that takes a string and returns the reversed version of it.",
    difficulty: "easy",
    inputType: "string",
    testCases: [
      { 
        input: '"hello"', 
        expectedOutput: '"olleh"', 
        isHidden: false 
      },
      { 
        input: '"Code Duel"', 
        expectedOutput: '"leuD edoC"', 
        isHidden: false 
      },
      { 
        input: '"racecar"', 
        expectedOutput: '"racecar"', 
        isHidden: true 
      }
    ],
    defaultCode: {
      javascript: `// Write a function that reverses a string
// Example: reverseString("hello") returns "olleh"

function reverseString(s) {
    // Your code here
}`,
      python: `# Write a function that reverses a string
# Example: reverseString("hello") returns "olleh"

def reverseString(s):
    # Your code here
    pass`,
      php: `<?php
// Write a function that reverses a string
// Example: reverseString("hello") returns "olleh"

function reverseString($s) {
    // Your code here
}
?>`,
      cpp: `// Write a function that reverses a string
// Example: reverseString("hello") returns "olleh"

#include <string>
using namespace std;

string reverseString(string s) {
    // Your code here
}`
    }
  },
  {
    title: "Factorial",
    description: "Write a function that takes a number n and returns n! (n factorial).",
    difficulty: "easy",
    inputType: "number",
    testCases: [
      { 
        input: "5", 
        expectedOutput: "120", 
        isHidden: false 
      },
      { 
        input: "3", 
        expectedOutput: "6", 
        isHidden: false 
      },
      { 
        input: "10", 
        expectedOutput: "3628800", 
        isHidden: true 
      }
    ],
    defaultCode: {
      javascript: `// Write a function that calculates factorial
// Example: factorial(5) returns 120

function factorial(n) {
    // Your code here
}`,
      python: `# Write a function that calculates factorial
# Example: factorial(5) returns 120

def factorial(n):
    # Your code here
    pass`,
      php: `<?php
// Write a function that calculates factorial
// Example: factorial(5) returns 120

function factorial($n) {
    // Your code here
}
?>`,
      cpp: `// Write a function that calculates factorial
// Example: factorial(5) returns 120

int factorial(int n) {
    // Your code here
}`
    }
  },
  {
    title: "Fibonacci Sequence",
    description: "Write a function that takes a number n and returns the nth Fibonacci number.",
    difficulty: "medium",
    inputType: "number",
    testCases: [
      { 
        input: "5", 
        expectedOutput: "5", 
        isHidden: false 
      },
      { 
        input: "8", 
        expectedOutput: "21", 
        isHidden: false 
      },
      { 
        input: "12", 
        expectedOutput: "144", 
        isHidden: true 
      }
    ],
    defaultCode: {
      javascript: `// Write a function that returns the nth Fibonacci number
// Example: fibonacci(5) returns 5

function fibonacci(n) {
    // Your code here
}`,
      python: `# Write a function that returns the nth Fibonacci number
# Example: fibonacci(5) returns 5

def fibonacci(n):
    // Your code here
    pass`,
      php: `<?php
// Write a function that returns the nth Fibonacci number
// Example: fibonacci(5) returns 5

function fibonacci($n) {
    // Your code here
}
?>`,
      cpp: `// Write a function that returns the nth Fibonacci number
// Example: fibonacci(5) returns 5

int fibonacci(int n) {
    // Your code here
}`
    }
  },
  {
    title: "Anagram Check",
    description: "Write a function that takes two strings and returns true if they are anagrams, false otherwise.",
    difficulty: "medium",
    inputType: "array-string",
    testCases: [
      {
        input: '["listen", "silent"]',
        expectedOutput: "true",
        isHidden: false,
      },
      { 
        input: '["hello", "world"]', 
        expectedOutput: "false", 
        isHidden: false 
      },
      { 
        input: '["rail safety", "fairy tales"]', 
        expectedOutput: "true", 
        isHidden: true 
      }
    ],
    defaultCode: {
      javascript: `// Write a function that checks if two strings are anagrams
// Example: anagramCheck("listen", "silent") returns true

function anagramCheck(s1, s2) {
    // Your code here
}`,
      python: `# Write a function that checks if two strings are anagrams
# Example: anagramCheck("listen", "silent") returns True

def anagramCheck(s1, s2):
    // Your code here
    pass`,
      php: `<?php
// Write a function that checks if two strings are anagrams
// Example: anagramCheck("listen", "silent") returns true

function anagramCheck($s1, $s2) {
    // Your code here
}
?>`,
      cpp: `// Write a function that checks if two strings are anagrams
// Example: anagramCheck("listen", "silent") returns true

#include <string>
using namespace std;

bool anagramCheck(string s1, string s2) {
    // Your code here
}`
    }
  },
  {
    title: "Array Sum",
    description: "Write a function that takes an array of numbers and returns the sum.",
    difficulty: "easy",
    inputType: "array-number",
    testCases: [
      { 
        input: "[1, 2, 3, 4, 5]", 
        expectedOutput: "15", 
        isHidden: false 
      },
      { 
        input: "[10, -2, 30]", 
        expectedOutput: "38", 
        isHidden: false 
      },
      { 
        input: "[100, 200, 300]", 
        expectedOutput: "600", 
        isHidden: true 
      }
    ],
    defaultCode: {
      javascript: `// Write a function that sums an array of numbers
// Example: arraySum([1, 2, 3, 4, 5]) returns 15

function arraySum(arr) {
    // Your code here
}`,
      python: `# Write a function that sums an array of numbers
# Example: arraySum([1, 2, 3, 4, 5]) returns 15

def arraySum(arr):
    // Your code here
    pass`,
      php: `<?php
// Write a function that sums an array of numbers
// Example: arraySum([1, 2, 3, 4, 5]) returns 15

function arraySum($arr) {
    // Your code here
}
?>`,
      cpp: `// Write a function that sums an array of numbers
// Example: arraySum([1, 2, 3, 4, 5]) returns 15

#include <vector>
using namespace std;

int arraySum(vector<int> arr) {
    // Your code here
}`
    }
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await Challenge.deleteMany({});
    await Challenge.insertMany(challenges);
    console.log('Challenges seeded successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error seeding challenges:', err);
    process.exit(1);
  }); 