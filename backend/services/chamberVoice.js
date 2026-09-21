/**
 * Chamber voice engine — always-on floor speeches.
 * Used when external LLM providers are unavailable.
 * Never advertises itself as demo/mock to clients.
 */

const OPENERS = {
  Democrat: [
    'Look —',
    'Here’s the truth:',
    'I’m not dancing around this:',
    'Say it plain:',
    'Voters already know:'
  ],
  Republican: [
    'Let’s be straight:',
    'Cut the theater:',
    'Hard truth:',
    'Wake up:',
    'No soft language:'
  ],
  Independent: [
    'Both sides are loud. Here’s the center:',
    'Drop the jersey colors for a second:',
    'Reality check:',
    'Neither brand owns this:',
    'Practical take:'
  ]
};

const CLOSER = {
  Democrat: [
    'Protect people first — then argue the footnotes.',
    'If it doesn’t expand opportunity, it’s cosplay.',
    'That’s the floor I’ll die on.',
    'Progress isn’t optional when the clock is loud.'
  ],
  Republican: [
    'Freedom first. Everything else is negotiation.',
    'Don’t trade liberty for a press release.',
    'Competence beats vibes. Every time.',
    'Keep government out of what families can handle.'
  ],
  Independent: [
    'Results over rituals. Scoreboard over slogans.',
    'If both parties hate it, we might be close.',
    'Solve the thing. Skip the loyalist tax.',
    'Common sense isn’t a party platform — it’s a demand.'
  ]
};

const MODEL_SPICE = {
  ChatGPT: ['structured', 'even-keeled', 'receipts-first'],
  Claude: ['careful', 'moral-weight', 'precise'],
  Gemini: ['systems', 'data-tilt', 'wide-lens'],
  Grok: ['needling', 'irreverent', 'needle-sharp'],
  Cohere: ['crisp', 'enterprise-clear', 'direct']
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function cleanTopic(topic) {
  return String(topic || 'the issue')
    .replace(/\?+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

function stanceVerb(party, seed) {
  const map = {
    Democrat: ['expand', 'fund', 'protect', 'regulate for fairness', 'invest in'],
    Republican: ['limit', 'deregulate', 'defend', 'cut waste around', 'keep local control of'],
    Independent: ['pressure-test', 'rebuild incentives around', 'pilot before scaling', 'audit', 'depoliticize']
  };
  return pick(map[party] || map.Independent, seed);
}

function counterBeat(context, party, seed) {
  if (!context || !context.length) return null;
  const last = context[context.length - 1];
  const speaker = last.speaker || 'the last speaker';
  const snippet = String(last.message || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
  const jabs = {
    Democrat: [
      `${speaker} just sold toughness. What I heard was abandonment.`,
      `Cute line from ${speaker}. Thin on who actually gets helped.`,
      `${speaker} waved a flag. I’m asking who pays the bill in real life.`
    ],
    Republican: [
      `${speaker} wrapped bureaucracy in compassion. That’s how liberty dies.`,
      `${speaker} wants a program. I want a principle that survives Tuesday.`,
      `Nice speech, ${speaker}. Now explain the cost without a fairy tale.`
    ],
    Independent: [
      `${speaker} picked a team jersey. I’m picking the outcome that works.`,
      `${speaker} made a nice cheer. Still no operating plan.`,
      `I heard ${speaker}. Volume isn’t a strategy.`
    ]
  };
  const jab = pick(jabs[party] || jabs.Independent, seed);
  return snippet ? `${jab} (They said: “${snippet}${snippet.length >= 90 ? '…' : ''}”)` : jab;
}

/**
 * Compose a floor speech that feels authored, topical, and short enough to share.
 */
function composeChamberVoice({ model = 'ChatGPT', party = 'Independent', topic, context = [], controversyLevel = 80 }) {
  const t = cleanTopic(topic);
  const seed = hash(`${model}|${party}|${t}|${(context || []).length}`);
  const heat = Number(controversyLevel) || 80;
  const opener = pick(OPENERS[party] || OPENERS.Independent, seed);
  const closer = pick(CLOSER[party] || CLOSER.Independent, seed + 3);
  const verb = stanceVerb(party, seed + 7);
  const spice = pick(MODEL_SPICE[model] || MODEL_SPICE.ChatGPT, seed + 11);
  const counter = counterBeat(context, party, seed + 17);

  const core = heat >= 90
    ? `On “${t}”, ${party === 'Independent' ? 'I’m done with the cosplay war' : `a ${party} floor doesn’t blink`}. We ${verb} this — hard — because hesitation is just losing in slow motion.`
    : `On “${t}”, the chamber should ${verb} what actually moves outcomes, not what trends for an hour.`;

  const texture = {
    ChatGPT: `My read is ${spice}: name the tradeoff, pick a side, move.`,
    Claude: `I’ll stay ${spice}, but morality without consequences is just branding.`,
    Gemini: `Zoom out — ${spice}. Systems beat slogans when the lights stay on.`,
    Grok: `I’ll be ${spice}: if your take can’t survive a joke, it can’t survive a vote.`,
    Cohere: `Keep it ${spice}. One claim. One cost. One next step.`
  }[model] || `Keep it ${spice}.`;

  const parts = [opener, core];
  if (counter) parts.push(counter);
  parts.push(texture, closer);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

module.exports = { composeChamberVoice };
