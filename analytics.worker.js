// analytics.worker.js
// Web Worker to compute advanced analytics off the main thread
// IMPROVED VERSION with stemming and better hallucination detection

self.onmessage = async (e) => {
  const { action, payload } = e.data;
  if (action === 'computeAdvanced') {
    try {
      const result = computeAdvanced(payload);
      self.postMessage({ id: payload.id, advanced: result });
    } catch (err) {
      self.postMessage({ id: payload.id, error: err.message });
    }
  }
};

// Helper tokenization
function tokenize(text) {
  return (text || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t && t.length > 0);
}

// Simple stemming: remove common suffixes
function stem(word) {
  return word
    .replace(/ing$/, '')
    .replace(/tion$/, 't')
    .replace(/sion$/, 's')
    .replace(/ness$/, '')
    .replace(/ment$/, '')
    .replace(/able$/, '')
    .replace(/ible$/, '')
    .replace(/ies$/, 'y')
    .replace(/es$/, '')
    .replace(/s$/, '');
}

function calculateDiversity(text) {
  const tokens = tokenize(text);
  const unigrams = new Set(tokens);
  const bigrams = new Set();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]}_${tokens[i+1]}`);
  }
  const distinct1 = tokens.length > 0 ? unigrams.size / tokens.length : 0;
  const distinct2 = tokens.length > 1 ? bigrams.size / (tokens.length - 1) : 0;
  return { distinct1, distinct2, uniqueTokens: unigrams.size };
}

function calculateRepetition(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) return 0;
  let repetitionCount = 0;
  const seen = new Set();
  sentences.forEach(sentence => {
    const normalized = sentence.trim().toLowerCase();
    if (seen.has(normalized)) repetitionCount++;
    seen.add(normalized);
  });
  return repetitionCount / sentences.length;
}

// IMPROVED: Context utilization with stemming
function calculateContextUtilization(response, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 0;
  
  const stopwords = new Set([
    'the','and','to','of','in','a','is','it','that','for','on','with','as','are','was','were','be','by',
    'this','which','or','an','from','at','but','not','have','has','had','we','they','their','its','may',
    'can','these','those','such','been','being','would','could','should','about','into','through','during',
    'before','after','above','below','between','under','again','further','then','once','here','there',
    'when','where','why','how','all','each','few','more','most','other','some','only','own','same','than',
    'too','very','just','also','now','paper','document','study','research','results','section','chapter'
  ]);

  const responseTokens = tokenize(response).filter(t => t.length > 3 && !stopwords.has(t));
  if (responseTokens.length === 0) return 0;

  const contextText = contextChunks.map(c => c.text || '').join(' ');
  const contextTokens = tokenize(contextText);
  
  // Create context set with stems
  const contextSet = new Set();
  contextTokens.forEach(t => {
    contextSet.add(t);
    contextSet.add(stem(t));
  });

  // Match response tokens (with stemming)
  let used = 0;
  responseTokens.forEach(tok => {
    if (contextSet.has(tok) || contextSet.has(stem(tok))) {
      used++;
    }
  });

  return used / responseTokens.length;
}

// IMPROVED: Answer grounding with bigrams
function calculateGrounding(response, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 0;
  
  const responseSentences = response.split(/[.!?]+/).filter(s => s.trim().length > 15);
  if (responseSentences.length === 0) return 0;
  
  const contextText = contextChunks.map(c => (c.text || '').toLowerCase()).join(' ');
  
  // Build bigram set from context
  const contextWords = contextText.split(/\s+/).filter(w => w.length > 2);
  const contextBigrams = new Set();
  for (let i = 0; i < contextWords.length - 1; i++) {
    contextBigrams.add(contextWords[i] + ' ' + contextWords[i+1]);
  }
  const contextWordSet = new Set(contextWords);
  
  let totalScore = 0;
  
  responseSentences.forEach(sentence => {
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (words.length === 0) return;
    
    // Word matching (weight: 0.6)
    const wordMatches = words.filter(w => contextWordSet.has(w)).length;
    const wordScore = words.length > 0 ? wordMatches / words.length : 0;
    
    // Bigram matching (weight: 0.4)
    let bigramMatches = 0;
    for (let i = 0; i < words.length - 1; i++) {
      if (contextBigrams.has(words[i] + ' ' + words[i+1])) {
        bigramMatches++;
      }
    }
    const bigramScore = words.length > 1 ? bigramMatches / (words.length - 1) : 0;
    
    totalScore += (wordScore * 0.6) + (bigramScore * 0.4);
  });
  
  return totalScore / responseSentences.length;
}

function calculateCitationCoverage(sources, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 0;
  const uniqueSources = new Set((sources || []).map(s => s.source || s));
  const availableSources = new Set((contextChunks || []).map(c => c.source));
  return availableSources.size > 0 ? (uniqueSources.size / availableSources.size) : 0;
}

function calculateRetrievalPrecision(contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 0;
  const highQualityChunks = contextChunks.filter(c => (c.similarity || 0) > 0.5).length;
  return highQualityChunks / contextChunks.length;
}

function classifyQuery(query) {
  const q = (query || '').toLowerCase();
  if (/\b(what|who|when|where|why|how|which)\b/.test(q)) return 'question';
  if (/\b(summarize|summary|overview|brief)\b/.test(q)) return 'summary';
  if (/\b(compare|contrast|difference|versus|vs)\b/.test(q)) return 'comparison';
  if (/\b(generate|create|write|compose)\b/.test(q)) return 'generation';
  return 'other';
}

function calculateQueryComplexity(query) {
  const words = (query || '').split(/\s+/);
  const sentences = (query || '').split(/[.!?]+/).filter(s => s.trim().length > 0);
  const hasQuestionMark = (query || '').includes('?');
  const hasClauses = (query || '').split(/,|;/).length - 1;
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
    hasQuestion: hasQuestionMark,
    complexity: Math.min(10, words.length / 5 + hasClauses + (hasQuestionMark ? 1 : 0))
  };
}

// IMPROVED: Hallucination detection with pattern awareness
function detectHallucination(response, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 1;
  
  const contextText = contextChunks.map(c => (c.text || '').toLowerCase()).join(' ');
  const responseSentences = response.split(/[.!?]+/).filter(s => s.trim().length > 15);
  
  if (responseSentences.length === 0) return 0;
  
  // Build context word set with stemming
  const contextWords = contextText.split(/\s+/).filter(w => w.length > 3);
  const contextSet = new Set();
  contextWords.forEach(w => {
    contextSet.add(w);
    contextSet.add(stem(w));
  });
  
  // Patterns that indicate factual claims (higher risk)
  const factualPatterns = [
    /\b(discovered|invented|published|founded|created)\s+(?:in|by)\b/i,
    /\b(in|since|from)\s+\d{4}\b/i,
    /\b\d+(?:\.\d+)?\s*%/,
    /\b(always|never|every|all|none)\b/i,
    /\b(first|only|largest|smallest|best|worst)\b/i,
  ];
  
  // Safe patterns (general statements)
  const safePatterns = [
    /\b(may|might|could|can|often|sometimes|generally|typically)\b/i,
    /\b(this (paper|document|study|book))\b/i,
    /\b(the (author|text|content) (discusses|describes|explains|presents))\b/i,
  ];
  
  let hallucinationScore = 0;
  
  responseSentences.forEach(sentence => {
    const sentenceLower = sentence.toLowerCase();
    const words = sentenceLower.split(/\s+/).filter(w => w.length > 3);
    
    if (words.length === 0) return;
    
    // Skip safe patterns
    const isSafe = safePatterns.some(p => p.test(sentenceLower));
    if (isSafe) return;
    
    // Check word overlap
    let matches = 0;
    words.forEach(w => {
      if (contextSet.has(w) || contextSet.has(stem(w))) {
        matches++;
      }
    });
    
    const overlapRatio = matches / words.length;
    const isFactualClaim = factualPatterns.some(p => p.test(sentenceLower));
    const threshold = isFactualClaim ? 0.25 : 0.15;
    
    if (overlapRatio < threshold) {
      hallucinationScore += isFactualClaim ? 1.5 : 1;
    }
  });
  
  return Math.min(1, hallucinationScore / responseSentences.length);
}

function calculateCompleteness(query, response) {
  const queryWords = (query || '').toLowerCase().split(/\s+/).filter(w => w.length > 4 && !['what','when','where','which','could','would','should'].includes(w));
  if (queryWords.length === 0) return 1;
  const responseLower = (response || '').toLowerCase();
  const addressedWords = queryWords.filter(word => responseLower.includes(word));
  return addressedWords.length / queryWords.length;
}

function calculateSourceDiversity(sources) {
  if (!sources || sources.length === 0) return 0;
  const uniqueSources = new Set(sources.map(s => s.source || s));
  return uniqueSources.size / sources.length;
}

function computeAdvanced(payload) {
  const { query, response, sources, contextChunks, generation, retrieval } = payload;
  const diversity = calculateDiversity(response);
  const repetition = calculateRepetition(response);
  const contextUtil = calculateContextUtilization(response, contextChunks);
  const grounding = calculateGrounding(response, contextChunks);
  const citationCov = calculateCitationCoverage(sources, contextChunks);
  const retrievalPrec = calculateRetrievalPrecision(contextChunks);
  const throughput = generation && generation.totalTimeMs ? (generation.tokensGenerated / generation.totalTimeMs) * 1000 : 0;
  const queryComp = calculateQueryComplexity(query);
  const queryType = classifyQuery(query);
  const hallucinationScore = detectHallucination(response, contextChunks);
  const completeness = calculateCompleteness(query, response);
  const sourceDiversity = calculateSourceDiversity(sources || []);

  return {
    responseLength: response ? response.length : 0,
    distinct1: diversity.distinct1,
    distinct2: diversity.distinct2,
    repetition,
    contextUtilization: contextUtil,
    answerGrounding: grounding,
    citationCoverage: citationCov,
    retrievalPrecision: retrievalPrec,
    throughput,
    queryComplexity: queryComp.complexity,
    queryType,
    hallucinationScore,
    completeness,
    sourceDiversity
  };
}