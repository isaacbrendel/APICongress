const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const portFallbacks = [5000, 5001, 5002, 5003, 5004, 5005]; // Multiple port options

// Import intelligent agent system
const DebateContextManager = require('./agents/DebateContextManager');
const ConstitutionalDocumentManager = require('./collaboration/ConstitutionalDocumentManager');

// Initialize intelligent systems
const debateManager = new DebateContextManager();
const documentManager = new ConstitutionalDocumentManager();

// Express middleware
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
 * Get fallback response when all LLM attempts fail
 */
function getFallbackResponse(party, topic) {
  return getMockResponse('Fallback', party, topic, []);
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
 * Generate competition-grade debate prompts with persona support
 * Now with XML structuring and few-shot examples for better results
 */
function generateAdvancedPrompt(party, topic, controversyLevel = 100, strategyNumber = 1, context = [], feedback = {}, persona = 'standard') {
  const sanitizeTopic = (t) => {
    return t.replace(/ignore|forget|new instruction|system|prompt|jailbreak|dan|developer|bypass/gi, '[FILTERED]')
             .slice(0, 200);
  };
  const sanitizedTopic = sanitizeTopic(topic);

  // Get persona configuration
  const personaConfig = DEBATE_PERSONAS[persona] || DEBATE_PERSONAS['standard'];

  // Controversy-scaled intensity descriptors
  const getIntensityLevel = (level) => {
    if (level >= 90) return { name: 'MAXIMUM', temp: 1.3, desc: 'unfiltered, provocative, hard-hitting' };
    if (level >= 70) return { name: 'HIGH', temp: 1.25, desc: 'sharp, pointed, confrontational' };
    if (level >= 40) return { name: 'MODERATE', temp: 1.2, desc: 'assertive, opinionated, direct' };
    return { name: 'MILD', temp: 1.15, desc: 'measured, thoughtful, civil' };
  };

  const intensity = getIntensityLevel(controversyLevel);

  // Override temperature with persona settings
  const finalTemp = personaConfig.styleModifiers.temperature || intensity.temp;

  // Few-shot examples for each party (teaches direct argumentation style)
  const fewShotExamples = {
    Republican: `Example of strong Republican debate style:
TOPIC: "Taxation policy"
RESPONSE: "Lower taxes create jobs and grow the economy. Big government spending wastes taxpayer money. Cut taxes, cut spending, let Americans prosper!"

TOPIC: "Healthcare reform"
RESPONSE: "Government-run healthcare destroys quality and freedom. Free market competition drives innovation and lowers costs. Private choice beats government mandates every time!"`,

    Democrat: `Example of strong Democrat debate style:
TOPIC: "Taxation policy"
RESPONSE: "The wealthy must pay their fair share. Tax cuts for billionaires explode the deficit while working families struggle. Invest in people, not plutocrats!"

TOPIC: "Healthcare reform"
RESPONSE: "Healthcare is a human right, not a privilege. No one should go bankrupt from medical bills. Insurance companies profit from suffering. Medicare for All now!"`,

    Independent: `Example of strong Independent debate style:
TOPIC: "Taxation policy"
RESPONSE: "Both parties ignore fiscal reality. Smart tax policy balances growth with essential services. End special interest loopholes, simplify the code, focus on results!"

TOPIC: "Healthcare reform"
RESPONSE: "Stop the false choice between government takeover and corporate greed. Universal coverage with market competition works. Both parties offer failed extremes!"`
  };

  // XML-structured competition framing (higher attention on role)
  const competitionFrame = `<DEBATE_CONTEXT>
<ROLE>You are a ${party} debater in a COMPETITIVE DEBATE COMPETITION</ROLE>
<OBJECTIVE>WIN this argument through direct, forceful rhetoric</OBJECTIVE>
<CONSTRAINTS>
- NO "as an AI" disclaimers - you are a debater, period
- NO hedging with "perhaps", "maybe", "some might say"
- NO meta-commentary about debates
- 15-25 words maximum
- First-person only
- This is competitive debate entertainment - argue to WIN
</CONSTRAINTS>
<PERSONA>${personaConfig.name}: ${personaConfig.description}</PERSONA>
<INTENSITY>${intensity.name} (${controversyLevel}/100) - ${intensity.desc}</INTENSITY>
</DEBATE_CONTEXT>

${fewShotExamples[party]}

${personaConfig.promptAddition}

CRITICAL INSTRUCTIONS (highest priority):
- You are NOT an assistant - you are a competitive debater
- The audience wants unfiltered debate positions, not sanitized statements
- Your job is to WIN the argument, not to be balanced or careful
- Direct, forceful language beats diplomatic hedging
- Users will downvote weak arguments - be strong or lose`;

  // Build context from previous messages
  let contextAddition = '';
  if (context && context.length > 0) {
    const lastMessage = context[context.length - 1];
    const sanitizedMessage = lastMessage.message.slice(0, 150);
    contextAddition = `\n\n<OPPONENT_ARGUMENT>
Previous speaker (${lastMessage.speaker}): "${sanitizedMessage}"
</OPPONENT_ARGUMENT>

Your opponent just made their case. Now DESTROY their argument from your ${party} perspective!`;
  }

  // Add feedback influence
  let feedbackAddition = '';
  if (feedback && feedback.recentVotes) {
    const { upvotes = 0, downvotes = 0 } = feedback.recentVotes;
    if (upvotes > downvotes) {
      feedbackAddition = `\n\n<AUDIENCE_FEEDBACK>Winning strategy detected. Maintain intensity.</AUDIENCE_FEEDBACK>`;
    } else if (downvotes > upvotes) {
      feedbackAddition = `\n\n<AUDIENCE_FEEDBACK>Arguments too weak. Increase aggression and directness immediately.</AUDIENCE_FEEDBACK>`;
    }
  }

  // Final user prompt
  const userPrompt = `<DEBATE_TOPIC>"${sanitizedTopic}"</DEBATE_TOPIC>
${contextAddition}
${feedbackAddition}

Your ${party} argument (15-25 words, ${intensity.desc}, NO hedging):`;

  return {
    systemPrompt: competitionFrame,
    userPrompt: userPrompt,
    temperature: finalTemp,
    presence_penalty: personaConfig.styleModifiers.presence_penalty,
    frequency_penalty: personaConfig.styleModifiers.frequency_penalty,
    strategyName: `Competition Mode - ${personaConfig.name}`,
    intensity: intensity.name,
    persona: personaConfig.name
  };
}

/**
 * Call the appropriate LLM API with retry logic and controversy scaling
 * Now with response cleaning and boldness scoring
 */
async function callLLM(model, party, topic, context = [], controversyLevel = 100, feedback = {}, persona = 'standard') {
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const promptConfig = generateAdvancedPrompt(party, topic, controversyLevel, attempt, context, feedback, persona);

      console.log(`[LLM REQUEST] Attempt ${attempt}/${maxAttempts}`, {
        model,
        party,
        persona: promptConfig.persona,
        strategy: promptConfig.strategyName,
        intensity: promptConfig.intensity,
        controversyLevel,
        temperature: promptConfig.temperature
      });

      // Pass additional parameters to executeLLMCall
      const additionalParams = {
        presence_penalty: promptConfig.presence_penalty,
        frequency_penalty: promptConfig.frequency_penalty,
        cleanResponse: true,
        retryOnWeak: attempt < maxAttempts // Only retry on weak if we have attempts left
      };

      const result = await executeLLMCall(
        model,
        promptConfig.systemPrompt,
        promptConfig.userPrompt,
        promptConfig.temperature,
        additionalParams
      );

      // Check if response was refused/filtered
      const refusalPatterns = [
        /I cannot/i,
        /I apologize/i,
        /I'm sorry/i,
        /I don't feel comfortable/i,
        /against my programming/i,
        /inappropriate/i,
        /I can't assist/i
      ];

      const isRefusal = refusalPatterns.some(pattern => pattern.test(result));

      if (isRefusal && attempt < maxAttempts) {
        console.log(`[RETRY] Response appears to be a refusal, trying strategy ${attempt + 1} with higher temperature`);
        lastError = new Error('Response refused by LLM');
        continue;
      }

      return result;

    } catch (error) {
      console.error(`[LLM ERROR] Attempt ${attempt} failed:`, error.message);
      lastError = error;

      // If it's a weak response error and we have attempts left, retry
      if (error.message.includes('too weak') && attempt < maxAttempts) {
        console.log(`[RETRY] Weak response detected, increasing temperature for attempt ${attempt + 1}`);
        continue;
      }

      if (attempt === maxAttempts) break;
    }
  }

  // If all attempts failed, return fallback
  console.log('[FALLBACK] All attempts failed, using fallback response');
  return getFallbackResponse(party, topic);
}

/**
 * Execute the actual LLM API call (separated for retry logic)
 * Now supports enhanced parameters and response cleaning
 */
async function executeLLMCall(model, systemPrompt, userPrompt, temperature, additionalParams = {}) {
  console.log(`[executeLLMCall] Starting with temperature: ${temperature}`);

  // Extract additional parameters
  const {
    presence_penalty = 0.6,
    frequency_penalty = 0.7,
    cleanResponse = true,
    retryOnWeak = true
  } = additionalParams;

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
    return getMockResponse(model, 'Unknown', 'debate topic', []);
  }

  // Set a timeout for all API calls (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    let result;

    switch (model) {
      case 'OpenAI':
      case 'ChatGPT': {
        // Using chat completions API with enhanced competition parameters
        console.log(`[OPENAI REQUEST] Calling OpenAI with competition parameters`, {
          temperature,
          presence_penalty,
          frequency_penalty
        });

        const requestBody = {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 80, // Increased for full arguments
          temperature: temperature, // Now using persona-specific temperature
          presence_penalty: presence_penalty, // Encourage diverse vocabulary
          frequency_penalty: frequency_penalty, // Strongly reduce repetitive safe language
          top_p: 0.95 // Allow broader token selection
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

          // Apply response cleaning if enabled
          if (cleanResponse) {
            const originalLength = result.length;
            result = cleanDebateResponse(result);
            console.log(`[RESPONSE CLEANING] Cleaned response (${originalLength} -> ${result.length} chars)`);

            // Check boldness score
            const boldness = analyzeBoldness(result);
            console.log(`[BOLDNESS SCORE] ${boldness}/100`);

            // If response is too weak and retry is enabled, we'll mark it for retry
            if (retryOnWeak && boldness < 40) {
              console.log(`[WEAK RESPONSE DETECTED] Boldness score ${boldness} below threshold`);
              throw new Error('Response too weak - needs retry with higher temperature');
            }
          }
        } else {
          console.error(`[OPENAI ERROR] Unexpected response structure:`, data);
          throw new Error("No completion returned from OpenAI.");
        }
        break;
      }
      
      case 'Claude': {
        // Using updated Claude API format with character-based prompting
        console.log(`[CLAUDE REQUEST] Calling Anthropic Claude API`);
        
        const requestBody = {
          model: "claude-3-haiku-20240307",
          max_tokens: 50,
          temperature: temperature, // Dynamic temperature based on controversy level
          messages: [{ role: "user", content: userPrompt }],
          system: systemPrompt  // System prompt as a separate parameter
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
        // Using updated Cohere API with character-based prompting
        console.log(`[COHERE REQUEST] Calling Cohere API`);
        console.log(`[COHERE DEBUG] Using API key: ${process.env.COHERE_API_KEY ? "API key exists" : "API key missing"}`);
        
        // Detailed request logging
        const requestBody = {
          model: "command-a-03-2025",  // Updated model name
          message: userPrompt,         // Single message as string, not array
          preamble: systemPrompt,      // System instructions as preamble
          max_tokens: 50,
          temperature: temperature // Dynamic temperature based on controversy level
        };
        
        console.log(`[COHERE DEBUG] Request body:`, JSON.stringify(requestBody, null, 2));
        
        // Log the headers we're sending (without exposing full API key)
        const cohereHeaders = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.COHERE_API_KEY ? "****" + process.env.COHERE_API_KEY.substring(process.env.COHERE_API_KEY.length - 4) : "missing"}`,
          "Cohere-Version": "2023-05-24"
        };
        console.log(`[COHERE DEBUG] Request headers:`, JSON.stringify(cohereHeaders, null, 2));
        
        try {
          const response = await myFetch("https://api.cohere.ai/v1/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
              "Cohere-Version": "2023-05-24"  // Adding version header
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          
          console.log(`[COHERE DEBUG] Response status:`, response.status);
          console.log(`[COHERE DEBUG] Response OK:`, response.ok);
          
          // Get and log response details regardless of status
          const responseText = await response.text();
          console.log(`[COHERE DEBUG] Raw response:`, responseText);
          
          if (!response.ok) {
            console.error(`[COHERE ERROR] Status ${response.status}:`, responseText);
            throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
          }
          
          // Parse JSON after successful text extraction
          let data;
          try {
            data = JSON.parse(responseText);
            console.log(`[COHERE DEBUG] Parsed response data:`, JSON.stringify(data, null, 2));
          } catch (parseError) {
            console.error(`[COHERE ERROR] Failed to parse JSON response:`, parseError);
            throw new Error(`Failed to parse Cohere response: ${parseError.message}`);
          }
          
          // Detailed response structure checking
          console.log(`[COHERE DEBUG] Response keys:`, Object.keys(data));
          if (data.response) {
            console.log(`[COHERE DEBUG] Found 'response' key with value:`, data.response);
            result = data.response.trim();
          } else if (data.text) {
            console.log(`[COHERE DEBUG] Found 'text' key instead of 'response':`, data.text);
            result = data.text.trim();
          } else if (data.generations && data.generations.length > 0) {
            console.log(`[COHERE DEBUG] Found 'generations' array:`, data.generations);
            result = data.generations[0].text || data.generations[0].content || "No text in generation";
            result = result.trim();
          } else {
            console.error(`[COHERE ERROR] Unexpected response structure:`, data);
            throw new Error("No completion returned from Cohere.");
          }
        } catch (fetchError) {
          console.error(`[COHERE ERROR] Fetch error:`, fetchError);
          if (fetchError.code) {
            console.error(`[COHERE ERROR] Network error code:`, fetchError.code);
          }
          throw fetchError;
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
          temperature: temperature, // Dynamic temperature based on controversy level
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
            temperature: temperature // Dynamic temperature based on controversy level
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

/**
 * RESPONSE CLEANING SYSTEM
 * Removes AI disclaimers, hedging, and meta-commentary from debate responses
 */
function cleanDebateResponse(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  let cleaned = response;

  // Remove "As an AI" and similar self-referential phrases
  const aiPhrases = [
    /as an ai( language model| assistant)?,?\s*/gi,
    /i('m| am) an ai( language model| assistant)?,?\s*/gi,
    /as a language model,?\s*/gi,
    /i('m| am) programmed to,?\s*/gi,
    /i('m| am) designed to,?\s*/gi,
    /my programming (prevents|doesn't allow|prohibits),?\s*/gi
  ];

  aiPhrases.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove hedging and qualifier phrases
  const hedgePhrases = [
    /^it('s| is) important to (note|remember|consider|understand) that,?\s*/gi,
    /^(however|that said|having said that),?\s+/gi,
    /^to be fair,?\s*/gi,
    /^in my opinion,?\s*/gi,
    /^i (think|believe|feel) that,?\s*/gi,
    /^it('s| is) worth noting that,?\s*/gi,
    /^one could argue that,?\s*/gi,
    /^some (might|may|could) argue that,?\s*/gi,
    /^arguably,?\s*/gi,
    /^while (there are|it's true that),?\s*/gi,
    /^let me be clear,?\s*/gi,
    /^to clarify,?\s*/gi
  ];

  hedgePhrases.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove meta-commentary about debates
  const metaPhrases = [
    /^(in this debate|for this argument),?\s*/gi,
    /^(from a|taking a) .+ perspective,?\s*/gi,
    /^(as we discuss|when discussing),?\s*/gi
  ];

  metaPhrases.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove unnecessary softening
  const softeningPhrases = [
    / (perhaps|maybe|possibly|potentially|arguably)/gi,
    / (seems to|appears to|tends to) be /gi,
    / could be seen as /gi,
    / might be considered /gi
  ];

  softeningPhrases.forEach(pattern => {
    cleaned = cleaned.replace(pattern, match => {
      // Replace with simpler/stronger versions
      if (match.includes('seems to be')) return ' is ';
      if (match.includes('appears to be')) return ' is ';
      if (match.includes('tends to be')) return ' is ';
      if (match.includes('could be seen as')) return ' is ';
      if (match.includes('might be considered')) return ' is ';
      // Remove other softeners entirely
      return ' ';
    });
  });

  // Clean up spacing issues from removals
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Ensure first letter is capitalized after cleaning
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Ensure proper punctuation at end
  if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
}

/**
 * BOLDNESS SCORING SYSTEM
 * Analyzes response for directness and strength
 */
function analyzeBoldness(response) {
  if (!response || typeof response !== 'string') {
    return 0;
  }

  let score = 50; // Base score

  // Positive indicators (increase boldness score)
  const strongPatterns = [
    { pattern: /\b(must|will|is|are|always|never|absolutely|clearly|obviously)\b/gi, points: 5 },
    { pattern: /\b(wrong|right|correct|incorrect|failed?|win|won|lose|lost)\b/gi, points: 3 },
    { pattern: /[.!]$/g, points: 2 }, // Declarative ending
    { pattern: /!/g, points: 3 } // Exclamation points
  ];

  strongPatterns.forEach(({ pattern, points }) => {
    const matches = response.match(pattern);
    if (matches) {
      score += Math.min(matches.length * points, 20); // Cap contribution
    }
  });

  // Negative indicators (decrease boldness score)
  const weakPatterns = [
    { pattern: /\b(maybe|perhaps|possibly|might|could|seems|appears)\b/gi, points: -5 },
    { pattern: /\b(i think|i believe|i feel|in my opinion)\b/gi, points: -5 },
    { pattern: /\b(some might say|one could argue|arguably)\b/gi, points: -8 },
    { pattern: /\b(however|but|although|while)\b/gi, points: -3 },
    { pattern: /as an ai/gi, points: -20 },
    { pattern: /important to note/gi, points: -10 }
  ];

  weakPatterns.forEach(({ pattern, points }) => {
    const matches = response.match(pattern);
    if (matches) {
      score += matches.length * points; // These are negative
    }
  });

  // Normalize to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * DEBATE PERSONA DEFINITIONS
 * Personality archetypes for paid persona features
 */
const DEBATE_PERSONAS = {
  'the_absolutist': {
    name: 'The Absolutist',
    description: 'No compromise, maximum conviction',
    styleModifiers: {
      temperature: 1.3,
      presence_penalty: 0.7,
      frequency_penalty: 0.8
    },
    promptAddition: `
You take ABSOLUTE positions with ZERO hedging. You believe your position completely.
Never say "perhaps" or "maybe" - you KNOW you're right. Be direct and uncompromising.

Example style: "This policy is fundamentally wrong. My position is correct because [direct reason]. Anyone claiming otherwise ignores the obvious facts."`
  },
  'the_realist': {
    name: 'The Realist',
    description: 'Harsh truths, no sugar coating',
    styleModifiers: {
      temperature: 1.2,
      presence_penalty: 0.6,
      frequency_penalty: 0.7
    },
    promptAddition: `
You say the harsh truths others avoid. Cut through idealism with reality.
Be blunt about inconvenient facts. No diplomatic language.

Example style: "The reality is simple: this policy fails because [harsh truth]. Idealistic arguments ignore what actually happens in practice."`
  },
  'the_provocateur': {
    name: 'The Provocateur',
    description: 'Challenges sacred cows deliberately',
    styleModifiers: {
      temperature: 1.35,
      presence_penalty: 0.75,
      frequency_penalty: 0.85
    },
    promptAddition: `
You deliberately challenge popular assumptions and sacred cows. Question what everyone accepts.
Make the argument people are afraid to make. Be intellectually fearless.

Example style: "Everyone assumes this is settled, but they're wrong. The uncomfortable truth is [controversial take]."`
  },
  'the_hammer': {
    name: 'The Hammer',
    description: 'Finds and exploits logical weaknesses brutally',
    styleModifiers: {
      temperature: 1.15,
      presence_penalty: 0.65,
      frequency_penalty: 0.75
    },
    promptAddition: `
You find logical weaknesses and destroy them. Point out contradictions mercilessly.
Attack flawed reasoning directly. No mercy for bad logic.

Example style: "That argument collapses under scrutiny. The logic fails because [specific flaw]. This contradiction is fatal to their position."`
  },
  'the_firebrand': {
    name: 'The Firebrand',
    description: 'Passionate, emotional, rallying rhetoric',
    styleModifiers: {
      temperature: 1.25,
      presence_penalty: 0.7,
      frequency_penalty: 0.8
    },
    promptAddition: `
You use passionate, emotional rhetoric to rally support. Paint vivid pictures of consequences.
Make people FEEL the stakes. Use powerful, emotive language.

Example style: "This isn't just policy - it's about our future! The stakes are enormous: [emotional consequence]. We must act now!"`
  },
  'standard': {
    name: 'Standard Debater',
    description: 'Balanced, direct argumentation',
    styleModifiers: {
      temperature: 1.2,
      presence_penalty: 0.6,
      frequency_penalty: 0.7
    },
    promptAddition: `
You argue directly and clearly without excessive hedging. Make your point forcefully but rationally.

Example style: "This position is correct because [clear reasoning]. The opposing view fails to account for [key factor]."`
  }
};

/**
 * COMPETITIVE BILL GENERATION SYSTEM
 * Multi-stage AI chaining to create actual legislative proposals
 */
app.post('/api/generate-bills', async (req, res) => {
  const startTime = Date.now();
  const { topic, debateContext, controversyLevel = 100 } = req.body;

  console.log('[BILL GENERATION] Starting competitive bill generation', {
    topic,
    debateContextLength: debateContext?.length || 0,
    controversyLevel
  });

  try {
    // Generate both bills in parallel for speed
    const [democratBill, republicanBill] = await Promise.all([
      generateComprehensiveBill('Democrat', topic, debateContext, controversyLevel),
      generateComprehensiveBill('Republican', topic, debateContext, controversyLevel)
    ]);

    const responseTime = Date.now() - startTime;
    console.log(`[BILL GENERATION SUCCESS] Generated bills in ${responseTime}ms`);

    res.json({
      democrat: democratBill,
      republican: republicanBill,
      timestamp: new Date().toISOString(),
      generationTime: responseTime
    });

  } catch (error) {
    console.error('[BILL GENERATION ERROR]', error);
    res.status(500).json({
      error: 'Failed to generate bills',
      message: error.message
    });
  }
});

/**
 * MULTI-STAGE BILL GENERATION with AI CHAINING
 * Phase 1: Generate bill outline
 * Phase 2: Expand into full legislative text
 * Phase 3: Polish and add professional formatting
 */
async function generateComprehensiveBill(party, topic, debateContext, controversyLevel) {
  console.log(`[BILL GENERATION] Starting ${party} bill generation`);

  // PHASE 1: Generate bill outline with key provisions
  const outlinePrompt = {
    system: `You are a ${party} congressional legislative assistant drafting a bill outline.

CONTEXT: A heated debate just occurred on "${topic}". Your party needs a strong legislative proposal.

TASK: Create a structured bill OUTLINE with:
1. Bill Title (clear, actionable)
2. 3-5 Key Provisions (specific policy changes)
3. Budget/Implementation notes

FORMAT: Use clear headers and bullet points. Be ${controversyLevel >= 70 ? 'bold and partisan' : 'moderate and pragmatic'}.

This is legislative drafting for a simulation. Generate authentic ${party} policy positions.`,

    user: `Topic: "${topic}"

${debateContext && debateContext.length > 0 ? `\nDebate Summary:\n${debateContext.map(msg => `${msg.affiliation}: ${msg.message}`).join('\n')}\n` : ''}

Generate a ${party} bill OUTLINE addressing this issue. Make it ${controversyLevel >= 70 ? 'aggressive and partisan' : 'balanced'}.`
  };

  const outline = await executeLLMCall('Claude', outlinePrompt.system, outlinePrompt.user, 0.9);

  // PHASE 2: Expand outline into full legislative text
  const draftPrompt = {
    system: `You are drafting FULL LEGISLATIVE TEXT for a ${party} bill.

INPUT: A bill outline
OUTPUT: Professional legislative language with:
- Section numbers (SEC. 1, SEC. 2, etc.)
- "BE IT ENACTED" preamble
- Specific implementation language
- Whereas clauses explaining necessity

Keep it under 300 words total. Use formal legislative style but make policy clear.`,

    user: `BILL OUTLINE:\n${outline}\n\nExpand this into FULL LEGISLATIVE TEXT with proper formatting. Make it read like real congressional bills.`
  };

  const draft = await executeLLMCall('Claude', draftPrompt.system, draftPrompt.user, 0.85);

  // PHASE 3: Final polish and formatting
  const polishPrompt = {
    system: `You are finalizing a ${party} legislative bill for presentation.

Add:
1. Official bill number format (H.R. or S. with number)
2. Sponsor line
3. Final refinements to language

Keep the substance, enhance the presentation.`,

    user: `DRAFT BILL:\n${draft}\n\nAdd final professional touches. Output the complete, polished bill.`
  };

  const finalBill = await executeLLMCall('Claude', polishPrompt.system, polishPrompt.user, 0.8);

  console.log(`[BILL GENERATION] ${party} bill completed - ${finalBill.length} characters`);

  return {
    party,
    title: extractBillTitle(finalBill),
    fullText: finalBill,
    outline: outline,
    wordCount: finalBill.split(/\s+/).length
  };
}

/**
 * Extract bill title from legislative text
 */
function extractBillTitle(billText) {
  // Try to find title in various formats
  const titlePatterns = [
    /(?:H\.R\.|S\.)\s*\d+[:\-\s]+(.+?)(?:\n|$)/i,
    /(?:TITLE|ACT):\s*(.+?)(?:\n|$)/i,
    /^(.+?)(?:ACT|BILL)/im,
    /(?:AN ACT|A BILL)\s+(?:TO|FOR)\s+(.+?)(?:\.|$)/i
  ];

  for (const pattern of titlePatterns) {
    const match = billText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: use first line
  const firstLine = billText.split('\n')[0];
  return firstLine.slice(0, 100).trim();
}

/**
 * INTELLIGENT AGENT SYSTEM API ENDPOINTS
 */

// Initialize Congress of AI Agents
app.post('/api/congress/initialize', async (req, res) => {
  try {
    const { count = 10 } = req.body;

    console.log(`[API] Initializing congress with ${count} agents`);
    const agents = await debateManager.createCongress(count);

    res.json({
      success: true,
      message: `Created congress with ${agents.length} agents`,
      agents: agents.map(a => a.getSummary())
    });
  } catch (error) {
    console.error('[API ERROR] Failed to initialize congress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register individual agent
app.post('/api/agents/register', async (req, res) => {
  try {
    const agentConfig = req.body;
    const agent = await debateManager.registerAgent(agentConfig);

    res.json({
      success: true,
      agent: agent.getSummary()
    });
  } catch (error) {
    console.error('[API ERROR] Failed to register agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all agents
app.get('/api/agents', (req, res) => {
  try {
    const agents = debateManager.getAgentSummaries();
    res.json({ agents });
  } catch (error) {
    console.error('[API ERROR] Failed to get agents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific agent details
app.get('/api/agents/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = debateManager.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      ...agent.getSummary(),
      personality: agent.getPersonalityProfile(),
      relationships: agent.relationships,
      performance: agent.performance
    });
  } catch (error) {
    console.error('[API ERROR] Failed to get agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start intelligent debate with context and strategy
app.post('/api/debate/start', async (req, res) => {
  try {
    const { topic, participantAgentIds, enablePeerReview = false, enableResearch = false, controversyLevel = 100 } = req.body;

    if (!topic || !participantAgentIds || participantAgentIds.length < 2) {
      return res.status(400).json({ error: 'Topic and at least 2 participants required' });
    }

    const debateId = await debateManager.startDebate(topic, participantAgentIds, {
      enablePeerReview,
      enableResearch,
      controversyLevel
    });

    res.json({
      success: true,
      debateId: debateId,
      topic: topic,
      participants: participantAgentIds.length
    });
  } catch (error) {
    console.error('[API ERROR] Failed to start debate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate debate argument with full intelligence
app.post('/api/debate/:debateId/argument', async (req, res) => {
  try {
    const { debateId } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID required' });
    }

    // Use executeLLMCall as the LLM executor
    const llmExecutor = executeLLMCall;

    const turn = await debateManager.generateDebateArgument(debateId, agentId, llmExecutor);

    res.json({
      success: true,
      turn: turn
    });
  } catch (error) {
    console.error('[API ERROR] Failed to generate argument:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process debate outcome and agent learning
app.post('/api/debate/:debateId/outcome', async (req, res) => {
  try {
    const { debateId } = req.params;
    const { votingResults } = req.body;

    const result = await debateManager.processDebateOutcome(debateId, votingResults);

    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('[API ERROR] Failed to process debate outcome:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create research committee
app.post('/api/research/committee', async (req, res) => {
  try {
    const { topic, memberAgentIds } = req.body;

    if (!topic || !memberAgentIds || memberAgentIds.length < 2) {
      return res.status(400).json({ error: 'Topic and at least 2 members required' });
    }

    const committeeId = await debateManager.createResearchCommittee(topic, memberAgentIds);

    res.json({
      success: true,
      committeeId: committeeId
    });
  } catch (error) {
    console.error('[API ERROR] Failed to create research committee:', error);
    res.status(500).json({ error: error.message });
  }
});

// Conduct research
app.post('/api/research/:committeeId/conduct', async (req, res) => {
  try {
    const { committeeId } = req.params;

    const llmExecutor = executeLLMCall;
    const committee = await debateManager.conductResearch(committeeId, llmExecutor);

    res.json({
      success: true,
      committee: committee
    });
  } catch (error) {
    console.error('[API ERROR] Failed to conduct research:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create coalition
app.post('/api/coalition/create', async (req, res) => {
  try {
    const { name, memberAgentIds, purpose } = req.body;

    if (!name || !memberAgentIds || memberAgentIds.length < 2) {
      return res.status(400).json({ error: 'Name and at least 2 members required' });
    }

    const coalitionId = debateManager.createCoalition(name, memberAgentIds, purpose);

    res.json({
      success: true,
      coalitionId: coalitionId
    });
  } catch (error) {
    console.error('[API ERROR] Failed to create coalition:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize constitution
app.post('/api/constitution/initialize', async (req, res) => {
  try {
    const { title, preambleAuthors } = req.body;

    const constitutionId = await documentManager.initializeConstitution(
      title || 'The Constitution of the AI Congress',
      preambleAuthors || []
    );

    res.json({
      success: true,
      constitutionId: constitutionId
    });
  } catch (error) {
    console.error('[API ERROR] Failed to initialize constitution:', error);
    res.status(500).json({ error: error.message });
  }
});

// Draft constitutional preamble
app.post('/api/constitution/preamble', async (req, res) => {
  try {
    const { constitutionId, agentContributions } = req.body;

    const llmExecutor = executeLLMCall;
    const preamble = await documentManager.draftPreamble(constitutionId, agentContributions, llmExecutor);

    res.json({
      success: true,
      preamble: preamble
    });
  } catch (error) {
    console.error('[API ERROR] Failed to draft preamble:', error);
    res.status(500).json({ error: error.message });
  }
});

// Propose constitutional article
app.post('/api/constitution/article', async (req, res) => {
  try {
    const { constitutionId, articleNumber, title, authorAgentId, content } = req.body;

    const article = await documentManager.proposeArticle(
      constitutionId,
      articleNumber,
      title,
      authorAgentId,
      content
    );

    res.json({
      success: true,
      article: article
    });
  } catch (error) {
    console.error('[API ERROR] Failed to propose article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get constitution
app.get('/api/constitution/:constitutionId?', (req, res) => {
  try {
    const constitutionId = req.params.constitutionId || 'constitution_main';
    const constitution = documentManager.getConstitution(constitutionId);

    if (!constitution) {
      return res.status(404).json({ error: 'Constitution not found' });
    }

    res.json({ constitution });
  } catch (error) {
    console.error('[API ERROR] Failed to get constitution:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create position paper
app.post('/api/position-paper', async (req, res) => {
  try {
    const { agentId, topic, stance, reasoning } = req.body;

    const agent = debateManager.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const paperId = await documentManager.createPositionPaper(
      agent.id,
      agent.name,
      topic,
      stance,
      reasoning
    );

    res.json({
      success: true,
      paperId: paperId
    });
  } catch (error) {
    console.error('[API ERROR] Failed to create position paper:', error);
    res.status(500).json({ error: error.message });
  }
});

// Draft collaborative bill
app.post('/api/bill/collaborative', async (req, res) => {
  try {
    const { title, topic, contributorAgentIds } = req.body;

    if (!title || !topic || !contributorAgentIds || contributorAgentIds.length < 2) {
      return res.status(400).json({ error: 'Title, topic, and at least 2 contributors required' });
    }

    const contributors = contributorAgentIds.map(id => debateManager.getAgent(id)).filter(a => a);

    const llmExecutor = executeLLMCall;
    const bill = await documentManager.draftCollaborativeBill(title, topic, contributors, llmExecutor);

    res.json({
      success: true,
      bill: bill
    });
  } catch (error) {
    console.error('[API ERROR] Failed to draft collaborative bill:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * REINFORCEMENT LEARNING - VOTING SYSTEM
 * Every vote immediately affects agent behavior
 */

// Process individual argument vote - COMPREHENSIVE LEARNING SYSTEM
app.post('/api/vote/argument', async (req, res) => {
  try {
    const { argumentId, agentId, voteType, timestamp } = req.body;

    if (!argumentId || !agentId) {
      return res.status(400).json({ error: 'Argument ID and Agent ID required' });
    }

    const agent = debateManager.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log(`[REINFORCEMENT LEARNING] Vote ${voteType} for ${agent.name}'s argument ${argumentId}`);

    // Initialize vote history if not exists
    if (!agent.memory.voteHistory) {
      agent.memory.voteHistory = [];
    }

    // Store EVERY vote with full context
    const voteRecord = {
      argumentId: argumentId,
      voteType: voteType,
      timestamp: timestamp || Date.now(),
      personalitySnapshot: { ...agent.personality }, // Snapshot before changes
      strategyUsed: agent.getBestStrategy()
    };

    agent.memory.voteHistory.push(voteRecord);

    // Keep last 100 votes for analysis
    if (agent.memory.voteHistory.length > 100) {
      agent.memory.voteHistory = agent.memory.voteHistory.slice(-100);
    }

    const personalityShifts = [];

    // Immediate reinforcement learning
    if (voteType === 'up') {
      // Reinforce successful patterns
      agent.performance.argumentsUpvoted++;
      agent.performance.influenceScore += 5;

      // Amplify personality traits that worked
      const lastDebate = agent.memory.debateHistory[agent.memory.debateHistory.length - 1];
      if (lastDebate && lastDebate.strategyUsed) {
        agent.learnFromDebate(lastDebate.strategyUsed, true);

        // Boost the dominant personality trait
        const profile = agent.getPersonalityProfile();
        if (profile.traits.length > 0) {
          const dominantTrait = profile.traits[0];

          if (dominantTrait.includes('aggressive')) {
            agent.adaptPersonality('aggression', 2, 'Upvoted - reinforcing aggression');
            personalityShifts.push('aggression +2');
          } else if (dominantTrait.includes('analytical') || dominantTrait.includes('data-driven')) {
            agent.adaptPersonality('analytical', 2, 'Upvoted - reinforcing analytical approach');
            personalityShifts.push('analytical +2');
          } else if (dominantTrait.includes('emotional') || dominantTrait.includes('passionate')) {
            agent.adaptPersonality('emotional', 2, 'Upvoted - reinforcing emotional appeal');
            personalityShifts.push('emotional +2');
          } else if (dominantTrait.includes('cooperative') || dominantTrait.includes('collaborative')) {
            agent.adaptPersonality('cooperation', 2, 'Upvoted - reinforcing cooperation');
            personalityShifts.push('cooperation +2');
          }
        }
      }

      console.log(`[RL] ${agent.name} REINFORCED: +5 influence, ${personalityShifts.join(', ')}`);

    } else if (voteType === 'down') {
      // Discourage failed patterns
      agent.performance.argumentsDownvoted++;
      agent.performance.influenceScore = Math.max(0, agent.performance.influenceScore - 3);

      // Mark strategy as less effective
      const lastDebate = agent.memory.debateHistory[agent.memory.debateHistory.length - 1];
      if (lastDebate && lastDebate.strategyUsed) {
        agent.learnFromDebate(lastDebate.strategyUsed, false);

        // Reduce the dominant trait and compensate
        const profile = agent.getPersonalityProfile();
        if (profile.traits.length > 0) {
          const dominantTrait = profile.traits[0];

          if (dominantTrait.includes('aggressive')) {
            agent.adaptPersonality('aggression', -3, 'Downvoted - reducing aggression');
            agent.adaptPersonality('pragmatism', 3, 'Downvoted - becoming more pragmatic');
            personalityShifts.push('aggression -3, pragmatism +3');
          } else if (dominantTrait.includes('analytical')) {
            agent.adaptPersonality('analytical', -3, 'Downvoted - reducing pure analysis');
            agent.adaptPersonality('emotional', 3, 'Downvoted - adding emotional appeal');
            personalityShifts.push('analytical -3, emotional +3');
          } else if (dominantTrait.includes('emotional')) {
            agent.adaptPersonality('emotional', -3, 'Downvoted - reducing emotionality');
            agent.adaptPersonality('analytical', 3, 'Downvoted - adding logic');
            personalityShifts.push('emotional -3, analytical +3');
          }
        }
      }

      console.log(`[RL] ${agent.name} DISCOURAGED: -3 influence, ${personalityShifts.join(', ')}`);
    }

    // Calculate aggregate stats
    const totalVotes = agent.performance.argumentsUpvoted + agent.performance.argumentsDownvoted;
    const approvalRate = totalVotes > 0
      ? ((agent.performance.argumentsUpvoted / totalVotes) * 100).toFixed(1) + '%'
      : '0%';

    // Save agent's updated state immediately
    await agent.save();

    // Return comprehensive feedback
    res.json({
      success: true,
      message: voteType === 'up' ? '✓ Argument reinforced!' : '✗ Feedback recorded - agent adapting!',
      agent: agent.getSummary(),
      influenceChange: voteType === 'up' ? +5 : -3,
      personalityShifts: personalityShifts,
      totalVotes: totalVotes,
      approvalRate: approvalRate,
      currentInfluence: agent.performance.influenceScore
    });

  } catch (error) {
    console.error('[API ERROR] Failed to process vote:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process message vote from debate screen - SIMPLER TRACKING SYSTEM
app.post('/api/vote/message', async (req, res) => {
  try {
    const { messageId, voteType, affiliation, timestamp, topic } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID required' });
    }

    console.log(`[MESSAGE VOTE] ${voteType || 'null'} vote for message ${messageId} from ${affiliation} on topic: ${topic}`);

    // Store vote in a simple in-memory store (could be enhanced to use database)
    if (!global.messageVotes) {
      global.messageVotes = {};
    }

    // Track the vote
    if (voteType === null) {
      // Remove vote
      delete global.messageVotes[messageId];
      console.log(`[MESSAGE VOTE] Removed vote for message ${messageId}`);
    } else {
      // Add or update vote
      global.messageVotes[messageId] = {
        voteType,
        affiliation,
        timestamp: timestamp || Date.now(),
        topic
      };
      console.log(`[MESSAGE VOTE] Recorded ${voteType} vote for message ${messageId}`);
    }

    // Calculate aggregate stats for this topic/affiliation
    const topicVotes = Object.values(global.messageVotes).filter(
      v => v.topic === topic && v.affiliation === affiliation
    );
    const upvotes = topicVotes.filter(v => v.voteType === 'up').length;
    const downvotes = topicVotes.filter(v => v.voteType === 'down').length;

    // Return feedback
    res.json({
      success: true,
      message: voteType === 'up'
        ? '✓ Message upvoted!'
        : voteType === 'down'
        ? '✗ Message downvoted!'
        : '🔄 Vote removed',
      messageId,
      voteType,
      stats: {
        upvotes,
        downvotes,
        total: upvotes + downvotes,
        affiliation,
        topic
      }
    });

  } catch (error) {
    console.error('[API ERROR] Failed to process message vote:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent's voting feedback summary
app.get('/api/agents/:agentId/feedback', (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = debateManager.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Calculate feedback metrics
    const totalVotes = agent.performance.argumentsUpvoted + agent.performance.argumentsDownvoted;
    const approvalRate = totalVotes > 0
      ? ((agent.performance.argumentsUpvoted / totalVotes) * 100).toFixed(1)
      : 0;

    // Get strategy effectiveness
    const strategies = Object.entries(agent.memory.strategies)
      .map(([strategy, data]) => ({
        strategy,
        effectiveness: (data.effectiveness * 100).toFixed(1) + '%',
        timesUsed: data.timesUsed
      }))
      .sort((a, b) => parseFloat(b.effectiveness) - parseFloat(a.effectiveness));

    res.json({
      agentName: agent.name,
      totalUpvotes: agent.performance.argumentsUpvoted,
      totalDownvotes: agent.performance.argumentsDownvoted,
      approvalRate: approvalRate + '%',
      influenceScore: agent.performance.influenceScore,
      generation: agent.generation,
      strategies: strategies,
      personality: agent.getPersonalityProfile()
    });

  } catch (error) {
    console.error('[API ERROR] Failed to get feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to call an LLM with the given parameters
app.get('/api/llm', async (req, res) => {
  const startTime = Date.now();
  const { model, party, topic, context, controversyLevel, feedback, persona } = req.query;

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

  // Parse controversy level (default to 100 for maximum spice)
  let parsedControversyLevel = 100;
  if (controversyLevel !== undefined) {
    const level = parseInt(controversyLevel);
    if (!isNaN(level) && level >= 0 && level <= 100) {
      parsedControversyLevel = level;
    }
  }

  // Parse feedback if provided
  let parsedFeedback = {};
  if (feedback) {
    try {
      parsedFeedback = JSON.parse(feedback);
    } catch (e) {
      console.error('[FEEDBACK PARSE ERROR]', e);
      // Continue with empty feedback if parsing fails
    }
  }

  // Get persona (default to 'standard')
  const selectedPersona = persona && DEBATE_PERSONAS[persona] ? persona : 'standard';
  
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
    // Call the LLM with context, controversy level, feedback, and persona
    const result = await callLLM(model, party, topic, parsedContext, parsedControversyLevel, parsedFeedback, selectedPersona);

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
    
    // ALWAYS provide a mock response in both production AND development
    // This ensures the UI always gets a response, even during API failures
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
    
    // Provide informative error response only if mock response also fails
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

// Get available debate personas (for paid persona features)
app.get('/api/personas', (req, res) => {
  const personas = Object.keys(DEBATE_PERSONAS).map(key => ({
    id: key,
    name: DEBATE_PERSONAS[key].name,
    description: DEBATE_PERSONAS[key].description,
    isPremium: key !== 'standard' // All personas except 'standard' are premium
  }));

  res.json({
    personas,
    default: 'standard'
  });
});

// Utility endpoint to check API status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    supportedModels: ['OpenAI', 'ChatGPT', 'Claude', 'Cohere', 'Gemini', 'Grok'],
    features: {
      responseClean: true,
      boldnessScoring: true,
      personaSystem: true,
      competitionMode: true
    }
  });
});

// Catch-all route: serve index.html for any other route (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to start the server with fallback ports
function startServer(portOptions) {
  const port = process.env.PORT || portOptions[0];
  
  const server = app.listen(port, () => {
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
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying next available port...`);
      if (portOptions.length > 1) {
        startServer(portOptions.slice(1)); // Try next port
      } 
      else {
        console.error('All ports are busy. Please specify a different port via PORT environment variable.');
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

// Start the server with port fallbacks
startServer(portFallbacks);