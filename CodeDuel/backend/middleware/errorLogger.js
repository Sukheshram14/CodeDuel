const fs = require('fs');
const path = require('path');

const logError = (error, req) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    error: {
      message: error.message,
      stack: error.stack
    },
    headers: req.headers,
    ip: req.ip
  };

  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logFile = path.join(logDir, `${timestamp.split('T')[0]}.log`);
  fs.appendFileSync(
    logFile,
    JSON.stringify(logEntry, null, 2) + '\n---\n'
  );

  console.error('Error logged:', {
    timestamp,
    path: req.path,
    method: req.method,
    error: error.message
  });
};

module.exports = (err, req, res, next) => {
  logError(err, req);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}; 