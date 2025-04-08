import React from "react";

const OutputDetails = ({ outputDetails }) => {
  if (!outputDetails) return null;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="bg-gray-700 px-4 py-2 rounded-t-xl border-b border-gray-600">
        <h3 className="text-white font-medium">Execution Details</h3>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-white">
          Status: <span className={`font-semibold ${
            outputDetails.status.id === 3 ? 'text-green-400' : 'text-red-400'
          }`}>
            {outputDetails.status.description}
          </span>
        </p>
        {outputDetails.memory && (
          <p className="text-white">
            Memory: <span className="font-semibold">{outputDetails.memory} KB</span>
          </p>
        )}
        {outputDetails.time && (
          <p className="text-white">
            Time: <span className="font-semibold">{outputDetails.time} s</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default OutputDetails; 