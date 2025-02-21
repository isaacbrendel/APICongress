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
 * Dynamically import node-fetch to work with ES Modules in a CommonJS context.
 */
async function myFetch(...args) {
  const { default: fetch } = await import('node-fetch');
  return fetch(...args);
}

/**
 * Call the appropriate LLM API based on the model parameter.
 * Prompt: "In one short paragraph, argue for the {party} viewpoint on the topic of "{topic}""
 */
async function callLLM(model, party, topic) {
  const prompt = `In one short paragraph, argue for the ${party} viewpoint on the topic of "${topic}".`;
  switch (model) {
    case 'OpenAI':
    case 'ChatGPT': {
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
      const response = await myFetch("https://api.anthropic.com/v1/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.CLAUDE_API_KEY
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens_to_sample: 150,
          model: "claude-v1"
        })
      });
      const data = await response.json();
      if (data.completion) {
        return data.completion.trim();
      } else {
        throw new Error("No completion returned from Claude.");
      }
    }
    case 'Cohere': {
      const response = await myFetch("https://api.cohere.ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.COHERE_API_KEY}`
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 150,
          temperature: 0.7,
          model: "command-xlarge-nightly"
        })
      });
      const data = await response.json();
      if (data.generations && data.generations.length > 0) {
        return data.generations[0].text.trim();
      } else {
        throw new Error("No completion returned from Cohere.");
      }
    }
    case 'Grok': {
      const response = await myFetch("https://api.grok.ai/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 150,
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (data.completion) {
        return data.completion.trim();
      } else {
        throw new Error("No completion returned from Grok.");
      }
    }
    case 'Gemini': {
      const response = await myFetch("https://api.gemini.ai/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 150,
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (data.completion) {
        return data.completion.trim();
      } else {
        throw new Error("No completion returned from Gemini.");
      }
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
    res.json({ model, response: result });
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
