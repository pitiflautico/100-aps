export interface Word {
  id: string;
  word: string;
  definition: string;
  example: string;
  category: Category;
  difficulty: Difficulty;
}

export type Category = 'general' | 'academic' | 'business' | 'advanced';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const VOCABULARY: Word[] = [
  // Beginner - General
  { id: '1', word: 'Abundant', definition: 'Existing in large quantities', example: 'The garden has abundant flowers.', category: 'general', difficulty: 'beginner' },
  { id: '2', word: 'Brave', definition: 'Ready to face danger or pain', example: 'She was brave during the storm.', category: 'general', difficulty: 'beginner' },
  { id: '3', word: 'Curious', definition: 'Eager to know or learn', example: 'Children are naturally curious.', category: 'general', difficulty: 'beginner' },
  { id: '4', word: 'Diligent', definition: 'Showing care and effort', example: 'A diligent student always studies.', category: 'general', difficulty: 'beginner' },
  { id: '5', word: 'Eager', definition: 'Wanting to do something very much', example: 'He was eager to start the project.', category: 'general', difficulty: 'beginner' },
  { id: '6', word: 'Genuine', definition: 'Truly what it is said to be', example: 'She showed genuine concern.', category: 'general', difficulty: 'beginner' },
  { id: '7', word: 'Humble', definition: 'Not proud or arrogant', example: 'Despite success, he remained humble.', category: 'general', difficulty: 'beginner' },
  { id: '8', word: 'Innocent', definition: 'Not guilty of a crime', example: 'The child had an innocent smile.', category: 'general', difficulty: 'beginner' },
  { id: '9', word: 'Joyful', definition: 'Feeling or showing great happiness', example: 'It was a joyful celebration.', category: 'general', difficulty: 'beginner' },
  { id: '10', word: 'Kind', definition: 'Having a friendly, generous nature', example: 'She is kind to everyone.', category: 'general', difficulty: 'beginner' },

  // Intermediate - General
  { id: '11', word: 'Eloquent', definition: 'Fluent and persuasive in speaking', example: 'She gave an eloquent speech.', category: 'general', difficulty: 'intermediate' },
  { id: '12', word: 'Resilient', definition: 'Able to recover quickly', example: 'Children are resilient.', category: 'general', difficulty: 'intermediate' },
  { id: '13', word: 'Ambiguous', definition: 'Open to multiple interpretations', example: 'An ambiguous statement confused us.', category: 'general', difficulty: 'intermediate' },
  { id: '14', word: 'Benevolent', definition: 'Well-meaning and kindly', example: 'A benevolent smile greeted us.', category: 'general', difficulty: 'intermediate' },
  { id: '15', word: 'Candid', definition: 'Truthful and straightforward', example: 'I appreciate your candid feedback.', category: 'general', difficulty: 'intermediate' },
  { id: '16', word: 'Empathy', definition: 'Understanding others feelings', example: 'Show empathy to those in need.', category: 'general', difficulty: 'intermediate' },
  { id: '17', word: 'Frugal', definition: 'Sparing or economical', example: 'He leads a frugal lifestyle.', category: 'general', difficulty: 'intermediate' },
  { id: '18', word: 'Gregarious', definition: 'Fond of company, sociable', example: 'She has a gregarious personality.', category: 'general', difficulty: 'intermediate' },
  { id: '19', word: 'Meticulous', definition: 'Showing great attention to detail', example: 'He is meticulous in his work.', category: 'general', difficulty: 'intermediate' },
  { id: '20', word: 'Nostalgic', definition: 'Longing for the past', example: 'The song made her feel nostalgic.', category: 'general', difficulty: 'intermediate' },

  // Intermediate - Academic
  { id: '21', word: 'Analyze', definition: 'Examine in detail', example: 'We need to analyze the data carefully.', category: 'academic', difficulty: 'intermediate' },
  { id: '22', word: 'Hypothesis', definition: 'A proposed explanation', example: 'The scientist tested her hypothesis.', category: 'academic', difficulty: 'intermediate' },
  { id: '23', word: 'Methodology', definition: 'System of methods used', example: 'The research methodology is sound.', category: 'academic', difficulty: 'intermediate' },
  { id: '24', word: 'Paradigm', definition: 'A typical example or pattern', example: 'This represents a paradigm shift.', category: 'academic', difficulty: 'intermediate' },
  { id: '25', word: 'Synthesize', definition: 'Combine into a coherent whole', example: 'Synthesize the information from sources.', category: 'academic', difficulty: 'intermediate' },
  { id: '26', word: 'Validate', definition: 'Check or prove accuracy', example: 'The experiment validates the theory.', category: 'academic', difficulty: 'intermediate' },
  { id: '27', word: 'Comprehensive', definition: 'Complete and including everything', example: 'A comprehensive study of the topic.', category: 'academic', difficulty: 'intermediate' },
  { id: '28', word: 'Empirical', definition: 'Based on observation or experience', example: 'We need empirical evidence.', category: 'academic', difficulty: 'intermediate' },
  { id: '29', word: 'Inference', definition: 'Conclusion from evidence', example: 'Draw an inference from the results.', category: 'academic', difficulty: 'intermediate' },
  { id: '30', word: 'Variable', definition: 'Element that can change', example: 'Control all variables in the test.', category: 'academic', difficulty: 'intermediate' },

  // Intermediate - Business
  { id: '31', word: 'Revenue', definition: 'Income from business activities', example: 'The company increased its revenue.', category: 'business', difficulty: 'intermediate' },
  { id: '32', word: 'Stakeholder', definition: 'Person with interest in enterprise', example: 'Stakeholders attended the meeting.', category: 'business', difficulty: 'intermediate' },
  { id: '33', word: 'Leverage', definition: 'Use to maximum advantage', example: 'Leverage our existing resources.', category: 'business', difficulty: 'intermediate' },
  { id: '34', word: 'Synergy', definition: 'Combined effect greater than sum', example: 'The merger created synergy.', category: 'business', difficulty: 'intermediate' },
  { id: '35', word: 'Scalable', definition: 'Able to be expanded', example: 'We need a scalable solution.', category: 'business', difficulty: 'intermediate' },
  { id: '36', word: 'Benchmark', definition: 'Standard for comparison', example: 'Set a benchmark for performance.', category: 'business', difficulty: 'intermediate' },
  { id: '37', word: 'Innovative', definition: 'Featuring new methods', example: 'An innovative business model.', category: 'business', difficulty: 'intermediate' },
  { id: '38', word: 'Pragmatic', definition: 'Dealing with things realistically', example: 'Take a pragmatic approach.', category: 'business', difficulty: 'intermediate' },
  { id: '39', word: 'Diversify', definition: 'Make more varied', example: 'Diversify your investment portfolio.', category: 'business', difficulty: 'intermediate' },
  { id: '40', word: 'Optimize', definition: 'Make as effective as possible', example: 'Optimize the workflow process.', category: 'business', difficulty: 'intermediate' },

  // Advanced - General
  { id: '41', word: 'Ephemeral', definition: 'Lasting for a very short time', example: 'The beauty of flowers is ephemeral.', category: 'general', difficulty: 'advanced' },
  { id: '42', word: 'Ubiquitous', definition: 'Present everywhere', example: 'Smartphones are ubiquitous today.', category: 'general', difficulty: 'advanced' },
  { id: '43', word: 'Meticulous', definition: 'Extremely careful and precise', example: 'She kept meticulous records.', category: 'general', difficulty: 'advanced' },
  { id: '44', word: 'Esoteric', definition: 'Intended for a small group', example: 'An esoteric philosophical debate.', category: 'general', difficulty: 'advanced' },
  { id: '45', word: 'Tenacious', definition: 'Persistent and determined', example: 'His tenacious spirit never gave up.', category: 'general', difficulty: 'advanced' },
  { id: '46', word: 'Serendipity', definition: 'Pleasant surprise by chance', example: 'Meeting you was pure serendipity.', category: 'general', difficulty: 'advanced' },
  { id: '47', word: 'Paradox', definition: 'Seemingly contradictory statement', example: 'The paradox puzzled everyone.', category: 'general', difficulty: 'advanced' },
  { id: '48', word: 'Juxtapose', definition: 'Place side by side', example: 'Juxtapose the two images.', category: 'general', difficulty: 'advanced' },
  { id: '49', word: 'Aesthetic', definition: 'Concerned with beauty', example: 'The design has aesthetic appeal.', category: 'general', difficulty: 'advanced' },
  { id: '50', word: 'Eloquence', definition: 'Fluent or persuasive speaking', example: 'His eloquence moved the audience.', category: 'general', difficulty: 'advanced' },

  // Advanced - Academic
  { id: '51', word: 'Epistemology', definition: 'Theory of knowledge', example: 'Epistemology explores how we know.', category: 'academic', difficulty: 'advanced' },
  { id: '52', word: 'Paradigmatic', definition: 'Serving as a typical example', example: 'A paradigmatic case study.', category: 'academic', difficulty: 'advanced' },
  { id: '53', word: 'Juxtaposition', definition: 'Placing things side by side', example: 'The juxtaposition is striking.', category: 'academic', difficulty: 'advanced' },
  { id: '54', word: 'Dichotomy', definition: 'Division into two parts', example: 'A false dichotomy in the argument.', category: 'academic', difficulty: 'advanced' },
  { id: '55', word: 'Extrapolate', definition: 'Extend to unknown situation', example: 'Extrapolate from current trends.', category: 'academic', difficulty: 'advanced' },
  { id: '56', word: 'Substantiate', definition: 'Provide evidence to support', example: 'Substantiate your claims with data.', category: 'academic', difficulty: 'advanced' },
  { id: '57', word: 'Connotation', definition: 'Implied or associated meaning', example: 'The word has negative connotations.', category: 'academic', difficulty: 'advanced' },
  { id: '58', word: 'Antithesis', definition: 'Direct opposite', example: 'Peace is the antithesis of war.', category: 'academic', difficulty: 'advanced' },
  { id: '59', word: 'Mitigate', definition: 'Make less severe', example: 'Mitigate the negative effects.', category: 'academic', difficulty: 'advanced' },
  { id: '60', word: 'Proliferate', definition: 'Increase rapidly in number', example: 'Online courses proliferate today.', category: 'academic', difficulty: 'advanced' },

  // Advanced - Business
  { id: '61', word: 'Amortization', definition: 'Gradual reduction of debt', example: 'Calculate the loan amortization.', category: 'business', difficulty: 'advanced' },
  { id: '62', word: 'Diversification', definition: 'Process of varying range', example: 'Portfolio diversification reduces risk.', category: 'business', difficulty: 'advanced' },
  { id: '63', word: 'Arbitrage', definition: 'Profit from price differences', example: 'Currency arbitrage opportunities.', category: 'business', difficulty: 'advanced' },
  { id: '64', word: 'Consolidation', definition: 'Action of combining things', example: 'Market consolidation is occurring.', category: 'business', difficulty: 'advanced' },
  { id: '65', word: 'Depreciation', definition: 'Reduction in value over time', example: 'Asset depreciation affects taxes.', category: 'business', difficulty: 'advanced' },
  { id: '66', word: 'Equity', definition: 'Ownership interest in company', example: 'She holds equity in the startup.', category: 'business', difficulty: 'advanced' },
  { id: '67', word: 'Fiduciary', definition: 'Held in trust for another', example: 'Fiduciary duty to shareholders.', category: 'business', difficulty: 'advanced' },
  { id: '68', word: 'Liquidation', definition: 'Converting assets to cash', example: 'The company went into liquidation.', category: 'business', difficulty: 'advanced' },
  { id: '69', word: 'Valuation', definition: 'Estimation of worth', example: 'Business valuation is complex.', category: 'business', difficulty: 'advanced' },
  { id: '70', word: 'Tangible', definition: 'Perceptible by touch, real', example: 'Tangible assets on the balance sheet.', category: 'business', difficulty: 'advanced' },

  // More Beginner Words
  { id: '71', word: 'Bright', definition: 'Giving out much light', example: 'The sun is bright today.', category: 'general', difficulty: 'beginner' },
  { id: '72', word: 'Calm', definition: 'Not showing excitement', example: 'Stay calm during the test.', category: 'general', difficulty: 'beginner' },
  { id: '73', word: 'Decent', definition: 'Of acceptable standard', example: 'He did a decent job.', category: 'general', difficulty: 'beginner' },
  { id: '74', word: 'Efficient', definition: 'Working well with no waste', example: 'An efficient heating system.', category: 'general', difficulty: 'beginner' },
  { id: '75', word: 'Fair', definition: 'Treating people equally', example: 'The teacher is always fair.', category: 'general', difficulty: 'beginner' },
  { id: '76', word: 'Grateful', definition: 'Feeling or showing thanks', example: 'I am grateful for your help.', category: 'general', difficulty: 'beginner' },
  { id: '77', word: 'Honest', definition: 'Free of deceit, truthful', example: 'He gave an honest answer.', category: 'general', difficulty: 'beginner' },
  { id: '78', word: 'Ideal', definition: 'Perfect or most suitable', example: 'This is the ideal solution.', category: 'general', difficulty: 'beginner' },
  { id: '79', word: 'Loyal', definition: 'Giving firm support', example: 'A loyal friend is valuable.', category: 'general', difficulty: 'beginner' },
  { id: '80', word: 'Modest', definition: 'Unassuming in estimation', example: 'She was modest about her success.', category: 'general', difficulty: 'beginner' },

  // More Intermediate Words
  { id: '81', word: 'Persevere', definition: 'Continue despite difficulties', example: 'Persevere through challenges.', category: 'general', difficulty: 'intermediate' },
  { id: '82', word: 'Proficient', definition: 'Competent or skilled', example: 'She is proficient in Spanish.', category: 'general', difficulty: 'intermediate' },
  { id: '83', word: 'Reluctant', definition: 'Unwilling or hesitant', example: 'He was reluctant to leave.', category: 'general', difficulty: 'intermediate' },
  { id: '84', word: 'Subsequent', definition: 'Coming after something', example: 'Subsequent events proved him right.', category: 'general', difficulty: 'intermediate' },
  { id: '85', word: 'Thorough', definition: 'Complete with attention', example: 'A thorough investigation.', category: 'general', difficulty: 'intermediate' },
  { id: '86', word: 'Versatile', definition: 'Adaptable to many functions', example: 'A versatile actor.', category: 'general', difficulty: 'intermediate' },
  { id: '87', word: 'Vivid', definition: 'Producing powerful images', example: 'A vivid description.', category: 'general', difficulty: 'intermediate' },
  { id: '88', word: 'Zealous', definition: 'Having great energy', example: 'A zealous supporter.', category: 'general', difficulty: 'intermediate' },
  { id: '89', word: 'Arbitrary', definition: 'Based on random choice', example: 'An arbitrary decision.', category: 'general', difficulty: 'intermediate' },
  { id: '90', word: 'Coherent', definition: 'Logical and consistent', example: 'A coherent argument.', category: 'general', difficulty: 'intermediate' },

  // More Advanced Words
  { id: '91', word: 'Ephemeral', definition: 'Lasting very briefly', example: 'The joy was ephemeral.', category: 'general', difficulty: 'advanced' },
  { id: '92', word: 'Incessant', definition: 'Continuing without pause', example: 'The incessant noise was annoying.', category: 'general', difficulty: 'advanced' },
  { id: '93', word: 'Ostentatious', definition: 'Designed to impress', example: 'An ostentatious display of wealth.', category: 'general', difficulty: 'advanced' },
  { id: '94', word: 'Pernicious', definition: 'Having harmful effect', example: 'A pernicious influence.', category: 'general', difficulty: 'advanced' },
  { id: '95', word: 'Reticent', definition: 'Not revealing thoughts', example: 'He was reticent about his plans.', category: 'general', difficulty: 'advanced' },
  { id: '96', word: 'Salient', definition: 'Most noticeable', example: 'The salient features.', category: 'general', difficulty: 'advanced' },
  { id: '97', word: 'Terse', definition: 'Sparing in use of words', example: 'A terse reply.', category: 'general', difficulty: 'advanced' },
  { id: '98', word: 'Vex', definition: 'Make annoyed or worried', example: 'The problem vexed him.', category: 'general', difficulty: 'advanced' },
  { id: '99', word: 'Whimsical', definition: 'Playfully fanciful', example: 'A whimsical design.', category: 'general', difficulty: 'advanced' },
  { id: '100', word: 'Zenith', definition: 'Highest point', example: 'At the zenith of his career.', category: 'general', difficulty: 'advanced' },
];

export const getCategoryWords = (category: Category): Word[] => {
  return VOCABULARY.filter(word => word.category === category);
};

export const getDifficultyWords = (difficulty: Difficulty): Word[] => {
  return VOCABULARY.filter(word => word.difficulty === difficulty);
};

export const getWordsByFilters = (category?: Category, difficulty?: Difficulty): Word[] => {
  return VOCABULARY.filter(word => {
    if (category && word.category !== category) return false;
    if (difficulty && word.difficulty !== difficulty) return false;
    return true;
  });
};
