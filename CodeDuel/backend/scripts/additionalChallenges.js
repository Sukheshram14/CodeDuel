const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
require('dotenv').config();

const challenges = [
  {
    title: "Array Sum",
    description: "Write a function that takes an array of numbers and returns their sum.",
    difficulty: "easy",
    testCases: [
      { input: "[1, 2, 3, 4, 5]", expectedOutput: "15", isHidden: false },
      { input: "[-1, -2, -3]", expectedOutput: "-6", isHidden: false },
      { input: "[10, 20, 30, 40]", expectedOutput: "100", isHidden: true }
    ],
    defaultCode: {
      javascript: `function solve(input) {
  const numbers = JSON.parse(input);
  // Your code here
  return numbers.reduce((sum, num) => sum + num, 0);
}`,
      python: `def solve(input):
    numbers = eval(input)
    # Your code here
    return sum(numbers)`
    }
  },
  {
    title: "Find Maximum",
    description: "Write a function that finds the maximum number in an array.",
    difficulty: "easy",
    testCases: [
      { input: "[1, 4, 2, 7, 3]", expectedOutput: "7", isHidden: false },
      { input: "[-1, -5, -2, -8]", expectedOutput: "-1", isHidden: false },
      { input: "[100, 200, 150, 300, 250]", expectedOutput: "300", isHidden: true }
    ],
    defaultCode: {
      javascript: `function solve(input) {
  const numbers = JSON.parse(input);
  // Your code here
  return Math.max(...numbers);
}`,
      python: `def solve(input):
    numbers = eval(input)
    # Your code here
    return max(numbers)`
    }
  },
  {
    title: "Palindrome Check",
    description: "Write a function that checks if a string is a palindrome (reads the same forwards and backwards).",
    difficulty: "medium",
    testCases: [
      { input: "\"racecar\"", expectedOutput: "true", isHidden: false },
      { input: "\"hello\"", expectedOutput: "false", isHidden: false },
      { input: "\"A man a plan a canal Panama\"", expectedOutput: "true", isHidden: true }
    ],
    defaultCode: {
      javascript: `function solve(input) {
  const str = JSON.parse(input).toLowerCase().replace(/[^a-z0-9]/g, '');
  // Your code here
  return str === str.split('').reverse().join('');
}`,
      python: `def solve(input):
    s = eval(input).lower()
    # Remove non-alphanumeric characters
    s = ''.join(c for c in s if c.isalnum())
    # Your code here
    return s == s[::-1]`
    }
  },
  {
    title: "Two Sum",
    description: "Given an array of integers and a target sum, return indices of the two numbers that add up to the target.",
    difficulty: "medium",
    testCases: [
      { input: "[[2, 7, 11, 15], 9]", expectedOutput: "[0, 1]", isHidden: false },
      { input: "[[3, 2, 4], 6]", expectedOutput: "[1, 2]", isHidden: false },
      { input: "[[1, 5, 8, 3, 9, 2], 11]", expectedOutput: "[2, 4]", isHidden: true }
    ],
    defaultCode: {
      javascript: `function solve(input) {
  const [numbers, target] = JSON.parse(input);
  // Your code here
  const map = new Map();
  for (let i = 0; i < numbers.length; i++) {
    const complement = target - numbers[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(numbers[i], i);
  }
  return [];
}`,
      python: `def solve(input):
    numbers, target = eval(input)
    # Your code here
    seen = {}
    for i, num in enumerate(numbers):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`
    }
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Clear existing challenges
      await Challenge.deleteMany({});
      console.log('Cleared existing challenges');
      
      // Insert new challenges
      await Challenge.insertMany(challenges);
      console.log('Added new challenges:', challenges.length);
      
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }); 