export const languageOptions = [
  {
    id: 63,
    name: "JavaScript (Node.js 12.14.0)",
    label: "JavaScript",
    value: "javascript",
    defaultTemplate: `// Write a program to print "Hello, World!"
// Your code here:

function main() {
    console.log("Hello, World!")
}

main();`
  },
  {
    id: 71,
    name: "Python (3.8.1)",
    label: "Python",
    value: "python",
    defaultTemplate: `# Write a program to print "Hello, World!"
# Your code here:

def main():
   print("Hello, World!")

if __name__ == "__main__":
    
    main()`
  },
  {
    id: 68,
    name: "PHP (7.4.1)",
    label: "PHP",
    value: "php",
    defaultTemplate: `<?php
// Write a program to print "Hello, World!"
// Your code here:

function main() {
    echo "Hello, World!";
}

main();
?>`
  },
  {
    id: 52,
    name: "C++ (GCC 9.2.0)",
    label: "C++",
    value: "cpp",
    defaultTemplate: `#include <iostream>
using namespace std;

// Write a program to print "Hello, World!"
// Your code here:

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`
  }
]; 