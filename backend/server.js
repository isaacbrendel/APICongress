const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the "public" folder (React build)
app.use(express.static(path.join(__dirname, 'public')));

const mockLLMResponses = {
  OpenAI: "Hello, I am ChatGPT powered by OpenAI!",
  Claude: "Hi, I'm Claude from Anthropic!",
  Cohere: "Greetings from Cohere's language model!",
  Grok: "Hello, I'm Grok from xAI!",
  Gemini: "Hey there, I'm Gemini from Google!",
};

// API endpoint to test LLM calls
app.get('/api/llm', (req, res) => {
  const model = req.query.model;
  const response = mockLLMResponses[model] || mockLLMResponses.OpenAI;
  res.json({ model: model, response });
});

// Catch-all route: serve index.html for any other route (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
