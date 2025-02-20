// backend/index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.send('APICongress Backend is running!');
});

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });
