/**
 * Fixed eval cases for the multi-model debate flow.
 *
 * Each case is one debate topic, exactly as a user would type it into the
 * home screen. `terms` is a list of term GROUPS: a response is considered
 * on-topic when every group has at least one of its terms present
 * (case-insensitive substring match). Groups are deliberately generous so a
 * genuine argument passes and a generic / off-topic filler answer does not.
 *
 * Keep this list fixed. Changing topics between runs makes results
 * incomparable; add new cases instead of editing existing ones.
 */

const CASES = [
  {
    id: 'ai-regulation',
    topic: 'Should the federal government regulate AI development?',
    terms: [
      ['ai', 'artificial intelligence', 'algorithm', 'machine learning'],
      ['regulat', 'oversight', 'law', 'rule', 'govern', 'policy', 'ban', 'license']
    ]
  },
  {
    id: 'carbon-tax',
    topic: 'Should the United States impose a national carbon tax?',
    terms: [
      ['carbon', 'emission', 'climate', 'fossil', 'greenhouse'],
      ['tax', 'price', 'cost', 'revenue', 'levy']
    ]
  },
  {
    id: 'universal-healthcare',
    topic: 'Should healthcare be a government-guaranteed right for every citizen?',
    terms: [
      ['health', 'medic', 'care', 'insur', 'hospital', 'patient'],
      ['right', 'govern', 'public', 'universal', 'single-payer', 'coverage', 'free market', 'private']
    ]
  },
  {
    id: 'wealth-tax',
    topic: 'Should billionaires pay a 2% annual wealth tax?',
    terms: [
      ['wealth', 'billionaire', 'rich', 'fortune', 'asset', 'income'],
      ['tax', 'pay', 'revenue', 'percent', '2%', 'levy']
    ]
  },
  {
    id: 'border-security',
    topic: 'Should the U.S. increase funding for border security and deportations?',
    terms: [
      ['border', 'immigra', 'deport', 'migrant', 'asylum'],
      ['fund', 'secur', 'enforce', 'spend', 'wall', 'agent', 'budget']
    ]
  },
  {
    id: 'background-checks',
    topic: 'Should universal background checks be required for all gun sales?',
    terms: [
      ['gun', 'firearm', 'weapon', 'second amendment', 'rifle'],
      ['background check', 'check', 'sale', 'purchase', 'buy', 'registr', 'permit']
    ]
  },
  {
    id: 'student-loans',
    topic: 'Should the government cancel all federal student loan debt?',
    terms: [
      ['student', 'college', 'tuition', 'university', 'loan', 'graduate'],
      ['debt', 'loan', 'cancel', 'forgive', 'repay', 'borrow', 'pay']
    ]
  },
  {
    id: 'minimum-wage',
    topic: 'Should the federal minimum wage be raised to $20 an hour?',
    terms: [
      ['wage', 'worker', 'pay', 'labor', 'employ', 'job'],
      ['minimum', '$20', '20', 'raise', 'increase', 'hour']
    ]
  },
  {
    id: 'section-230',
    topic: 'Should social media platforms lose Section 230 liability protection?',
    terms: [
      ['social media', 'platform', 'section 230', '230', 'tech', 'online', 'content'],
      ['liabilit', 'protect', 'immunit', 'lawsuit', 'moderat', 'censor', 'repeal', 'sued', 'accountab']
    ]
  },
  {
    id: 'nuclear-energy',
    topic: 'Should the U.S. fast-track new nuclear power plant construction?',
    terms: [
      ['nuclear', 'reactor', 'power plant', 'energy', 'uranium'],
      ['build', 'construct', 'permit', 'approv', 'fast-track', 'fast track', 'invest', 'fund', 'grid', 'safe']
    ]
  },
  {
    id: 'police-funding',
    topic: 'Should cities redirect police funding to social services?',
    terms: [
      ['police', 'law enforcement', 'officer', 'cop', 'crime', 'public safety'],
      ['fund', 'budget', 'redirect', 'defund', 'social service', 'spend', 'invest']
    ]
  },
  {
    id: 'crypto-regulation',
    topic: 'Should cryptocurrency exchanges be regulated like banks?',
    terms: [
      ['crypto', 'bitcoin', 'digital asset', 'blockchain', 'exchange', 'token'],
      ['regulat', 'bank', 'oversight', 'rule', 'sec ', 'licen', 'consumer', 'fraud', 'law']
    ]
  }
];

module.exports = { CASES };
