import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

const CodeEditorWindow = ({ onChange, language, code, theme }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [notification, setNotification] = useState("");
  
  const handleEditorChange = (value) => {
    onChange(value);
  };
  
  const showNotification = (message) => {
    setNotification(message);
    // Clear notification after 2 seconds
    setTimeout(() => {
      setNotification("");
    }, 2000);
  };
  
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Use supported ways to disable clipboard operations
    // Override standard keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      console.log('Copy disabled in competition mode');
      showNotification("Copying is disabled during competition");
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      console.log('Paste disabled in competition mode');
      showNotification("Pasting is disabled during competition");
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
      console.log('Cut disabled in competition mode');
      showNotification("Cutting is disabled during competition");
    });
    
    // Disable context menu
    editor.onContextMenu((e) => {
      e.event.preventDefault();
      e.event.stopPropagation();
      showNotification("Right-click menu is disabled during competition");
    });
  };
  
  // Add additional event listeners to the container
  useEffect(() => {
    // Get the editor DOM element once the ref is available
    if (!containerRef.current) return;
    
    const containerElement = containerRef.current;
    
    const handleClipboardEvent = (e) => {
      if (containerElement.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        const operation = e.type === 'copy' ? 'Copying' : e.type === 'paste' ? 'Pasting' : 'Cutting';
        showNotification(`${operation} is disabled during competition`);
        console.log(`${e.type} operation prevented in editor`);
      }
    };
    
    const handleKeyDown = (e) => {
      // Only prevent within the editor container
      if (!containerElement.contains(e.target)) return;
      
      // Prevent paste (Ctrl+V or Cmd+V)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        e.stopPropagation();
        showNotification("Pasting is disabled during competition");
        console.log('Paste prevented in editor');
      }
      
      // Prevent copy (Ctrl+C or Cmd+C)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        showNotification("Copying is disabled during competition");
        console.log('Copy prevented in editor');
      }
      
      // Prevent cut (Ctrl+X or Cmd+X)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        e.stopPropagation();
        showNotification("Cutting is disabled during competition");
        console.log('Cut prevented in editor');
      }
    };
    
    // Prevent right-click context menu only within the editor
    const handleContextMenu = (e) => {
      if (containerElement.contains(e.target)) {
        e.preventDefault();
        showNotification("Right-click menu is disabled during competition");
        return false;
      }
    };
    
    // Add clipboard event listeners
    document.addEventListener('copy', handleClipboardEvent);
    document.addEventListener('paste', handleClipboardEvent);
    document.addEventListener('cut', handleClipboardEvent);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('copy', handleClipboardEvent);
      document.removeEventListener('paste', handleClipboardEvent);
      document.removeEventListener('cut', handleClipboardEvent);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="overlay rounded-md w-full h-full shadow-4xl" ref={containerRef}>
      <div className="bg-yellow-800 text-white px-4 py-2 text-sm">
        <span className="font-bold">⚠️ Anti-Cheating Mode:</span> Copy and paste functionality has been disabled during competition.
      </div>
      
      {notification && (
        <div className="absolute z-50 top-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 opacity-90">
          {notification}
        </div>
      )}
      
      <Editor
        height="85vh"
        width="100%"
        language={language || "javascript"}
        value={code}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
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
          padding: { top: 10, bottom: 10 },
          contextmenu: false, // Disable built-in context menu
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: false
          },
          // Disable clipboard operations through editor options
          selectOnLineNumbers: true,
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          clipboard: {
            copyWithSyntaxHighlighting: false
          }
        }}
      />
    </div>
  );
};

export default CodeEditorWindow; 