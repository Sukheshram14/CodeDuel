import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditorWindow = ({ onChange, language, code, theme }) => {
  const handleEditorChange = (value) => {
    onChange(value);
  };

  return (   
    <div className="overlay rounded-md overflow-hidden w-full h-full shadow-4xl">
      <Editor
        height="85vh"
        width={`100%`}
        language={language || "javascript"}
        value={code}
        theme={theme}
        defaultValue="// Write your code here"
        onChange={handleEditorChange}
        options={{
          minimap: {
            enabled: false,
          },
          fontSize: 16,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          scrollBeyondLastLine: false,
          lineNumbers: "on",
        }}
      />
    </div>
  );
};

export default CodeEditorWindow; 