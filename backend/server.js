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
 * Generate mock responses that are brief and character-driven
 * @param {string} model - The AI model that was requested
 * @param {string} party - The political party perspective
 * @param {string} topic - The debate topic
 * @param {Array} context - Previous debate messages
 * @returns {string} - A mock response
 */
function getMockResponse(model, party, topic, context = []) {
  console.log(`[MOCK MODE] Generating mock response for ${model}, ${party} viewpoint on ${topic}`);
  
  // Sample brief, punchy responses by party and topic
  const responsesByPartyAndTopic = {
    Republican: {
      // Gun control
      'gun control': [
        "Guns don't kill people. People kill people. Protect the Second Amendment!",
        "Law-abiding citizens need protection. More guns, less crime!",
        "Our founding fathers knew tyranny. That's why we have the Second Amendment."
      ],
      'taxes': [
        "Lower taxes mean more jobs. Government isn't the solution to our problems.",
        "Your money belongs in your pocket, not Washington's!",
        "Cut taxes. Cut spending. Let the free market thrive!"
      ],
      'healthcare': [
        "Free market healthcare drives innovation. Government plans destroy quality.",
        "We need choice in healthcare, not government mandates!",
        "Private insurance creates competition. Single-payer kills innovation."
      ],
      'immigration': [
        "Secure our borders first! Legal immigration, yes. Illegal? Absolutely not.",
        "A nation without borders isn't a nation at all!",
        "We welcome legal immigrants. But our laws must be respected!"
      ],
      'climate': [
        "Climate regulations kill jobs. Innovation, not regulation, is the answer!",
        "American energy independence first! We won't sacrifice our economy.",
        "Let's not destroy our economy for unproven climate theories."
      ]
    },
    Democrat: {
      // Gun control
      'gun control': [
        "Background checks save lives. Why oppose common-sense gun safety?",
        "No one needs assault weapons for hunting. Children need protection from guns!",
        "Gun violence is preventable. We need action, not thoughts and prayers."
      ],
      'taxes': [
        "The wealthy must pay their fair share! Our infrastructure demands investment.",
        "Tax cuts for billionaires? We need to invest in working families!",
        "Corporate tax breaks don't trickle down. They flood offshore accounts!"
      ],
      'healthcare': [
        "Healthcare is a right, not a privilege for the wealthy!",
        "No one should go bankrupt from medical bills. Medicare for All!",
        "Insurance companies shouldn't decide who lives and who dies!"
      ],
      'immigration': [
        "Dreamers belong here. Immigration makes America stronger!",
        "Separating families is cruel and un-American. We can do better!",
        "We need comprehensive immigration reform, not walls and cages!"
      ],
      'climate': [
        "Climate change is an existential threat. We need action now!",
        "Green jobs are the future. Let's lead the clean energy revolution!",
        "Our planet is burning. Science demands we act on climate change!"
      ]
    },
    Independent: {
      // Gun control
      'gun control': [
        "Both gun rights AND safety measures can coexist. Stop the false choice!",
        "Responsible gun ownership with practical safeguards. It's not either-or.",
        "Mental health resources AND background checks. Let's find common ground."
      ],
      'taxes': [
        "Smart taxation balances growth with essential services. Both extremes fail us.",
        "Neither tax-and-spend nor trickle-down works. We need practical solutions.",
        "Fair taxes and responsible spending. Neither party has it right."
      ],
      'healthcare': [
        "Let's take the best healthcare ideas from both sides. Ideology helps no one.",
        "Public options AND private insurance can coexist. Stop the all-or-nothing debate!",
        "Universal coverage with choice is possible. Let's be pragmatic."
      ],
      'immigration': [
        "Border security AND humane policies. We don't need to choose!",
        "Both parties use immigration as a wedge issue. Americans deserve solutions.",
        "Strong borders with fair, efficient legal pathways. It's not complicated."
      ],
      'climate': [
        "Market-based climate solutions work. Carbon pricing, not endless regulations.",
        "Both denial and alarmism are wrong. Let's take practical climate action.",
        "Clean energy innovation creates jobs AND protects our planet."
      ]
    }
  };
  
  // Generic brief responses by party (for topics not specifically covered)
  const genericBriefResponses = {
    Republican: [
      "Freedom works. Government doesn't. Keep Washington out of our lives!",
      "Free markets. Strong military. Traditional values. That's what works!",
      "Cut regulations. Cut taxes. Let Americans build their dreams!",
      "Individual liberty, not big government! The Constitution is clear.",
      "America first! We won't apologize for our exceptional nation!"
    ],
    Democrat: [
      "People over profits! The economy should work for everyone.",
      "Progress requires investment. We can't cut our way to prosperity!",
      "Diversity makes us stronger. Inclusion isn't optional!",
      "Government can solve problems. We're all in this together!",
      "Equal rights and justice for all. No exceptions, no compromises!"
    ],
    Independent: [
      "Both parties fail America. We need practical solutions, not ideology!",
      "Get past partisan politics. Solutions lie in the sensible center.",
      "Extremism solves nothing. Compromise isn't weakness—it's wisdom.",
      "End the partisan warfare. Americans deserve better than this gridlock!",
      "Common ground exists. Let's focus on results, not rhetoric."
    ]
  };
  
  // Find topic category by looking for keywords
  let topicCategory = 'general';
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('gun') || topicLower.includes('firearm') || topicLower.includes('weapon') || topicLower.includes('second amendment')) {
    topicCategory = 'gun control';
  } else if (topicLower.includes('tax') || topicLower.includes('spend') || topicLower.includes('budget') || topicLower.includes('deficit')) {
    topicCategory = 'taxes';
  } else if (topicLower.includes('health') || topicLower.includes('medic') || topicLower.includes('doctor') || topicLower.includes('insurance')) {
    topicCategory = 'healthcare';
  } else if (topicLower.includes('immigra') || topicLower.includes('border') || topicLower.includes('alien') || topicLower.includes('refugee')) {
    topicCategory = 'immigration';
  } else if (topicLower.includes('climate') || topicLower.includes('environ') || topicLower.includes('green') || topicLower.includes('carbon')) {
    topicCategory = 'climate';
  }
  
  // Select appropriate response
  let responseOptions;
  
  if (responsesByPartyAndTopic[party] && responsesByPartyAndTopic[party][topicCategory]) {
    responseOptions = responsesByPartyAndTopic[party][topicCategory];
  } else {
    responseOptions = genericBriefResponses[party];
  }
  
  // Randomly select a response from the options
  const randomIndex = Math.floor(Math.random() * responseOptions.length);
  return responseOptions[randomIndex];
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
 * Enhanced prompt for character-based responses that are concise and first-person.
 */
async function callLLM(model, party, topic, context = []) {
  // Generate a character-based prompt for personalized, first-person, brief responses
  let systemPrompt = `You are a ${party} politician in a heated debate. Speak in the FIRST PERSON ONLY.`;
  systemPrompt += ` Your response MUST BE UNDER 20 WORDS. Be direct, passionate, and authentic.`;
  systemPrompt += ` DO NOT say "As a ${party}..." or "I believe..." - just make your point forcefully.`;
  systemPrompt += ` NEVER explain what your party thinks - speak AS a member of that party.`;

  // Create user prompt based on context
  let userPrompt = `Make a bold, direct statement about ${topic} that a passionate ${party} would say. Keep it under 20 words, punchy and memorable.`;
  
  // Add context about previous speakers if available
  if (context && context.length > 0) {
    const lastMessage = context[context.length - 1];
    userPrompt += ` Respond to what ${lastMessage.speaker} just said: "${lastMessage.message}"`;
  }
  
  // Log request attempt
  console.log(`[LLM REQUEST]`, {
    timestamp: new Date().toISOString(),
    model,
    party,
    topic,
    contextLength: context ? context.length : 0,
    promptLength: userPrompt.length
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
    return getMockResponse(model, party, topic, context);
  }
  
  // Set a timeout for all API calls (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    let result;
    
    switch (model) {
      case 'OpenAI':
      case 'ChatGPT': {
        // Using chat completions API with character-based prompting
        console.log(`[OPENAI REQUEST] Calling OpenAI chat completions API`);
        
        const requestBody = {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 50, // Reduced token limit for shorter responses
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
        // Using Claude's current API format with character-based prompting
        console.log(`[CLAUDE REQUEST] Calling Anthropic Claude API`);
        
        const requestBody = {
          model: "claude-3-haiku-20240307",
          max_tokens: 50,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
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
        // Using Cohere's API with character-based prompting
        console.log(`[COHERE REQUEST] Calling Cohere API`);
        
        const requestBody = {
          model: "command-r-plus",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 50,
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
        // Using Grok API with character-based prompting
        console.log(`[GROK REQUEST] Calling xAI Grok API`);
        
        const requestBody = {
          model: "grok-2-latest", 
          messages: [
            { 
              role: "system", 
              content: systemPrompt
            },
            { 
              role: "user", 
              content: userPrompt 
            }
          ],
          temperature: 0.7,
          max_tokens: 50,
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
        // Using Gemini API with character-based prompting
        console.log(`[GEMINI REQUEST] Calling Google Gemini API`);
        
        // Gemini doesn't support system messages the same way, so combine them
        const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
        
        const requestBody = {
          contents: [
            {
              parts: [
                { text: combinedPrompt }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 50,
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
    
    // Ensure response is concise (under 20 words)
    if (result) {
      // Check if response is longer than 20 words
      const words = result.split(' ');
      if (words.length > 20) {
        console.log(`[RESPONSE TRIMMING] Trimming response from ${words.length} words to 20 words`);
        result = words.slice(0, 20).join(' ');
        
        // Add period if needed
        if (!result.endsWith('.') && !result.endsWith('!') && !result.endsWith('?')) {
          result += '.';
        }
      }
    }
    
    // Log successful result
    console.log(`[LLM SUCCESS]`, {
      model, 
      resultLength: result.length,
      wordCount: result.split(' ').length,
      resultPreview: result
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
  const { model, party, topic, context } = req.query;
  
  // Parse context if provided
  let parsedContext = [];
  if (context) {
    try {
      parsedContext = JSON.parse(context);
    } catch (e) {
      console.error('[CONTEXT PARSE ERROR]', e);
      // Continue with empty context if parsing fails
    }
  }
  
  // Log incoming request
  console.log(`[API REQUEST] /api/llm`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    model,
    party, 
    topic,
    contextSize: parsedContext.length,
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
    // Call the LLM with context
    const result = await callLLM(model, party, topic, parsedContext);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log successful response
    console.log(`[API SUCCESS] /api/llm responded in ${responseTime}ms`, {
      model,
      party,
      topic,
      responseLength: result.length,
      wordCount: result.split(' ').length
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
    
    // If all else fails, provide a mock response in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const mockResponse = getMockResponse(model, party, topic, parsedContext);
        console.log(`[FALLBACK] Using mock response after API error`);
        
        return res.json({
          model,
          response: mockResponse,
          party,
          topic,
          timestamp: new Date().toISOString(),
          mock: true
        });
      } catch (mockError) {
        console.error(`[MOCK FALLBACK ERROR]`, mockError);
        // Continue to error response if mock fails
      }
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