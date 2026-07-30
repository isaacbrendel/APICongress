/**
 * DEEP PARTY HISTORY & PLATFORM RAG ARCHIVE
 * 
 * Comprehensive historical repository covering 150+ years of American political platforms,
 * party evolution, constitutional doctrines, and landmark legislative acts for
 * Democratic, Republican, and Independent/Reform movements.
 */

const PARTY_HISTORY_ARCHIVE = {
  Democrat: {
    partyName: 'Democratic Party',
    foundingPrinciples: 'Jacksonian Democracy, New Deal Liberalism, Great Society Public Welfare, Modern Social & Economic Equity',
    keyEras: [
      {
        era: 'New Deal & Fair Deal Era (1932–1952)',
        leaders: ['Franklin D. Roosevelt', 'Harry S. Truman'],
        coreDoctrines: [
          'Federal Economic Intervention & Demand-Side Keynesianism',
          'Creation of Social Security (1935) & Federal Deposit Insurance (FDIC)',
          'Labor Union Collective Bargaining Rights (Wagner Act / National Labor Relations Act 1935)',
          'Glass-Steagall Banking Separation & Securities Regulation (SEC 1934)'
        ],
        quotes: [
          'The only thing we have to fear is fear itself. - FDR',
          'Test of our progress is not whether we add more to the abundance of those who have much; it is whether we provide enough for those who have too little. - FDR'
        ]
      },
      {
        era: 'Great Society & Civil Rights Realignment (1960–1976)',
        leaders: ['John F. Kennedy', 'Lyndon B. Johnson'],
        coreDoctrines: [
          'Civil Rights Act of 1964 (Title VII prohibition of discrimination) & Voting Rights Act of 1965',
          'Establishment of Medicare & Medicaid (Social Security Amendments of 1965)',
          'War on Poverty, Job Corps, and Federal Elementary & Secondary Education Act',
          'Environmental Protection (Clean Air Act & National Environmental Policy Act precursor)'
        ],
        quotes: [
          'Ask not what your country can do for you — ask what you can do for your country. - JFK',
          'The Great Society rests on abundance and liberty for all. - LBJ'
        ]
      },
      {
        era: 'New Democrats & Fiscal Third Way (1992–2004)',
        leaders: ['Bill Clinton', 'Al Gore'],
        coreDoctrines: [
          'Fiscal Solvency combined with Targeted Social Investment (1998 Budget Surplus)',
          'Family and Medical Leave Act of 1993 (FMLA)',
          'State Children\'s Health Insurance Program (SCHIP)',
          'Investments in High-Tech Research & National Information Infrastructure'
        ]
      },
      {
        era: 'Modern Progressive & Clean Energy Era (2008–2026)',
        leaders: ['Barack Obama', 'Joe Biden', 'Progressive Caucus Directives'],
        coreDoctrines: [
          'Patient Protection and Affordable Care Act of 2010 (PPACA / Obamacare)',
          'Dodd-Frank Wall Street Reform and Consumer Protection Act (Consumer Financial Protection Bureau / CFPB)',
          'Inflation Reduction Act of 2022 ($369B Clean Energy & Medicare Drug Negotiation)',
          'Bipartisan Infrastructure Law ($1.2T Roads, Transit, Clean Water, Broadband)',
          'Algorithmic Fairness, Worker Protection in Gig Economy, and Corporate Minimum Tax (15%)'
        ]
      }
    ],
    platformSummary: 'Belief in proactive government investment, progressive taxation, labor protection, healthcare access, civil rights enforcement, and clean energy transition to build a fair economy for working families.'
  },

  Republican: {
    partyName: 'Republican Party (GOP)',
    foundingPrinciples: 'Lincoln Anti-Slavery Union, Constitutional Originalism, Reagan Supply-Side Capitalism, American Sovereignty & Deregulation',
    keyEras: [
      {
        era: 'Founding & Reconstruction Era (1854–1877)',
        leaders: ['Abraham Lincoln', 'Ulysses S. Grant'],
        coreDoctrines: [
          'Preservation of the Union & Abolition of Slavery (13th, 14th, 15th Amendments)',
          'Homestead Act of 1862 (Free Soil, Free Labor, Free Men)',
          'Morrill Land-Grant Colleges Act & Transcontinental Railroad Infrastructure',
          'Protection of Individual Liberty against State Tyranny'
        ],
        quotes: [
          'Government of the people, by the people, for the people, shall not perish from the earth. - Abraham Lincoln',
          'Labor is prior to and independent of capital. Capital is only the fruit of labor. - Abraham Lincoln'
        ]
      },
      {
        era: 'Reagan Revolution & Conservative Renaissance (1980–1992)',
        leaders: ['Ronald Reagan', 'George H.W. Bush'],
        coreDoctrines: [
          'Economic Recovery Tax Act of 1981 & Tax Reform Act of 1986 (Supply-side tax rate reductions)',
          'Deregulation of Banking, Energy, and Transportation sectors to unlock market capital',
          'Peace Through Strength foreign policy, SDI, and dissolution of Soviet Empire',
          'Judicial Federalism & Strict Constructionist Interpretation of the U.S. Constitution'
        ],
        quotes: [
          'Government is not the solution to our problem; government is the problem. - Ronald Reagan',
          'Freedom is never more than one generation away from extinction. - Ronald Reagan'
        ]
      },
      {
        era: 'Contract with America & Reform Era (1994–2006)',
        leaders: ['Newt Gingrich', 'George W. Bush'],
        coreDoctrines: [
          'Contract with America 10-Point Legislative Agenda (Fiscal Responsibility, Balanced Budget Amendment)',
          'Welfare Reform Act of 1996 (Personal Responsibility and Work Opportunity Reconciliation Act)',
          'Economic Growth and Tax Relief Reconciliation Act of 2001 (Bush Tax Cuts)',
          'Defense Security, Patriot Act, and Department of Homeland Security creation'
        ]
      },
      {
        era: 'Modern Populist & Sovereign Renewal Era (2016–2026)',
        leaders: ['Donald Trump', 'House & Senate Conservative Platform'],
        coreDoctrines: [
          'Tax Cuts and Jobs Act of 2017 (21% Corporate rate, domestic repatriated capital incentive)',
          'Judicial Realignment (Originalist appointments to Federal Courts & Supreme Court)',
          'Border Sovereignty, Domestic Energy Independence (Oil, Natural Gas, Nuclear)',
          'Fair Trade & Reciprocal Tariffs protecting American Manufacturing & Supply Chain Independence',
          'Deregulation under REINS Act principles & Protection of Second Amendment Rights'
        ]
      }
    ],
    platformSummary: 'Belief in free enterprise, limited constitutional government, low tax burdens, energy dominance, national border security, individual liberty, and judicial originalism.'
  },

  Independent: {
    partyName: 'Independent & Reform Movement',
    foundingPrinciples: 'Centrist Pragmatism, Anti-Corruption, Fiscal Solvency, Bipartisan Governance, Technological & Electoral Reform',
    keyEras: [
      {
        era: 'Progressive Reform Era (1912)',
        leaders: ['Teddy Roosevelt (Bull Moose Party)', 'Robert M. La Follette'],
        coreDoctrines: [
          'Trustbusting monopolies to protect small enterprise & consumer pricing',
          'Direct Election of U.S. Senators (17th Amendment) & Direct Primaries',
          'Corrupt Practices Act & Ban on Special Interest Corporate Campaign Spending',
          'National Parks Conservation & Pure Food and Drug Oversight'
        ],
        quotes: [
          'To waste, to destroy our natural resources... will result in undermining in the time of our children the very prosperity which we ought by right to hand down to them. - Teddy Roosevelt'
        ]
      },
      {
        era: 'Perot Reform Movement (1992–1996)',
        leaders: ['Ross Perot'],
        coreDoctrines: [
          'Elimination of National Deficits & Statutory Pay-As-You-Go Budgeting',
          'Strict Lobbying Restrictions & Ending Revolving-Door K Street Influence',
          'Skeptical Trade Evaluation protecting Domestic Industrial Capability',
          'Electronic Town Halls & Direct Citizen Policy Feedback'
        ]
      },
      {
        era: 'Modern Independent Centrist Movement (2010–2026)',
        leaders: ['Bipartisan Problem Solvers Caucus', 'Forward / Centrist Coalition'],
        coreDoctrines: [
          'Ranked-Choice Voting & Open Nonpartisan Primaries to end Gridlock',
          'Bipartisan Infrastructure & Permitting Reform for Grid and Energy Projects',
          'Pragmatic Debt Stabilization combining Loophole Closure with Spending Audits',
          'Balanced Technology Policy protecting Open-Source Innovation while establishing liability'
        ]
      }
    ],
    platformSummary: 'Belief in nonpartisan problem solving, electoral reform, strict fiscal accountability, pragmatic compromises, and breaking special-interest lobbyist control.'
  }
};

/**
 * Search the Party History Archive for historical platform context and citations
 */
function searchPartyHistoryRAG(topic, party) {
  const partyData = PARTY_HISTORY_ARCHIVE[party] || PARTY_HISTORY_ARCHIVE['Independent'];
  const topicLower = (topic || '').toLowerCase();

  // Find relevant era based on topic keywords
  let matchedEra = partyData.keyEras[partyData.keyEras.length - 1]; // Default to modern

  for (const eraObj of partyData.keyEras) {
    for (const doctrine of eraObj.coreDoctrines) {
      const docLower = doctrine.toLowerCase();
      if (
        (topicLower.includes('tax') && docLower.includes('tax')) ||
        (topicLower.includes('health') && docLower.includes('health')) ||
        (topicLower.includes('trade') && docLower.includes('trade')) ||
        (topicLower.includes('job') && docLower.includes('work')) ||
        (topicLower.includes('ai') && docLower.includes('tech')) ||
        (topicLower.includes('energy') && docLower.includes('energy'))
      ) {
        matchedEra = eraObj;
        break;
      }
    }
  }

  const randomQuote = matchedEra.quotes ? matchedEra.quotes[Math.floor(Math.random() * matchedEra.quotes.length)] : null;
  const randomDoctrine = matchedEra.coreDoctrines[Math.floor(Math.random() * matchedEra.coreDoctrines.length)];

  return {
    partyName: partyData.partyName,
    summary: partyData.platformSummary,
    historicalEra: matchedEra.era,
    leaders: matchedEra.leaders,
    coreDoctrine: randomDoctrine,
    historicalQuote: randomQuote
  };
}

module.exports = {
  PARTY_HISTORY_ARCHIVE,
  searchPartyHistoryRAG
};
