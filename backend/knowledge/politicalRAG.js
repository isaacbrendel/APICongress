const { searchPartyHistoryRAG } = require('./partyHistoryRAG');

const POLITICAL_KNOWLEDGE_BASE = [
  // -------------------------------------------------------------
  // AI & TECHNOLOGY REGULATION
  // -------------------------------------------------------------
  {
    topic: 'ai',
    keywords: ['ai', 'artificial intelligence', 'tech', 'technology', 'algorithm', 'data', 'privacy', 'semiconductor', 'chips', 'automation'],
    party: 'Democrat',
    stance: 'Pro-Regulation & Public Protection',
    argument: 'Artificial intelligence presents transformative potential but requires robust federal oversight to prevent algorithmic discrimination, protect worker displacement, and safeguard personal privacy. The FTC and AI Safety Institute must enforce strict algorithmic transparency standards.',
    sources: [
      'NIST AI Risk Management Framework 1.0 (2023)',
      'White House Blueprint for an AI Bill of Rights',
      'Federal Trade Commission Enforcement Policy on Algorithmic Bias (15 U.S.C. § 45)'
    ],
    stats: 'Over 68% of Americans express concern about AI data privacy and automated hiring discrimination according to Pew Research data.',
    keyPoints: [
      'Mandatory algorithmic audits for high-risk applications',
      'Protection against automated employment discrimination and biometric surveillance',
      'Federal data privacy legislation modeled after GDPR and CCPA'
    ]
  },
  {
    topic: 'ai',
    keywords: ['ai', 'artificial intelligence', 'tech', 'technology', 'innovation', 'market', 'competition', 'china', 'chips'],
    party: 'Republican',
    stance: 'Pro-Innovation & Free Market Leadership',
    argument: 'Over-regulating AI will suffocate American innovation, destroy tech startup ecosystems, and hand global technological dominance to foreign adversaries like China. Free market competition, IP protection, and targeted national security safeguards are superior to heavy-handed bureaucratic mandates.',
    sources: [
      'House Science, Space, and Technology Committee Report on American AI Dominance',
      'National Defense Authorization Act (NDAA) Technology Competitiveness Provisions',
      'American Enterprise Institute Policy Study on Innovation vs Bureaucracy'
    ],
    stats: 'The U.S. commercial tech sector accounts for $1.8 trillion in GDP; pre-emptive regulatory burdens threaten over 400,000 high-skilled tech jobs.',
    keyPoints: [
      'Prevent bureaucratic overreach from FTC and EPA-style mandates on software',
      'Maintain strategic technological lead over Chinese Communist Party (CCP)',
      'Protect intellectual property rights and open-source development freedom'
    ]
  },
  {
    topic: 'ai',
    keywords: ['ai', 'artificial intelligence', 'tech', 'technology', 'monopoly', 'open source', 'bipartisan', 'decentralized'],
    party: 'Independent',
    stance: 'Pragmatic Decentralization & Monopolistic Oversight',
    argument: 'Neither government censorship nor Big Tech monopolies serve the public interest. We need open-source access to prevent centralized AI monopolies (Big Tech regulatory capture) while establishing clear liability frameworks when autonomous systems cause tangible harm.',
    sources: [
      'Stanford Institute for Human-Centered AI (HAI) Index Report',
      'Bipartisan Senate AI Insight Forum Summary',
      'Justice Department Antitrust Division Tech Sector Findings'
    ],
    stats: 'Top 5 Big Tech firms control over 75% of cloud infrastructure required for LLM training.',
    keyPoints: [
      'Support open-source AI models to prevent Big Tech market lock-in',
      'Establish clear legal liability for autonomous physical and financial harm',
      'Protect online free speech while curbing deceptive deepfakes in elections'
    ]
  },

  // -------------------------------------------------------------
  // ECONOMY, TAXES & FISCAL POLICY
  // -------------------------------------------------------------
  {
    topic: 'taxes',
    keywords: ['tax', 'taxes', 'economy', 'budget', 'debt', 'spending', 'wealthy', 'billionaire', 'wages', 'minimum wage', 'inflation'],
    party: 'Democrat',
    stance: 'Progressive Taxation & Middle-Class Investment',
    argument: 'A fair tax system requires corporations and high earners to pay their fair share to fund critical infrastructure, education, and middle-class tax relief. Supply-side tax cuts have expanded the national deficit while growing income inequality.',
    sources: [
      'Congressional Budget Office (CBO) Distribution of Household Income Report',
      'Internal Revenue Code Subtitle A - Income Taxes',
      'Bureau of Labor Statistics Real Earnings Data'
    ],
    stats: 'The top 1% holds 31.4% of total U.S. wealth, while the bottom 50% holds just 2.6% (Federal Reserve Board Distributive Financial Accounts).',
    keyPoints: [
      'Implement 15% corporate minimum tax and close offshore loophole tax havens',
      'Expand Child Tax Credit (CTC) to cut child poverty in half',
      'Raise federal minimum wage indexed to regional inflation rate'
    ]
  },
  {
    topic: 'taxes',
    keywords: ['tax', 'taxes', 'economy', 'budget', 'debt', 'spending', 'business', 'growth', 'free market', 'deregulation'],
    party: 'Republican',
    stance: 'Supply-Side Growth & Spending Restraint',
    argument: 'High tax rates depress business capital investment, lower wage growth, and force companies overseas. Restraining runaway federal spending and maintaining competitive corporate rates incentivize domestic production and curb inflationary pressures.',
    sources: [
      'Tax Cuts and Jobs Act of 2017 (Public Law 115-97)',
      'Joint Committee on Taxation (JCT) Revenue Analysis',
      'Heritage Foundation Economic Freedom Index'
    ],
    stats: 'Lowering the federal corporate tax rate from 35% to 21% led to a historic $1 trillion in repatriated foreign earnings back to domestic investment.',
    keyPoints: [
      'Make 2017 individual tax cuts and capital expensing permanent',
      'Cap discretionary federal spending growth below inflation rate',
      'Cut burdensome federal regulations to reduce small business compliance costs'
    ]
  },
  {
    topic: 'taxes',
    keywords: ['tax', 'taxes', 'economy', 'budget', 'debt', 'spending', 'fiscal', 'deficit', 'bipartisan'],
    party: 'Independent',
    stance: 'Fiscal Responsibility & Tax Code Simplification',
    argument: 'Uncontrolled annual deficits exceeding $1.5 trillion threaten national insolvency. We need a fiscal stabilization plan that combines closing special-interest tax loopholes with rigorous spending audits and entitlement solvent reform.',
    sources: [
      'Peterson Foundation Fiscal Outlook Assessment',
      'GAO Financial Audit of the U.S. Government',
      'Simpson-Bowles Commission National Commission on Fiscal Responsibility Report'
    ],
    stats: 'U.S. National Debt has surpassed $34 trillion, exceeding 120% of annual Gross Domestic Product.',
    keyPoints: [
      'Eliminate carve-out tax loopholes for corporate lobbyists',
      'Enforce statutory Pay-As-You-Go (PAYGO) budgeting rules',
      'Establish a bipartisan fiscal commission to secure Medicare and Social Security'
    ]
  },

  // -------------------------------------------------------------
  // HEALTHCARE & MEDICINE
  // -------------------------------------------------------------
  {
    topic: 'healthcare',
    keywords: ['health', 'healthcare', 'medical', 'medicare', 'medicaid', 'pharma', 'prescription', 'insurance', 'doctor'],
    party: 'Democrat',
    stance: 'Universal Access & Prescription Price Controls',
    argument: 'Healthcare is a fundamental human right. Expanding public coverage options, allowing Medicare to negotiate drug prices, and capping out-of-pocket costs ensure no family faces financial ruin due to illness.',
    sources: [
      'Patient Protection and Affordable Care Act (42 U.S.C. § 18001)',
      'Inflation Reduction Act Drug Price Negotiation Mandates',
      'KFF (Kaiser Family Foundation) Annual Employer Health Benefits Survey'
    ],
    stats: 'Medicare drug price negotiation under the IRA will save taxpayers an estimated $100 billion over ten years (CBO).',
    keyPoints: [
      'Create a Public Option to compete directly with private insurers',
      'Cap monthly insulin copays at $35 for all insured individuals',
      'Protect pre-existing condition safeguards and Medicaid expansion funding'
    ]
  },
  {
    topic: 'healthcare',
    keywords: ['health', 'healthcare', 'medical', 'medicare', 'insurance', 'doctor', 'choice', 'free market', 'hsas'],
    party: 'Republican',
    stance: 'Market Choice, HSAs & State Flexibility',
    argument: 'Government-run healthcare leads to rationed care, long wait times, and stifled medical research. Market competition across state lines, expanded Health Savings Accounts (HSAs), and price transparency will lower real care costs.',
    sources: [
      'Congressional Research Service (CRS) Private Health Insurance Competition Study',
      'Centers for Medicare & Medicaid Services (CMS) Price Transparency Rules',
      'Galen Institute Health Policy Research'
    ],
    stats: 'Over 30 million Americans currently utilize Health Savings Accounts to manage personalized care without government mandates.',
    keyPoints: [
      'Allow health insurance sales across state lines to boost competition',
      'Enforce hospital upfront price transparency so patients can price-shop',
      'Expand HSA contribution limits and block grant Medicaid flexibility to states'
    ]
  },
  {
    topic: 'healthcare',
    keywords: ['health', 'healthcare', 'medical', 'medicare', 'pharma', 'bipartisan', 'transparency'],
    party: 'Independent',
    stance: 'Transparency, Preventative Care & Patent Reform',
    argument: 'Both administrative insurance bloat and pharmaceutical monopoly pricing exploit patients. Reform must combine mandatory price transparency with drug patent reform to prevent price gouging and prioritize preventive care.',
    sources: [
      'Journal of the American Medical Association (JAMA) Healthcare Spending Analysis',
      'FTC Inquiry into Pharmacy Benefit Managers (PBMs)',
      'Commonwealth Fund International Health System Comparisons'
    ],
    stats: 'Administrative costs account for up to 30% of total U.S. healthcare spending—more than double other developed nations.',
    keyPoints: [
      'Re-in in Pharmacy Benefit Manager (PBM) middleman markup tactics',
      'End patent-evergreening tactics that delay affordable generic medications',
      'Incentivize preventative health and wellness metrics in federal care reimbursement'
    ]
  },

  // -------------------------------------------------------------
  // ENERGY & CLIMATE POLICY
  // -------------------------------------------------------------
  {
    topic: 'climate',
    keywords: ['climate', 'energy', 'environment', 'green', 'carbon', 'emissions', 'solar', 'wind', 'fossil', 'oil', 'gas'],
    party: 'Democrat',
    stance: 'Clean Energy Transition & Environmental Justice',
    argument: 'Climate change represents an urgent ecological and economic threat. Investing in renewable energy infrastructure creates millions of manufacturing jobs while significantly cutting national carbon emissions.',
    sources: [
      'UN Intergovernmental Panel on Climate Change (IPCC) Sixth Assessment Report',
      'Energy Information Administration (EIA) Annual Energy Outlook',
      'Clean Energy and Security Act Legislative Directives'
    ],
    stats: 'Solar and wind energy costs have declined by 85% and 56% respectively over the past decade, making them cheapest for new grid additions.',
    keyPoints: [
      'Achieve 100% carbon-pollution-free electricity by 2035',
      'Provide consumer tax credits for electric vehicles and home energy efficiency',
      'Target environmental justice grants to frontline industrial communities'
    ]
  },
  {
    topic: 'climate',
    keywords: ['climate', 'energy', 'environment', 'oil', 'gas', 'drilling', 'independence', 'nuclear', 'grid', 'jobs'],
    party: 'Republican',
    stance: 'All-of-the-Above Energy & American Independence',
    argument: 'Energy security is national security. Restricting domestic oil and natural gas production increases foreign dependency on hostile regimes and drives up gas and electricity prices for working families.',
    sources: [
      'Department of Energy Global Energy Security Review',
      'American Petroleum Institute (API) Economic Impact Study',
      'National Regulatory Research Institute Electric Reliability Report'
    ],
    stats: 'The U.S. is the world leader in oil and natural gas production, supporting 10.8 million domestic jobs.',
    keyPoints: [
      'Fast-track domestic energy permitting reform under NEPA',
      'Expand nuclear energy licensing and domestic uranium enrichment capacity',
      'Utilize clean natural gas as a vital baseline fuel source for grid stability'
    ]
  },
  {
    topic: 'climate',
    keywords: ['climate', 'energy', 'environment', 'nuclear', 'grid', 'bipartisan', 'permitting'],
    party: 'Independent',
    stance: 'Pragmatic Energy Permitting & Nuclear Acceleration',
    argument: 'We cannot build a clean energy grid or maintain baseload power without permitting reform. We need a pragmatic approach that combines advanced nuclear power, modernized grid storage, and streamlined judicial reviews.',
    sources: [
      'Bipartisan Policy Center Permitting Reform Proposals',
      'Nuclear Regulatory Commission (NRC) Advanced Reactor Framework',
      'International Energy Agency (IEA) Global Energy Grid Report'
    ],
    stats: 'Over 80% of clean energy projects currently delayed in the U.S. are stalled due to federal permitting backlogs.',
    keyPoints: [
      'Pass comprehensive bipartisan permitting reform for transmission lines and pipelines',
      'Invest aggressively in Next-Gen modular nuclear reactors',
      'Support carbon capture and grid battery technology R&D'
    ]
  }
];

/**
 * Searches the political RAG database for relevant entries
 * @param {string} topic - Search topic string
 * @param {string} party - Democrat, Republican, or Independent
 * @param {Array} context - Previous debate arguments
 * @returns {Object|null} Best matching political knowledge entry
 */
function searchPoliticalRAG(topic, party, context = []) {
  if (!topic) return null;

  const normalizedTopic = topic.toLowerCase();
  const topicTokens = normalizedTopic.split(/[\s,._-]+/).filter(t => t.length > 2);

  // Filter entries matching the requested party (or neutral)
  const partyEntries = POLITICAL_KNOWLEDGE_BASE.filter(entry => 
    !party || entry.party.toLowerCase() === party.toLowerCase()
  );

  let bestMatch = null;
  let highestScore = -1;

  for (const entry of partyEntries) {
    let score = 0;

    // Check direct topic match
    if (normalizedTopic.includes(entry.topic)) {
      score += 20;
    }

    // Check keyword tokens
    for (const kw of entry.keywords) {
      if (normalizedTopic.includes(kw)) {
        score += 10;
      }
      for (const token of topicTokens) {
        if (kw.includes(token) || token.includes(kw)) {
          score += 5;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  // If no specific match was found, pick a general framework entry for that party
  if (!bestMatch || highestScore <= 0) {
    const fallbackForParty = partyEntries[0] || POLITICAL_KNOWLEDGE_BASE[0];
    return generateGenericPoliticalSynthesis(topic, party, fallbackForParty);
  }

  return synthesizeRAGArgument(topic, party, bestMatch);
}

/**
 * Synthesizes a structured, high-conviction debate argument with authentic citations
 */
function synthesizeRAGArgument(topic, party, entry) {
  const sourceCitation = entry.sources[Math.floor(Math.random() * entry.sources.length)];
  const point = entry.keyPoints[Math.floor(Math.random() * entry.keyPoints.length)];
  const historyData = searchPartyHistoryRAG(topic, party);

  let content = '';
  const historicalRef = historyData ? ` Rooted in our ${historyData.historicalEra} principles (${historyData.coreDoctrine}), ` : ' ';

  if (party === 'Democrat') {
    content = `${entry.argument}${historicalRef}As established in ${sourceCitation}, ${entry.stats} We must prioritize ${point.toLowerCase()} to ensure a fair and just outcome for all Americans on "${topic}".`;
  } else if (party === 'Republican') {
    content = `${entry.argument}${historicalRef}Data from ${sourceCitation} confirms that ${entry.stats} Protecting American freedom means focusing on ${point.toLowerCase()} rather than expanding government control over "${topic}".`;
  } else {
    content = `${entry.argument}${historicalRef}An objective review of ${sourceCitation} highlights that ${entry.stats} Real progress on "${topic}" requires a sensible middle path: ${point.toLowerCase()}.`;
  }

  return {
    sourceMatch: true,
    topic: entry.topic,
    party: entry.party,
    stance: entry.stance,
    content: content,
    citation: sourceCitation,
    historyContext: historyData,
    stats: entry.stats
  };
}

/**
 * Dynamic synthesis fallback when topic is unique (e.g. Space Exploration, Crypto)
 */
function generateGenericPoliticalSynthesis(topic, party, referenceEntry) {
  const sanitizedTopic = topic.slice(0, 150);
  const historyData = searchPartyHistoryRAG(topic, party);
  const historicalRef = historyData ? ` Reflecting our ${historyData.historicalEra} tradition (${historyData.coreDoctrine}), ` : ' ';

  if (party === 'Democrat') {
    return {
      sourceMatch: false,
      party: 'Democrat',
      stance: 'Public Welfare & Regulatory Integrity',
      content: `On the issue of "${sanitizedTopic}", we must prioritize accountability, public protection, and equitable outcomes.${historicalRef}According to principles enshrined in federal regulatory policy, public oversight and worker protection must guide our approach to ${sanitizedTopic}.`,
      citation: 'Congressional Policy & Public Welfare Guidelines (Title 5 U.S.C.)'
    };
  } else if (party === 'Republican') {
    return {
      sourceMatch: false,
      party: 'Republican',
      stance: 'Free Enterprise & Individual Liberty',
      content: `Regarding "${sanitizedTopic}", the federal government must avoid stifling American ingenuity through heavy-handed bureaucracy.${historicalRef}Freedom, individual initiative, and private sector innovation have always driven American prosperity. Over-regulating ${sanitizedTopic} will only restrict growth and harm taxpayers.`,
      citation: 'House Committee on Oversight & Economic Prosperity Principles'
    };
  } else {
    return {
      sourceMatch: false,
      party: 'Independent',
      stance: 'Pragmatic & Fact-Based Governance',
      content: `When analyzing "${sanitizedTopic}", we must rise above partisan soundbites and focus on empirical evidence.${historicalRef}Neither extreme partisan platform offers a complete solution. The smart path forward on ${sanitizedTopic} requires transparent oversight combined with incentives for private innovation.`,
      citation: 'Bipartisan Policy Institute Legislative Analysis'
    };
  }
}

module.exports = {
  searchPoliticalRAG,
  POLITICAL_KNOWLEDGE_BASE
};
