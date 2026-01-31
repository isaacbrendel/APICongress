const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const portFallbacks = [5001, 5000, 5002, 5003, 5004, 5005]; // Multiple port options

// Import intelligent agent system
const DebateContextManager = require('./agents/DebateContextManager');
const ConstitutionalDocumentManager = require('./collaboration/ConstitutionalDocumentManager');
const { getInstance: getVoteStorage } = require('./storage/VoteStorage');
const { getModelFlavor, getModelFlavors, getAllModelFlavors } = require('./config/ModelPersonaFlavors');

// Initialize intelligent systems
const debateManager = new DebateContextManager();
const documentManager = new ConstitutionalDocumentManager();
const voteStorage = getVoteStorage();

console.log('[SYSTEM INIT] ✓ Vote storage initialized');
console.log('[SYSTEM INIT] ✓ Debate manager initialized');
console.log('[SYSTEM INIT] ✓ Document manager initialized');

// Party-to-Agent mapping for message vote learning
// Maps party affiliation to virtual agent IDs for tracking learning
const partyAgentMap = {
  'Democrat': 'party_agent_democrat',
  'Republican': 'party_agent_republican',
  'Independent': 'party_agent_independent'
};

/**
 * Get or create a virtual agent for party-based learning
 */
function getPartyAgent(party) {
  const agentId = partyAgentMap[party];
  let agent = debateManager.getAgent(agentId);

  if (!agent) {
    console.log(`[PARTY AGENT] Creating virtual agent for ${party} party`);
    // Create a virtual agent for this party
    agent = debateManager.registerAgent({
      id: agentId,
      name: `${party} Party Representative`,
      model: 'Virtual',
      party: party,
      personality: {
        progressive: party === 'Democrat' ? 70 : party === 'Republican' ? 30 : 50,
        conservative: party === 'Republican' ? 70 : party === 'Democrat' ? 30 : 50,
        pragmatism: party === 'Independent' ? 70 : 50,
        aggression: 50,
        analytical: 50,
        emotional: 50,
        cooperation: party === 'Independent' ? 60 : 45
      }
    });
    console.log(`[PARTY AGENT] ✓ Created ${party} party agent with ID: ${agentId}`);
  }

  return agent;
}

console.log('[SYSTEM INIT] ✓ Party agent mapping ready');

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
  
  // Use model name to deterministically pick different responses for variety
  // This ensures different AI models get different responses even with same party/topic
  const modelHash = model.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseIndex = modelHash % responseOptions.length;

  // Add some randomness but weighted by model for variety
  const randomOffset = Math.floor(Math.random() * 0.5); // Small random offset
  const finalIndex = (baseIndex + randomOffset) % responseOptions.length;

  const response = responseOptions[finalIndex];
  console.log(`[MOCK MODE] Selected response ${finalIndex} of ${responseOptions.length} for ${model}: "${response.substring(0, 50)}..."`);

  return response;
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
 * Generate competition-grade debate prompts with persona and model flavor support
 * Now with XML structuring, few-shot examples, and model-specific personalities
 */
function generateAdvancedPrompt(party, topic, controversyLevel = 100, strategyNumber = 1, context = [], feedback = {}, persona = 'standard', model = 'OpenAI', flavor = 'balanced') {
  console.log(`[GENERATE PROMPT] ✓ Checkpoint: Generating prompt for ${model} ${flavor} flavor`);
  // NO FILTERING - Let politics be politics
  const sanitizedTopic = topic.slice(0, 300); // Just length limit, no content filtering

  // Get persona configuration
  const personaConfig = DEBATE_PERSONAS[persona] || DEBATE_PERSONAS['standard'];

  // Get model flavor configuration and merge with persona
  const flavorConfig = getModelFlavor(model, flavor);
  console.log(`[GENERATE PROMPT] ✓ Using ${flavorConfig.name} personality configuration`);

  // Merge flavor style modifiers with persona modifiers (flavor takes precedence for model-specific behavior)
  const mergedStyleModifiers = {
    ...personaConfig.styleModifiers,
    ...flavorConfig.styleModifiers
  };

  // CRANKED UP INTENSITY - NO MORE WEAK RESPONSES
  const getIntensityLevel = (level) => {
    if (level >= 90) return { name: 'MAXIMUM', temp: 1.45, desc: 'unfiltered, provocative, ruthless' };
    if (level >= 70) return { name: 'HIGH', temp: 1.4, desc: 'sharp, aggressive, confrontational' };
    if (level >= 40) return { name: 'MODERATE', temp: 1.35, desc: 'assertive, forceful, direct' };
    return { name: 'MILD', temp: 1.3, desc: 'clear, strong, unwavering' };
  };

  const intensity = getIntensityLevel(controversyLevel);

  // MAXIMUM settings - flavor + intensity boost
  const finalTemp = Math.max(mergedStyleModifiers.temperature || intensity.temp, 1.3); // Minimum 1.3
  const finalPresencePenalty = Math.max(mergedStyleModifiers.presence_penalty || 0.7, 0.7); // Minimum 0.7
  const finalFrequencyPenalty = Math.max(mergedStyleModifiers.frequency_penalty || 0.8, 0.8); // Minimum 0.8

  console.log(`[GENERATE PROMPT] ✓ Style config: temp=${finalTemp}, presence=${finalPresencePenalty}, frequency=${finalFrequencyPenalty}`);

  // Few-shot examples for each party (teaches issue-focused argumentation)
  const fewShotExamples = {
    Republican: `Example of strong Republican debate that addresses the SPECIFIC ISSUE:
TOPIC: "Should we increase the federal minimum wage to $15/hour?"
RESPONSE: "A $15 minimum wage kills small business jobs. Entry-level workers lose opportunities when labor costs spike. Let markets set wages, not Washington bureaucrats!"

TOPIC: "Should the government provide free college tuition?"
RESPONSE: "Free college means taxpayers foot the bill for degrees that don't guarantee jobs. Students need skin in the game. Reform costs, don't subsidize failure!"`,

    Democrat: `Example of strong Democrat debate that addresses the SPECIFIC ISSUE:
TOPIC: "Should we increase the federal minimum wage to $15/hour?"
RESPONSE: "Workers can't survive on $7.25 an hour. A $15 minimum wage lifts families out of poverty. No one working full-time should be homeless!"

TOPIC: "Should the government provide free college tuition?"
RESPONSE: "Student debt crushes an entire generation. Free public college unlocks opportunity for everyone, not just the wealthy. Education is infrastructure for the future!"`,

    Independent: `Example of strong Independent debate that addresses the SPECIFIC ISSUE:
TOPIC: "Should we increase the federal minimum wage to $15/hour?"
RESPONSE: "Flat $15 ignores regional costs. Index minimum wage to local living costs. One-size-fits-all fails rural and urban workers alike!"

TOPIC: "Should the government provide free college tuition?"
RESPONSE: "Free college without quality reform wastes money. Fund community colleges and trade schools. Not everyone needs a four-year degree!"`
  };

  // DIRECT DEBATE FRAMING - AUTHENTIC POLITICAL DISCOURSE
  const competitionFrame = `<DEBATE_CONTEXT>
<ROLE>You are a passionate ${party} political advocate engaged in substantive debate</ROLE>
<CHARACTER>${flavorConfig.name}: ${flavorConfig.description}</CHARACTER>
<OBJECTIVE>Make compelling arguments that resonate with voters and win hearts and minds.</OBJECTIVE>

<POLITICAL_STANCE>
${party === 'Democrat' ? 'You believe in progressive values: social justice, government investment in people, environmental protection, workers rights, and expanding opportunity for all.' :
  party === 'Republican' ? 'You believe in conservative values: individual liberty, limited government, free markets, traditional institutions, and personal responsibility.' :
  'You are an independent thinker who critiques both parties and seeks practical, common-sense solutions beyond partisan gridlock.'}
</POLITICAL_STANCE>

<GUIDELINES>
1. Address "${sanitizedTopic}" directly and substantively
2. Take a clear, confident position - no waffling
3. Speak as yourself - a real person with convictions
4. Be direct and passionate, not bureaucratic
5. 50-100 words - make every word count
6. If responding to an opponent, engage with their actual argument
7. Use vivid language and concrete examples
8. Show genuine conviction - this matters to you
</GUIDELINES>

<PERSONA>${personaConfig.name}: ${personaConfig.description}</PERSONA>
<STYLE>${flavorConfig.promptAddition}</STYLE>
</DEBATE_CONTEXT>

${fewShotExamples[party]}

${personaConfig.promptAddition}

Speak authentically about "${sanitizedTopic}" from your ${party} perspective.`;

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
  const userPrompt = `<TOPIC>"${sanitizedTopic}"</TOPIC>
${contextAddition}
${feedbackAddition}

Give your ${party} perspective (50-100 words, confident and substantive):`;

  console.log(`[GENERATE PROMPT] ✓ Prompt generated successfully`);

  return {
    systemPrompt: competitionFrame,
    userPrompt: userPrompt,
    temperature: finalTemp,
    presence_penalty: finalPresencePenalty,
    frequency_penalty: finalFrequencyPenalty,
    strategyName: `${flavorConfig.name} (${personaConfig.name})`,
    intensity: intensity.name,
    persona: personaConfig.name,
    flavor: flavor,
    flavorName: flavorConfig.name
  };
}

/**
 * Call the appropriate LLM API with retry logic and controversy scaling
 * Now with response cleaning, boldness scoring, and model flavor support
 */
async function callLLM(model, party, topic, context = [], controversyLevel = 100, feedback = {}, persona = 'standard', flavor = 'balanced') {
  const maxAttempts = 3;
  let lastError = null;

  console.log(`[CALL LLM] ✓ Checkpoint: Starting LLM call for ${model} with ${flavor} flavor`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const promptConfig = generateAdvancedPrompt(party, topic, controversyLevel, attempt, context, feedback, persona, model, flavor);

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
    retryOnWeak = false, // Disabled - let responses through
    max_tokens = 250 // Generous token limit for quality responses
  } = additionalParams;

  // Check for required API key
  let apiKeyName;
  switch (model) {
    case 'OpenAI':
    case 'ChatGPT':
      apiKeyName = 'OPENAI_API_KEY';
      break;
    case 'Claude':
      apiKeyName = 'ANTHROPIC_API_KEY';
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
        // Using chat completions API with enhanced competition parameters
        console.log(`[OPENAI REQUEST] Calling OpenAI with competition parameters`, {
          temperature,
          presence_penalty,
          frequency_penalty
        });

        const requestBody = {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: max_tokens, // Configurable based on use case
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
        // Using Claude Sonnet for quality responses
        console.log(`[CLAUDE REQUEST] Calling Anthropic Claude API`);

        const requestBody = {
          model: "claude-sonnet-4-20250514",
          max_tokens: 250,
          temperature: temperature, // Dynamic temperature based on controversy level
          messages: [{ role: "user", content: userPrompt }],
          system: systemPrompt  // System prompt as a separate parameter
        };
        
        const response = await myFetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
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
          model: "command-r-plus",  // Cohere's best model
          message: userPrompt,         // Single message as string, not array
          preamble: systemPrompt,      // System instructions as preamble
          max_tokens: 250,
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
          max_tokens: 250,
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
            maxOutputTokens: 250,
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
 * FULL DEBATE FLOW: Arguments → Documents
 * Two-stage process: generate debate arguments, then synthesize into votable documents
 */
app.post('/api/debate-flow', async (req, res) => {
  const startTime = Date.now();
  const {
    topic,
    model = 'OpenAI',
    controversyLevel = 100,
    documentType = 'policy_proposal',
    rounds = 2, // Number of debate rounds before document generation
    personas = {} // { Democrat: 'the_firebrand', Republican: 'standard', Independent: 'the_realist' }
  } = req.body;

  console.log('[DEBATE FLOW] Starting full debate + document generation', {
    topic,
    model,
    rounds,
    documentType
  });

  try {
    // STAGE 1: Generate debate arguments (multiple rounds)
    const debateArguments = [];
    const parties = ['Democrat', 'Republican', 'Independent'];

    for (let round = 1; round <= rounds; round++) {
      console.log(`[DEBATE FLOW] Round ${round}/${rounds}`);

      // Generate arguments from all parties in parallel
      const roundArguments = await Promise.all(
        parties.map(async (party) => {
          const persona = personas[party] || 'standard';

          // Use previous debate arguments as context
          const context = debateArguments.map(arg => ({
            speaker: arg.party,
            message: arg.content
          }));

          const argument = await callLLM(
            model,
            party,
            topic,
            context,
            controversyLevel,
            {},
            persona
          );

          return {
            party,
            affiliation: party,
            content: argument,
            round,
            persona,
            timestamp: new Date().toISOString()
          };
        })
      );

      debateArguments.push(...roundArguments);
    }

    console.log(`[DEBATE FLOW] Debate complete: ${debateArguments.length} arguments generated`);

    // STAGE 2: Generate policy documents from debate arguments
    console.log('[DEBATE FLOW] Stage 2: Synthesizing documents');

    // Generate Democrat and Republican documents in parallel
    const [democratDocument, republicanDocument] = await Promise.all([
      synthesizeDebateIntoDocument('Democrat', topic, debateArguments, documentType),
      synthesizeDebateIntoDocument('Republican', topic, debateArguments, documentType)
    ]);

    // Determine Independent strategy
    const independentArgs = debateArguments
      .filter(arg => arg.party === 'Independent')
      .map(arg => arg.content);

    const independentStrategy = determineIndependentStrategy(
      democratDocument,
      republicanDocument,
      independentArgs
    );

    let independentDocument;

    if (independentStrategy.strategy === 'coalition') {
      // Independent coalitions with a party
      console.log(`[DEBATE FLOW] Independent forming coalition with ${independentStrategy.coalitionWith}`);

      independentDocument = {
        party: 'Independent',
        documentType: 'coalition',
        coalitionWith: independentStrategy.coalitionWith,
        coalitionScore: independentStrategy.score,
        topic,
        content: `**Independent Coalition with ${independentStrategy.coalitionWith}**\n\nAfter careful analysis, the Independent party supports the ${independentStrategy.coalitionWith} proposal on "${topic}". While maintaining our independent perspective, we find their approach aligns with pragmatic solutions.\n\nKey Independent priorities addressed:\n${independentArgs.slice(0, 2).map((arg, i) => `${i + 1}. ${arg}`).join('\n')}`,
        generatedAt: new Date().toISOString(),
        isCoalition: true
      };
    } else {
      // Independent creates own document
      console.log('[DEBATE FLOW] Independent creating distinct proposal');
      independentDocument = await synthesizeDebateIntoDocument(
        'Independent',
        topic,
        debateArguments,
        documentType
      );
    }

    const responseTime = Date.now() - startTime;
    console.log(`[DEBATE FLOW] Complete in ${responseTime}ms`);

    res.json({
      success: true,
      topic,
      debate: {
        rounds,
        arguments: debateArguments,
        totalArguments: debateArguments.length
      },
      documents: {
        democrat: democratDocument,
        republican: republicanDocument,
        independent: independentDocument
      },
      independentStrategy: independentStrategy,
      generationTime: responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBATE FLOW ERROR]', error);
    res.status(500).json({
      error: 'Failed to complete debate flow',
      message: error.message
    });
  }
});

/**
 * ELITE DOCUMENT GENERATION + INDEPENDENT ALIGNMENT
 * Generates proposals, Independent picks a side using AI
 */
app.post('/api/generate-proposals', async (req, res) => {
  const startTime = Date.now();
  const { topic, controversyLevel = 100 } = req.body;

  console.log('[PROPOSALS] ✓ Starting elite proposal generation with Independent alignment');
  console.log(`[PROPOSALS] Topic: "${topic}"`);

  try {
    // STAGE 1: Generate quick debate arguments (1 round, aggressive)
    console.log('[PROPOSALS] ✓ Stage 1: Generating debate arguments');

    const parties = ['Democrat', 'Republican'];
    const debateArguments = [];

    // Parallel generation - FAST
    const roundArguments = await Promise.all(
      parties.map(async (party) => {
        const argument = await callLLM(
          'Cohere', // Best performer
          party,
          topic,
          [],
          controversyLevel,
          {},
          'standard',
          'aggressive' // Use aggressive flavor
        );

        return {
          party,
          affiliation: party,
          content: argument,
          timestamp: new Date().toISOString()
        };
      })
    );

    debateArguments.push(...roundArguments);
    console.log(`[PROPOSALS] ✓ Generated ${debateArguments.length} debate arguments`);

    // STAGE 2: Generate Democrat and Republican proposals
    console.log('[PROPOSALS] ✓ Stage 2: Synthesizing proposals');

    const [democratProposal, republicanProposal] = await Promise.all([
      synthesizeDebateIntoDocument('Democrat', topic, debateArguments, 'policy_proposal'),
      synthesizeDebateIntoDocument('Republican', topic, debateArguments, 'policy_proposal')
    ]);

    console.log('[PROPOSALS] ✓ Both proposals generated');

    // STAGE 3: INDEPENDENT AI ALIGNMENT - Uses AI to pick a side
    console.log('[PROPOSALS] ✓ Stage 3: Independent analyzing proposals with AI');

    const independentAlignmentPrompt = {
      system: `You are an Independent political analyst reviewing two competing policy proposals.

Your job: Read both proposals and decide which one you support based on:
- Practical effectiveness
- Evidence-based reasoning
- Balancing competing interests
- Long-term consequences

You MUST pick one. No "both have merit" bullshit. Make a decision.

Respond in this EXACT format:
DECISION: [Democrat/Republican]
REASONING: [2-3 sentences explaining why]
CONFIDENCE: [0-100]`,

      user: `TOPIC: "${topic}"

DEMOCRAT PROPOSAL:
${democratProposal.content}

REPUBLICAN PROPOSAL:
${republicanProposal.content}

Which proposal do you support? Make your decision now.`
    };

    console.log('[PROPOSALS] ✓ Sending alignment request to AI');

    const alignmentResponse = await executeLLMCall(
      'Claude', // Use Claude for analysis
      independentAlignmentPrompt.system,
      independentAlignmentPrompt.user,
      0.9, // Slightly lower temp for analysis
      {
        max_tokens: 200,
        presence_penalty: 0.5,
        frequency_penalty: 0.6,
        cleanResponse: false,
        retryOnWeak: false
      }
    );

    console.log('[PROPOSALS] ✓ Independent alignment decision received');

    // Parse Independent decision
    const decisionMatch = alignmentResponse.match(/DECISION:\s*(Democrat|Republican)/i);
    const reasoningMatch = alignmentResponse.match(/REASONING:\s*(.+?)(?=CONFIDENCE:|$)/is);
    const confidenceMatch = alignmentResponse.match(/CONFIDENCE:\s*(\d+)/);

    const alignedWith = decisionMatch ? decisionMatch[1] : 'Democrat'; // Default to Democrat if parsing fails
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Analysis completed';
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

    console.log(`[PROPOSALS] ✓ Independent aligns with: ${alignedWith} (${confidence}% confidence)`);

    const independentDocument = {
      party: 'Independent',
      documentType: 'coalition',
      alignedWith: alignedWith,
      confidence: confidence,
      reasoning: reasoning,
      topic: topic,
      content: `## Independent Party Official Statement\n\n**The Independent Party hereby SIGNS ONTO the ${alignedWith} proposal** on "${topic}".\n\n**Why we're supporting the ${alignedWith} position:**\n${reasoning}\n\n**Confidence in this decision:** ${confidence}%\n\nThe Independent party endorses the ${alignedWith} proposal as the superior approach to this issue. We formally add our support to their position.`,
      generatedAt: new Date().toISOString(),
      isCoalition: true
    };

    const responseTime = Date.now() - startTime;
    console.log(`[PROPOSALS] ✓ COMPLETE in ${responseTime}ms`);

    res.json({
      success: true,
      topic,
      debate: {
        arguments: debateArguments,
        totalArguments: debateArguments.length
      },
      proposals: {
        democrat: democratProposal,
        republican: republicanProposal,
        independent: independentDocument
      },
      alignment: {
        party: alignedWith,
        reasoning: reasoning,
        confidence: confidence,
        rawResponse: alignmentResponse
      },
      generationTime: responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PROPOSALS] ✗ ERROR:', error);
    res.status(500).json({
      error: 'Failed to generate proposals',
      message: error.message
    });
  }
});

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
 * STAGE 2: DOCUMENT SYNTHESIS FROM DEBATE
 * Generates concrete policy documents based on debate arguments
 */
async function synthesizeDebateIntoDocument(party, topic, debateArguments, documentType = 'policy_proposal') {
  console.log(`[DOCUMENT SYNTHESIS] Generating ${documentType} for ${party} based on debate`);

  // Compile all arguments from this party
  const partyArguments = debateArguments
    .filter(arg => arg.affiliation === party || arg.party === party)
    .map(arg => arg.message || arg.argument)
    .join(' ');

  // Compile opponent arguments for context
  const opponentArguments = debateArguments
    .filter(arg => arg.affiliation !== party && arg.party !== party)
    .map(arg => arg.message || arg.argument)
    .join(' ');

  let documentPrompt;

  if (documentType === 'policy_proposal') {
    documentPrompt = {
      system: `You are a ${party} policy writer creating a VOTABLE POLICY PROPOSAL.

Your debate team just argued about "${topic}". Now synthesize those arguments into a document users will read and vote on.

CRITICAL FORMAT REQUIREMENTS:
1. **SUMMARY** (3-4 sentences at the very top)
   - Clear position statement
   - Core reasoning in plain language
   - What this achieves

2. **LONG-FORM PROPOSITION** (detailed explanation)
   - Specific policy measures (3-5 concrete actions)
   - Implementation details and timeline
   - Expected outcomes with evidence
   - Response to main counterarguments
   - Why this matters

STYLE:
- Total length: 200-350 words
- NO hedging - this is your party's official position
- Write as if this will be voted on by users
- Be SPECIFIC and ACTIONABLE
- Use clear headings: "## Summary" and "## Proposition"

This document must be compelling enough to win votes!`,

      user: `DEBATE TOPIC: "${topic}"

YOUR PARTY'S ARGUMENTS:
${partyArguments}

OPPONENT'S ARGUMENTS (for context):
${opponentArguments}

Generate the ${party} POLICY PROPOSAL in the required format (Summary + Long-Form Proposition):`
    };

    console.log(`[DOCUMENT SYNTHESIS] ✓ Checkpoint: ${party} policy proposal prompt prepared`);

  } else if (documentType === 'position_statement') {
    documentPrompt = {
      system: `You are a ${party} party official writing an OFFICIAL POSITION STATEMENT for user voting.

Your debate team argued about "${topic}". Now create the party's official stance document.

FORMAT:
1. **SUMMARY** (2-3 sentences)
   - Clear stance (support/oppose)
   - Why this position matters

2. **POSITION EXPLANATION** (detailed)
   - 3 core reasons backing your position
   - Response to main opposition argument
   - Call to action

STYLE:
- Total length: 150-250 words
- Direct, forceful language
- Use headings: "## Summary" and "## Our Position"
- This is what your party officially believes`,

      user: `DEBATE TOPIC: "${topic}"

YOUR ARGUMENTS:
${partyArguments}

OPPONENT ARGUMENTS:
${opponentArguments}

Write the official ${party} POSITION STATEMENT in the required format:`
    };

    console.log(`[DOCUMENT SYNTHESIS] ✓ Checkpoint: ${party} position statement prompt prepared`);
  }

  console.log(`[DOCUMENT SYNTHESIS] ✓ Checkpoint: Sending document generation request to LLM`);

  // Generate document with higher temperature for creativity but structured output
  const document = await executeLLMCall(
    'Cohere', // Using Cohere as user mentioned it performs well
    documentPrompt.system,
    documentPrompt.user,
    1.1, // Slightly lower temp for more coherent documents
    {
      presence_penalty: 0.5,
      frequency_penalty: 0.6,
      cleanResponse: true,
      retryOnWeak: false, // Don't retry documents, they're longer
      max_tokens: documentType === 'policy_proposal' ? 500 : 350 // More tokens for summary + long-form
    }
  );

  console.log(`[DOCUMENT SYNTHESIS] ✓ ${party} ${documentType} completed - ${document.length} chars`);
  console.log(`[DOCUMENT SYNTHESIS] ✓ Word count: ${document.split(/\s+/).length} words`);

  const result = {
    party,
    documentType,
    topic,
    content: document,
    wordCount: document.split(/\s+/).length,
    generatedAt: new Date().toISOString()
  };

  console.log(`[DOCUMENT SYNTHESIS] ✓ Document object prepared for ${party}`);

  return result;
}

/**
 * INDEPENDENT COALITION LOGIC
 * Determines if Independent should create own document or coalition with a party
 */
function determineIndependentStrategy(democratDocument, republicanDocument, independentArguments) {
  // Simple heuristic: if Independent arguments are closer to one party, coalition
  // Otherwise, create own document

  const independentText = independentArguments.join(' ').toLowerCase();
  const democratText = democratDocument.content.toLowerCase();
  const republicanText = republicanDocument.content.toLowerCase();

  // Count overlapping key policy words
  const policyWords = independentText.match(/\b\w{5,}\b/g) || [];

  let democratOverlap = 0;
  let republicanOverlap = 0;

  policyWords.forEach(word => {
    if (democratText.includes(word)) democratOverlap++;
    if (republicanText.includes(word)) republicanOverlap++;
  });

  const totalOverlap = democratOverlap + republicanOverlap;
  const democratScore = totalOverlap > 0 ? democratOverlap / totalOverlap : 0;
  const republicanScore = totalOverlap > 0 ? republicanOverlap / totalOverlap : 0;

  // If strong alignment (>65%) with one party, coalition
  // Otherwise, create own document
  if (democratScore > 0.65) {
    return { strategy: 'coalition', coalitionWith: 'Democrat', score: democratScore };
  } else if (republicanScore > 0.65) {
    return { strategy: 'coalition', coalitionWith: 'Republican', score: republicanScore };
  } else {
    return { strategy: 'independent', reason: 'Distinct position warrants own proposal' };
  }
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

    // Get agent and debate
    const agent = debateManager.getAgent(agentId);
    const debate = debateManager.activeDebates.get(debateId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    // Get party from agent
    const party = agent.party || 'Independent';
    const model = agent.model || 'ChatGPT';

    // Use the callLLM function which handles mock responses
    const argument = await callLLM(model, party, debate.topic, [], debate.controversyLevel || 100, {});

    // Create turn object
    const turn = {
      agentId: agent.id,
      agentName: agent.name,
      party: party,
      model: model,
      argument: argument,
      timestamp: new Date().toISOString()
    };

    // Add to debate turns
    debate.turns = debate.turns || [];
    debate.turns.push(turn);

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
      // SEVERELY PUNISH failed patterns - make bad responses hurt
      agent.performance.argumentsDownvoted++;
      agent.performance.influenceScore = Math.max(0, agent.performance.influenceScore - 10); // TRIPLED punishment

      // Mark strategy as highly ineffective
      const lastDebate = agent.memory.debateHistory[agent.memory.debateHistory.length - 1];
      if (lastDebate && lastDebate.strategyUsed) {
        agent.learnFromDebate(lastDebate.strategyUsed, false);

        // MASSIVE reduction to dominant trait - force adaptation
        const profile = agent.getPersonalityProfile();
        if (profile.traits.length > 0) {
          const dominantTrait = profile.traits[0];

          if (dominantTrait.includes('aggressive')) {
            agent.adaptPersonality('aggression', -8, 'DOWNVOTED - severely reducing aggression');
            agent.adaptPersonality('pragmatism', 8, 'DOWNVOTED - forcing pragmatic shift');
            personalityShifts.push('aggression -8, pragmatism +8');
          } else if (dominantTrait.includes('analytical')) {
            agent.adaptPersonality('analytical', -8, 'DOWNVOTED - severely reducing analysis');
            agent.adaptPersonality('emotional', 8, 'DOWNVOTED - forcing emotional connection');
            personalityShifts.push('analytical -8, emotional +8');
          } else if (dominantTrait.includes('emotional')) {
            agent.adaptPersonality('emotional', -8, 'DOWNVOTED - severely reducing emotion');
            agent.adaptPersonality('analytical', 8, 'DOWNVOTED - forcing logical approach');
            personalityShifts.push('emotional -8, analytical +8');
          } else if (dominantTrait.includes('diplomatic') || dominantTrait.includes('cooperation')) {
            // Punish being too weak/diplomatic
            agent.adaptPersonality('cooperation', -8, 'DOWNVOTED - being too soft');
            agent.adaptPersonality('aggression', 8, 'DOWNVOTED - need more fight');
            personalityShifts.push('cooperation -8, aggression +8');
          }
        }

        // Additional punishment: reduce all weak traits
        agent.adaptPersonality('pragmatism', 5, 'DOWNVOTED - increase substance');
        personalityShifts.push('pragmatism +5 (force substance)');
      }

      console.log(`[RL] ${agent.name} SEVERELY PUNISHED: -10 influence, ${personalityShifts.join(', ')}`);
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
      message: voteType === 'up' ? '✓ Argument reinforced!' : '✗✗✗ SEVERELY PUNISHED - agent forced to adapt!',
      agent: agent.getSummary(),
      influenceChange: voteType === 'up' ? +5 : -10,
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

// Process message vote from debate screen - FULL RL INTEGRATION
app.post('/api/vote/message', async (req, res) => {
  try {
    const { messageId, voteType, affiliation, timestamp, topic, messageContent } = req.body;

    if (!messageId || !affiliation) {
      return res.status(400).json({ error: 'Message ID and affiliation required' });
    }

    console.log(`[MESSAGE VOTE] ${voteType || 'null'} vote for message ${messageId} from ${affiliation} on topic: ${topic}`);
    console.log(`[MESSAGE VOTE] ✓ Checkpoint 1: Vote received`);

    let personalityShifts = [];
    let learningResult = null;

    // Track the vote with persistent storage
    if (voteType === null) {
      // Remove vote
      voteStorage.removeVote(messageId);
      console.log(`[MESSAGE VOTE] ✓ Checkpoint 2: Vote removed from persistent storage`);
    } else {
      // Add or update vote
      const voteData = {
        voteType,
        affiliation,
        timestamp: timestamp || Date.now(),
        topic,
        messageContent: messageContent ? messageContent.substring(0, 200) : null
      };

      voteStorage.recordVote(messageId, voteData);
      console.log(`[MESSAGE VOTE] ✓ Checkpoint 2: Vote saved to persistent storage`);

      // TRIGGER AGENT LEARNING - This is the key RL integration!
      console.log(`[MESSAGE VOTE] ✓ Checkpoint 3: Starting agent learning process`);

      try {
        const agent = getPartyAgent(affiliation);
        console.log(`[MESSAGE VOTE] ✓ Checkpoint 4: Retrieved agent for ${affiliation}`);

        // Record vote in agent's memory
        if (!agent.memory.voteHistory) {
          agent.memory.voteHistory = [];
        }

        const voteRecord = {
          messageId: messageId,
          voteType: voteType,
          timestamp: timestamp || Date.now(),
          topic: topic,
          personalitySnapshot: { ...agent.personality }
        };

        agent.memory.voteHistory.push(voteRecord);
        if (agent.memory.voteHistory.length > 100) {
          agent.memory.voteHistory = agent.memory.voteHistory.slice(-100);
        }

        console.log(`[MESSAGE VOTE] ✓ Checkpoint 5: Added vote to agent memory`);

        // Apply reinforcement learning to personality
        if (voteType === 'up') {
          console.log(`[RL LEARNING] ${affiliation} received UPVOTE - reinforcing successful patterns`);

          agent.performance.argumentsUpvoted++;
          agent.performance.influenceScore += 5;

          // Reinforce dominant personality trait
          const profile = agent.getPersonalityProfile();
          if (profile.traits && profile.traits.length > 0) {
            const dominantTrait = profile.traits[0];

            if (dominantTrait.includes('aggressive') || dominantTrait.includes('confrontational')) {
              agent.adaptPersonality('aggression', 2, `Message upvoted on "${topic}" - reinforcing aggression`);
              personalityShifts.push('aggression +2');
            } else if (dominantTrait.includes('analytical') || dominantTrait.includes('data-driven')) {
              agent.adaptPersonality('analytical', 2, `Message upvoted on "${topic}" - reinforcing analytical approach`);
              personalityShifts.push('analytical +2');
            } else if (dominantTrait.includes('emotional') || dominantTrait.includes('passionate')) {
              agent.adaptPersonality('emotional', 2, `Message upvoted on "${topic}" - reinforcing emotional appeal`);
              personalityShifts.push('emotional +2');
            } else if (dominantTrait.includes('pragmatic') || dominantTrait.includes('practical')) {
              agent.adaptPersonality('pragmatism', 2, `Message upvoted on "${topic}" - reinforcing pragmatism`);
              personalityShifts.push('pragmatism +2');
            }
          }

          console.log(`[RL LEARNING] ✓ ${affiliation}: +5 influence, ${personalityShifts.join(', ')}`);

        } else if (voteType === 'down') {
          console.log(`[RL LEARNING] ${affiliation} received DOWNVOTE - adjusting unsuccessful patterns`);

          agent.performance.argumentsDownvoted++;
          agent.performance.influenceScore = Math.max(0, agent.performance.influenceScore - 3);

          // Adjust personality - reduce dominant trait, increase compensating trait
          const profile = agent.getPersonalityProfile();
          if (profile.traits && profile.traits.length > 0) {
            const dominantTrait = profile.traits[0];

            if (dominantTrait.includes('aggressive') || dominantTrait.includes('confrontational')) {
              agent.adaptPersonality('aggression', -3, `Message downvoted on "${topic}" - reducing aggression`);
              agent.adaptPersonality('pragmatism', 3, `Message downvoted on "${topic}" - increasing pragmatism`);
              personalityShifts.push('aggression -3, pragmatism +3');
            } else if (dominantTrait.includes('analytical')) {
              agent.adaptPersonality('analytical', -3, `Message downvoted on "${topic}" - reducing pure analysis`);
              agent.adaptPersonality('emotional', 3, `Message downvoted on "${topic}" - adding emotional appeal`);
              personalityShifts.push('analytical -3, emotional +3');
            } else if (dominantTrait.includes('emotional')) {
              agent.adaptPersonality('emotional', -3, `Message downvoted on "${topic}" - reducing emotionality`);
              agent.adaptPersonality('analytical', 3, `Message downvoted on "${topic}" - adding logic`);
              personalityShifts.push('emotional -3, analytical +3');
            }
          }

          console.log(`[RL LEARNING] ✓ ${affiliation}: -3 influence, ${personalityShifts.join(', ')}`);
        }

        console.log(`[MESSAGE VOTE] ✓ Checkpoint 6: Agent personality updated`);

        // Save agent state
        await agent.save();
        console.log(`[MESSAGE VOTE] ✓ Checkpoint 7: Agent state persisted to disk`);

        learningResult = {
          agentName: agent.name,
          influenceChange: voteType === 'up' ? +5 : -3,
          currentInfluence: agent.performance.influenceScore,
          personalityShifts: personalityShifts,
          totalVotes: agent.performance.argumentsUpvoted + agent.performance.argumentsDownvoted
        };

      } catch (agentError) {
        console.error(`[MESSAGE VOTE] ✗ Agent learning error:`, agentError.message);
        // Continue even if agent learning fails
      }
    }

    // Calculate aggregate stats
    const stats = voteStorage.getStats(affiliation, topic);
    console.log(`[MESSAGE VOTE] ✓ Checkpoint 8: Stats calculated`);

    // Get recent trend
    const trend = voteStorage.getRecentTrend(affiliation, 10);
    console.log(`[MESSAGE VOTE] ✓ Checkpoint 9: Trend analysis complete`);

    // Return comprehensive feedback
    const response = {
      success: true,
      message: voteType === 'up'
        ? '✓ Message upvoted! Agent learning applied.'
        : voteType === 'down'
        ? '✗ Message downvoted! Agent adapting strategy.'
        : '🔄 Vote removed',
      messageId,
      voteType,
      stats: {
        upvotes: stats.upvotes,
        downvotes: stats.downvotes,
        total: stats.total,
        approvalRate: stats.approvalRate + '%',
        netScore: stats.netScore,
        affiliation,
        topic
      },
      trend: {
        direction: trend.trend,
        recentUpvotes: trend.upvotes,
        recentDownvotes: trend.downvotes
      },
      learning: learningResult
    };

    console.log(`[MESSAGE VOTE] ✓ Checkpoint 10: Response prepared, sending to client`);

    res.json(response);

  } catch (error) {
    console.error('[MESSAGE VOTE] ✗ CRITICAL ERROR:', error);
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

// API endpoint to call an LLM with the given parameters (POST version)
app.post('/api/llm', async (req, res) => {
  const startTime = Date.now();
  const { model, party, topic, context, controversyLevel, feedback, persona, flavor } = req.body;

  console.log(`[API /api/llm POST] Request: model=${model}, party=${party}, topic=${topic?.substring(0, 30)}`);

  try {
    const response = await callLLM(
      model || 'ChatGPT',
      party || 'Independent',
      topic || 'general debate',
      context || [],
      controversyLevel || 100,
      feedback || {},
      persona || 'standard',
      flavor || 'balanced'
    );

    res.json({ success: true, response });
  } catch (error) {
    console.error('[API /api/llm POST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to call an LLM with the given parameters (GET version)
app.get('/api/llm', async (req, res) => {
  const startTime = Date.now();
  const { model, party, topic, context, controversyLevel, feedback, persona, flavor } = req.query;

  console.log(`[API /api/llm] ✓ Checkpoint 1: Request received - model=${model}, party=${party}, flavor=${flavor}`);

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

  // Get model flavor (default to 'balanced')
  const selectedFlavor = flavor || 'balanced';
  console.log(`[API /api/llm] ✓ Checkpoint 2: Using persona=${selectedPersona}, flavor=${selectedFlavor}`);

  // Log incoming request
  console.log(`[API REQUEST] /api/llm`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    model,
    party,
    topic,
    persona: selectedPersona,
    flavor: selectedFlavor,
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
    console.log(`[API /api/llm] ✓ Checkpoint 3: Calling LLM with flavor configuration`);

    // Call the LLM with context, controversy level, feedback, persona, and flavor
    const result = await callLLM(model, party, topic, parsedContext, parsedControversyLevel, parsedFeedback, selectedPersona, selectedFlavor);

    console.log(`[API /api/llm] ✓ Checkpoint 4: LLM call successful`);

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

// Get all model flavors (3 per model)
app.get('/api/model-flavors', (req, res) => {
  try {
    console.log('[API] ✓ Fetching all model flavors');
    const allFlavors = getAllModelFlavors();

    res.json({
      success: true,
      models: allFlavors,
      flavorCount: 3,
      description: 'Each model has 3 personality flavors that evolve through user voting'
    });
  } catch (error) {
    console.error('[API ERROR] Failed to get model flavors:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get flavors for a specific model
app.get('/api/model-flavors/:model', (req, res) => {
  try {
    const { model } = req.params;
    console.log(`[API] ✓ Fetching flavors for ${model}`);

    const flavors = getModelFlavors(model);

    if (!flavors) {
      return res.status(404).json({ error: `Model ${model} not found` });
    }

    res.json({
      success: true,
      model,
      flavors,
      description: `Three personality flavors for ${model} that evolve based on votes`
    });
  } catch (error) {
    console.error('[API ERROR] Failed to get model flavors:', error);
    res.status(500).json({ error: error.message });
  }
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
      'Claude': !!process.env.ANTHROPIC_API_KEY,
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