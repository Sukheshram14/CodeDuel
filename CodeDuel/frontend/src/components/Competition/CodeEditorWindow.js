import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditorWindow = ({ onChange, language, code, theme }) => {
  const handleEditorChange = (value) => {
    onChange(value);
  };

  return (
    <div className="overlay rounded-md w-full h-full shadow-4xl">
      <Editor
        height="85vh"
        width="100%"
        language={language || "javascript"}
        value={code}
        theme={theme}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 16,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          formatOnType: false,
          formatOnPaste: false,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          padding: { top: 10, bottom: 10 }
        }}
      />
    </div>
  );
};

export default CodeEditorWindow; 