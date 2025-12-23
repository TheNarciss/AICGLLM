// analytics.worker.js
// Web Worker to compute advanced analytics off the main thread

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

function calculateContextUtilization(response, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 0;
  const stopwords = new Set([
    'the','and','to','of','in','a','is','it','that','for','on','with','as','are','was','were','be','by','this','which','or','an','from','at','but','not','have','has','had','we','they','their','its','may','can','these','those','such'
  ]);
  const responseTokens = tokenize(response).filter(t => t.length > 2 && !stopwords.has(t));
  if (responseTokens.length === 0) return 0;
  const contextText = contextChunks.map(c => c.text || '').join(' ');
  const contextSet = new Set(tokenize(contextText));
  let used = 0;
  responseTokens.forEach(tok => { if (contextSet.has(tok)) used++; });
  return used / responseTokens.length;
}

function calculateGrounding(response, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 0;
  const responseSentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (responseSentences.length === 0) return 0;
  let groundedSentences = 0;
  const contextText = contextChunks.map(c => c.text.toLowerCase()).join(' ');
  responseSentences.forEach(sentence => {
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matches = words.filter(w => contextText.includes(w));
    if (words.length > 0 && (matches.length / words.length) > 0.3) {
      groundedSentences++;
    }
  });
  return groundedSentences / responseSentences.length;
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

function detectHallucination(response, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 1;
  const contextText = contextChunks.map(c => c.text.toLowerCase()).join(' ');
  const responseSentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (responseSentences.length === 0) return 0;
  let possibleHallucinations = 0;
  responseSentences.forEach(sentence => {
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matches = words.filter(w => contextText.includes(w));
    if (words.length === 0 || (matches.length / words.length) < 0.2) possibleHallucinations++;
  });
  return responseSentences.length > 0 ? possibleHallucinations / responseSentences.length : 0;
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
