const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the "public" folder (React build)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Dynamically import node-fetch so we can use it in a CommonJS module.
 */
async function myFetch(...args) {
  const { default: fetch } = await import('node-fetch');
  return fetch(...args);
}

/**
 * Call the appropriate LLM API based on the model parameter.
 * Uses a prompt: "In one short paragraph, argue for the {party} viewpoint on the topic of "{topic}""
 */
async function callLLM(model, party, topic) {
  const prompt = `In one short paragraph, argue for the ${party} viewpoint on the topic of "${topic}".`;
  switch (model) {
    case 'OpenAI': {
      // Call OpenAI API (example using text-davinci-003)
      const response = await myFetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "text-davinci-003",
          prompt: prompt,
          max_tokens: 150,
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].text.trim();
      } else {
        throw new Error("No completion returned from OpenAI.");
      }
    }
    case 'Claude': {
      // Simulated response for Claude – replace with actual API call if available
      return `Simulated Claude response: ${prompt}`;
    }
    case 'Cohere': {
      // Simulated response for Cohere
      return `Simulated Cohere response: ${prompt}`;
    }
    case 'Grok': {
      // Simulated response for Grok
      return `Simulated Grok response: ${prompt}`;
    }
    case 'Gemini': {
      // Simulated response for Gemini
      return `Simulated Gemini response: ${prompt}`;
    }
    default:
      throw new Error(`Model ${model} is not supported.`);
  }
}

// API endpoint to call an LLM with the given parameters
app.get('/api/llm', async (req, res) => {
  const { model, party, topic } = req.query;
  if (!model || !party || !topic) {
    return res.status(400).json({ error: "Missing required query parameters: model, party, topic" });
  }
  try {
    const result = await callLLM(model, party, topic);
    res.json({ model: model, response: result });
  } catch (error) {
    console.error("Error calling LLM:", error);
    res.status(500).json({ error: "Error calling model" });
  }
});

// Catch-all route: serve index.html for any other route (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
