import React from "react";

const OutputWindow = ({ outputDetails }) => {
  const getOutput = () => {
    if (!outputDetails) return '';
    
    if (outputDetails.status?.id !== 3) {
      // Show compilation errors or runtime errors
      if (outputDetails.compile_output) {
        return outputDetails.compile_output;
      }
      if (outputDetails.stderr) {
        return outputDetails.stderr;
      }
      return outputDetails.message || 'Error: Unknown error occurred';
    }

    // Show program output
    return outputDetails.stdout || '';
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="bg-gray-700 px-4 py-2 rounded-t-xl border-b border-gray-600">
        <h3 className="text-white font-medium">Output</h3>
      </div>
      <div className="p-4">
        <pre className="text-white font-mono whitespace-pre-wrap">
          {getOutput()}
        </pre>
      </div>
    </div>
  );
};

export default OutputWindow; 