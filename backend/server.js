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
 * Generate mock responses when API keys are not available
 * @param {string} model - The AI model that was requested
 * @param {string} party - The political party perspective
 * @param {string} topic - The debate topic
 * @returns {string} - A mock response
 */
function getMockResponse(model, party, topic) {
  console.log(`[MOCK MODE] Generating mock response for ${model}, ${party} viewpoint on ${topic}`);
  
  // Base responses by party
  const responses = {
    Republican: `From a Republican perspective, ${topic} should be addressed through free-market solutions, individual liberty, and limited government intervention. Citizens and businesses, not government bureaucracy, will drive the most effective and sustainable solutions through innovation and personal responsibility.`,
    
    Democrat: `From a Democratic viewpoint, ${topic} requires thoughtful government action to ensure equity and opportunity for all Americans. We support policies that protect vulnerable communities, expand access to essential services, and promote collective solutions to shared challenges through smart regulation and strategic public investments.`,
    
    Independent: `Taking an Independent stance on ${topic} means looking beyond partisan divides to find practical, evidence-based solutions. This issue requires balancing personal freedoms with community needs, considering long-term impacts over short-term political wins, and incorporating diverse perspectives to reach sensible compromises.`
  };
  
  // Model-specific variations (each model has slight stylistic differences)
  const modelStyle = {
    OpenAI: (text) => text, // Base style
    ChatGPT: (text) => text, // Same as OpenAI
    Claude: (text) => text.replace(/we support/gi, "I believe in").replace(/Republicans|Democrats/g, match => `${match} typically`),
    Cohere: (text) => text.replace(/\./g, ". ").trim(), // Add extra space after periods
    Gemini: (text) => `Here's a perspective: ${text}`,
    Grok: (text) => text + " This approach balances pragmatism with our core principles."
  };
  
  // Get base response and apply model-specific style
  const baseResponse = responses[party] || `Discussing ${topic} from a ${party} perspective requires careful consideration of various factors.`;
  const styleFunc = modelStyle[model] || ((text) => text);
  
  return styleFunc(baseResponse);
}

/**
 * Dynamically import node-fetch to work with ES Modules in a CommonJS context.
 */
async function myFetch(...args) {
  try {
    const { default: fetch } = await import('node-fetch');
    return fetch(...args);
  } catch (error) {
    console.error('[FETCH ERROR]', {
      message: 'Failed to import node-fetch',
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to import node-fetch: ${error.message}`);
  }
}

/**
 * Call the appropriate LLM API based on the model parameter.
 * Prompt: "In one short paragraph, argue for the {party} viewpoint on the topic of "{topic}""
 */
async function callLLM(model, party, topic) {
  const prompt = `In one short paragraph, argue for the ${party} viewpoint on the topic of "${topic}".`;
  
  // Log request attempt
  console.log(`[LLM REQUEST]`, {
    timestamp: new Date().toISOString(),
    model,
    party,
    topic,
    promptLength: prompt.length
  });
  
  // Check for required API key
  let apiKeyName;
  switch (model) {
    case 'OpenAI':
    case 'ChatGPT':
      apiKeyName = 'OPENAI_API_KEY';
      break;
    case 'Claude':
      apiKeyName = 'CLAUDE_API_KEY';
      break;
    case 'Cohere':
      apiKeyName = 'COHERE_API_KEY';
      break;
    case 'Gemini':
      apiKeyName = 'GEMINI_API_KEY';
      break;
    case 'Grok':
      apiKeyName = 'GROK_API_KEY';
      break;
    default:
      apiKeyName = null;
  }
  
  // If API key is missing, use mock response
  if (apiKeyName && !process.env[apiKeyName]) {
    console.log(`[MOCK MODE] API key for ${model} is missing (${apiKeyName}), using mock response`);
    return getMockResponse(model, party, topic);
  }
  
  // Set a timeout for all API calls (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    let result;
    
    switch (model) {
      case 'OpenAI':
      case 'ChatGPT': {
        // Using chat completions API (gpt-3.5-turbo) instead of deprecated text-davinci-003
        console.log(`[OPENAI REQUEST] Calling OpenAI chat completions API`);
        
        const requestBody = {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a political analyst who can present arguments from different political perspectives." },
            { role: "user", content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.7
        };
        
        const response = await myFetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`[OPENAI ERROR] Status ${response.status}:`, errorData);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          result = data.choices[0].message.content.trim();
        } else {
          console.error(`[OPENAI ERROR] Unexpected response structure:`, data);
          throw new Error("No completion returned from OpenAI.");
        }
        break;
      }
      
      case 'Claude': {
        // Using Claude's current API format (v1/messages)
        console.log(`[CLAUDE REQUEST] Calling Anthropic Claude API`);
        
        const requestBody = {
          model: "claude-3-haiku-20240307",
          max_tokens: 150,
          messages: [
            { role: "user", content: prompt }
          ]
        };
        
        const response = await myFetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`[CLAUDE ERROR] Status ${response.status}:`, errorData);
          throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.content && data.content.length > 0 && data.content[0].text) {
          result = data.content[0].text.trim();
        } else {
          console.error(`[CLAUDE ERROR] Unexpected response structure:`, data);
          throw new Error("No completion returned from Claude.");
        }
        break;
      }
      
      case 'Cohere': {
        // Updated Cohere API implementation
        console.log(`[COHERE REQUEST] Calling Cohere API`);
        
        const requestBody = {
          model: "command-r-plus",
          messages: [
            { role: "user", content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.7
        };
        
        const response = await myFetch("https://api.cohere.ai/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.COHERE_API_KEY}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`[COHERE ERROR] Status ${response.status}:`, errorData);
          throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.text) {
          result = data.text.trim();
        } else {
          console.error(`[COHERE ERROR] Unexpected response structure:`, data);
          throw new Error("No completion returned from Cohere.");
        }
        break;
      }
      
      case 'Grok': {
        // Updated Grok API implementation
        console.log(`[GROK REQUEST] Calling xAI Grok API`);
        
        const requestBody = {
          model: "grok-2-latest", 
          messages: [
            { 
              role: "system", 
              content: "You are a political analyst who can present arguments from different political perspectives."
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
          stream: false
        };
        
        const response = await myFetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROK_API_KEY}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`[GROK ERROR] Status ${response.status}:`, errorData);
          throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          result = data.choices[0].message.content.trim();
        } else {
          console.error(`[GROK ERROR] Unexpected response structure:`, data);
          throw new Error("No completion returned from Grok.");
        }
        break;
      }
      
      case 'Gemini': {
        // Updated Gemini API implementation
        console.log(`[GEMINI REQUEST] Calling Google Gemini API`);
        
        const requestBody = {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7
          }
        };
        
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await myFetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          }
        );
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`[GEMINI ERROR] Status ${response.status}:`, errorData);
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && 
            data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
          result = data.candidates[0].content.parts[0].text.trim();
        } else {
          console.error(`[GEMINI ERROR] Unexpected response structure:`, data);
          throw new Error("No completion returned from Gemini.");
        }
        break;
      }
      
      default: {
        console.error(`[MODEL ERROR] Unsupported model requested:`, { model });
        throw new Error(`Model ${model} is not supported.`);
      }
    }
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Log successful result
    console.log(`[LLM SUCCESS]`, {
      model, 
      resultLength: result.length,
      resultPreview: result.substring(0, 50) + (result.length > 50 ? '...' : '')
    });
    
    return result;
    
  } catch (error) {
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Comprehensive error handling
    const errorInfo = {
      message: error.message,
      model,
      party,
      topic,
      timestamp: new Date().toISOString(),
    };
    
    // Add additional info based on error type
    if (error.name === 'AbortError') {
      errorInfo.reason = 'API request timed out after 30 seconds';
      console.error(`[TIMEOUT ERROR]`, errorInfo);
      throw new Error(`${model} API request timed out after 30 seconds`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorInfo.code = error.code;
      errorInfo.reason = 'Network connection error';
      console.error(`[NETWORK ERROR]`, errorInfo);
      throw new Error(`Network error connecting to ${model} API: ${error.message}`);
    } else {
      errorInfo.stack = error.stack;
      console.error(`[LLM ERROR]`, errorInfo);
      throw error; // Re-throw the original error
    }
  }
}

// API endpoint to call an LLM with the given parameters
app.get('/api/llm', async (req, res) => {
  const startTime = Date.now();
  const { model, party, topic } = req.query;
  
  // Log incoming request
  console.log(`[API REQUEST] /api/llm`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    model,
    party, 
    topic,
    userAgent: req.get('User-Agent')
  });
  
  // Validate request parameters
  if (!model || !party || !topic) {
    const missingParams = [];
    if (!model) missingParams.push('model');
    if (!party) missingParams.push('party');
    if (!topic) missingParams.push('topic');
    
    console.error(`[VALIDATION ERROR] Missing parameters:`, {
      missingParams,
      request: req.query
    });
    
    return res.status(400).json({ 
      error: "Missing required query parameters", 
      missingParams 
    });
  }
  
  // Validate party parameter
  const validParties = ['Republican', 'Democrat', 'Independent'];
  if (!validParties.includes(party)) {
    console.error(`[VALIDATION ERROR] Invalid party:`, {
      party,
      validOptions: validParties
    });
    
    return res.status(400).json({ 
      error: "Invalid party parameter", 
      message: `Party must be one of: ${validParties.join(', ')}`,
      providedValue: party
    });
  }
  
  try {
    // Call the LLM
    const result = await callLLM(model, party, topic);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log successful response
    console.log(`[API SUCCESS] /api/llm responded in ${responseTime}ms`, {
      model,
      party,
      topic,
      responseLength: result.length
    });
    
    res.json({ 
      model, 
      response: result,
      party,
      topic,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Calculate response time even for errors
    const responseTime = Date.now() - startTime;
    
    console.error(`[API ERROR] /api/llm failed after ${responseTime}ms:`, {
      model,
      party,
      topic,
      error: error.message,
      stack: error.stack
    });
    
    // Create a user-friendly error message
    let userMessage = "Error calling AI model";
    let statusCode = 500;
    
    // Categorize errors for better user feedback
    if (error.message.includes('API key')) {
      userMessage = `Authentication error with ${model}`;
      statusCode = 401;
    } else if (error.message.includes('timed out')) {
      userMessage = `Request to ${model} timed out`;
      statusCode = 504;
    } else if (error.message.includes('Network error')) {
      userMessage = `Could not connect to ${model} service`;
      statusCode = 503;
    } else if (error.message.includes('not supported')) {
      userMessage = `${model} is not currently supported`;
      statusCode = 400;
    }
    
    // Provide informative error response
    res.status(statusCode).json({ 
      error: userMessage,
      model,
      errorType: statusCode === 500 ? 'SERVER_ERROR' : 
                 statusCode === 401 ? 'AUTH_ERROR' : 
                 statusCode === 504 ? 'TIMEOUT_ERROR' : 
                 statusCode === 503 ? 'CONNECTION_ERROR' : 'BAD_REQUEST',
      // Don't expose internal error details to client except in development
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Utility endpoint to check API status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    supportedModels: ['OpenAI', 'ChatGPT', 'Claude', 'Cohere', 'Gemini', 'Grok']
  });
});

// Catch-all route: serve index.html for any other route (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log available API keys (without exposing the actual keys)
  const availableAPIs = {
    'OpenAI': !!process.env.OPENAI_API_KEY,
    'Claude': !!process.env.CLAUDE_API_KEY,
    'Cohere': !!process.env.COHERE_API_KEY,
    'Gemini': !!process.env.GEMINI_API_KEY,
    'Grok': !!process.env.GROK_API_KEY
  };
  
  console.log('Available API configurations:', availableAPIs);
});