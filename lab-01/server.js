const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Student details
const studentInfo = {
  name: process.env.STUDENT_NAME || 'POTRU. SRI RAMCHARAN',
  section: process.env.STUDENT_SECTION || '214'
};

// GET / - Return a welcome message
app.get('/', (req, res) => {
  res.status(200).send('Welcome to the Node.js and Express Server API!');
});

// GET /about - Return a JSON object containing full name and section
app.get('/about', (req, res) => {
  res.status(200).json({
    name: studentInfo.name,
    section: studentInfo.section
  });
});

// GET /time - Return the current date and time dynamically using new Date()
app.get('/time', (req, res) => {
  const now = new Date();
  res.status(200).json({
    currentTime: now.toISOString(),
    formattedTime: now.toLocaleString()
  });
});

// UNKNOWN ROUTES - Return 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    error: '404 - Route Not Found'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

