/**
 * Advanced Analytics Library for LLM Evaluation
 * Tracks comprehensive metrics for RAG-based literature review system
 */

export class AdvancedAnalytics {
    constructor() {
        this.metrics = {
            // Generation Quality
            responseLengths: [],
            vocabularyUnique: new Set(),
            repetitionScores: [],
            diversityDistinct1: [],
            diversityDistinct2: [],
            
            // RAG-specific
            contextUtilization: [],
            answerGrounding: [],
            citationCoverage: [],
            retrievalPrecision: [],
            
            // Performance
            totalGenTime: [],
            throughput: [],
            memoryUsage: [],
            
            // Engagement
            queryComplexity: [],
            sessionDurations: [],
            followUpRates: [],
            queryTypes: {
                question: 0,
                summary: 0,
                comparison: 0,
                generation: 0,
                other: 0
            },
            
            // Quality
            hallucinationScores: [],
            completenessScores: [],
            sourceDiversity: []
        };
    }
    
    /**
     * Calculate lexical diversity (Distinct-1 and Distinct-2)
     */
    calculateDiversity(text) {
        const tokens = text.toLowerCase().split(/\s+/);
        const unigrams = new Set(tokens);
        const bigrams = new Set();
        
        for (let i = 0; i < tokens.length - 1; i++) {
            bigrams.add(`${tokens[i]}_${tokens[i + 1]}`);
        }
        
        const distinct1 = tokens.length > 0 ? unigrams.size / tokens.length : 0;
        const distinct2 = tokens.length > 1 ? bigrams.size / (tokens.length - 1) : 0;
        
        return { distinct1, distinct2, uniqueTokens: unigrams.size };
    }
    
    /**
     * Detect repetition in generated text
     */
    calculateRepetition(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length < 2) return 0;
        
        let repetitionCount = 0;
        const seen = new Set();
        
        sentences.forEach(sentence => {
            const normalized = sentence.trim().toLowerCase();
            if (seen.has(normalized)) {
                repetitionCount++;
            }
            seen.add(normalized);
        });
        
        return repetitionCount / sentences.length;
    }
    
    /**
     * Calculate context utilization rate (IMPROVED)
     * Uses stemming simulation and n-grams for better matching
     */
    calculateContextUtilization(response, contextChunks) {
        if (!contextChunks || contextChunks.length === 0) return 0;

        const stopwords = new Set([
            'the','and','to','of','in','a','is','it','that','for','on','with','as','are','was','were','be','by',
            'this','which','or','an','from','at','but','not','have','has','had','we','they','their','its','may',
            'can','these','those','such','been','being','would','could','should','about','into','through','during',
            'before','after','above','below','between','under','again','further','then','once','here','there',
            'when','where','why','how','all','each','few','more','most','other','some','only','own','same','than',
            'too','very','just','also','now','paper','document','study','research','results','section','chapter'
        ]);

        // Simple stemming: remove common suffixes
        const stem = (word) => {
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
        };

        const tokenize = (text) => (text || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t && t.length > 0);

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
    
    /**
     * Calculate answer grounding score (IMPROVED)
     * Uses bigrams and flexible matching
     */
    calculateGrounding(response, contextChunks) {
        if (!contextChunks || contextChunks.length === 0) return 0;
        
        const responseSentences = response.split(/[.!?]+/).filter(s => s.trim().length > 15);
        if (responseSentences.length === 0) return 0;
        
        const contextText = contextChunks.map(c => c.text.toLowerCase()).join(' ');
        
        // Build bigram set from context for better matching
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
            
            // Bigram matching (weight: 0.4) - catches phrases
            let bigramMatches = 0;
            for (let i = 0; i < words.length - 1; i++) {
                if (contextBigrams.has(words[i] + ' ' + words[i+1])) {
                    bigramMatches++;
                }
            }
            const bigramScore = words.length > 1 ? bigramMatches / (words.length - 1) : 0;
            
            // Combined score
            const sentenceScore = (wordScore * 0.6) + (bigramScore * 0.4);
            totalScore += sentenceScore;
        });
        
        return totalScore / responseSentences.length;
    }
    
    /**
     * Calculate citation coverage
     */
    calculateCitationCoverage(sources, contextChunks) {
        if (!contextChunks || contextChunks.length === 0) return 0;
        
        const uniqueSources = new Set(sources.map(s => s.source));
        const availableSources = new Set(contextChunks.map(c => c.source));
        
        return uniqueSources.size / availableSources.size;
    }
    
    /**
     * Calculate retrieval precision
     */
    calculateRetrievalPrecision(contextChunks, topSimilarity, avgSimilarity) {
        if (!contextChunks || contextChunks.length === 0) return 0;
        
        const highQualityChunks = contextChunks.filter(c => c.similarity > 0.5).length;
        return highQualityChunks / contextChunks.length;
    }
    
    /**
     * Classify query type
     */
    classifyQuery(query) {
        const q = query.toLowerCase();
        
        if (/\b(what|who|when|where|why|how|which)\b/.test(q)) {
            return 'question';
        } else if (/\b(summarize|summary|overview|brief)\b/.test(q)) {
            return 'summary';
        } else if (/\b(compare|contrast|difference|versus|vs)\b/.test(q)) {
            return 'comparison';
        } else if (/\b(generate|create|write|compose)\b/.test(q)) {
            return 'generation';
        }
        return 'other';
    }
    
    /**
     * Calculate query complexity
     */
    calculateQueryComplexity(query) {
        const words = query.split(/\s+/);
        const sentences = query.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const hasQuestionMark = query.includes('?');
        const hasClauses = query.split(/,|;/).length - 1;
        
        return {
            wordCount: words.length,
            sentenceCount: sentences.length,
            avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
            hasQuestion: hasQuestionMark,
            complexity: Math.min(10, words.length / 5 + hasClauses + (hasQuestionMark ? 1 : 0))
        };
    }
    
    /**
     * Detect potential hallucinations (IMPROVED)
     * More nuanced detection with different thresholds for different sentence types
     */
    detectHallucination(response, contextChunks) {
        if (!contextChunks || contextChunks.length === 0) return 1;
        
        const contextText = contextChunks.map(c => c.text.toLowerCase()).join(' ');
        const responseSentences = response.split(/[.!?]+/).filter(s => s.trim().length > 15);
        
        if (responseSentences.length === 0) return 0;
        
        // Build context word set with simple stemming
        const stem = (word) => word.replace(/ing$|tion$|sion$|ness$|ment$|able$|ible$|ies$|es$|s$/, '');
        const contextWords = contextText.split(/\s+/).filter(w => w.length > 3);
        const contextSet = new Set();
        contextWords.forEach(w => {
            contextSet.add(w);
            contextSet.add(stem(w));
        });
        
        // Patterns that indicate factual claims (higher risk for hallucination)
        const factualPatterns = [
            /\b(discovered|invented|published|founded|created)\s+(?:in|by)\b/i,
            /\b(in|since|from)\s+\d{4}\b/i,  // Year mentions
            /\b\d+(?:\.\d+)?\s*%/,  // Percentages
            /\b(always|never|every|all|none)\b/i,  // Absolutes
            /\b(first|only|largest|smallest|best|worst)\b/i,  // Superlatives
            /\b(according to|stated that|claimed that)\b/i,
        ];
        
        // Patterns that are usually safe (general statements)
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
            
            // Check for safe patterns (skip these)
            const isSafe = safePatterns.some(p => p.test(sentenceLower));
            if (isSafe) return;
            
            // Check word overlap with context
            let matches = 0;
            words.forEach(w => {
                if (contextSet.has(w) || contextSet.has(stem(w))) {
                    matches++;
                }
            });
            
            const overlapRatio = matches / words.length;
            
            // Higher threshold for factual claims
            const isFactualClaim = factualPatterns.some(p => p.test(sentenceLower));
            const threshold = isFactualClaim ? 0.25 : 0.15;
            
            if (overlapRatio < threshold) {
                // Weight factual claims more heavily
                hallucinationScore += isFactualClaim ? 1.5 : 1;
            }
        });
        
        // Normalize to 0-1 range
        const maxScore = responseSentences.length * 1.5;
        return Math.min(1, hallucinationScore / responseSentences.length);
    }
    
    /**
     * Calculate completeness score (did it address all parts of query?)
     */
    calculateCompleteness(query, response) {
        // Extract key question words and topics
        const queryWords = query.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 4 && !['what', 'when', 'where', 'which', 'could', 'would', 'should'].includes(w));
        
        if (queryWords.length === 0) return 1;
        
        const responseLower = response.toLowerCase();
        const addressedWords = queryWords.filter(word => responseLower.includes(word));
        
        return addressedWords.length / queryWords.length;
    }
    
    /**
     * Calculate source diversity
     */
    calculateSourceDiversity(sources) {
        if (!sources || sources.length === 0) return 0;
        const uniqueSources = new Set(sources.map(s => s.source));
        return uniqueSources.size / sources.length;
    }
    
    /**
     * Track a complete query with all metrics
     */
    trackQuery(data) {
        const {
            query,
            response,
            sources,
            contextChunks,
            ttftMs,
            totalTimeMs,
            tokensGenerated,
            topSimilarity,
            avgSimilarity
        } = data;
        
        // Generation Quality Metrics
        const responseLength = response.length;
        this.metrics.responseLengths.push(responseLength);
        
        const diversity = this.calculateDiversity(response);
        this.metrics.diversityDistinct1.push(diversity.distinct1);
        this.metrics.diversityDistinct2.push(diversity.distinct2);
        
        const repetition = this.calculateRepetition(response);
        this.metrics.repetitionScores.push(repetition);
        
        // RAG-specific Metrics
        const contextUtil = this.calculateContextUtilization(response, contextChunks);
        this.metrics.contextUtilization.push(contextUtil);
        
        const grounding = this.calculateGrounding(response, contextChunks);
        this.metrics.answerGrounding.push(grounding);
        
        const citationCov = this.calculateCitationCoverage(sources, contextChunks);
        this.metrics.citationCoverage.push(citationCov);
        
        const retrievalPrec = this.calculateRetrievalPrecision(contextChunks, topSimilarity, avgSimilarity);
        this.metrics.retrievalPrecision.push(retrievalPrec);
        
        // Performance Metrics
        this.metrics.totalGenTime.push(totalTimeMs);
        const throughput = totalTimeMs > 0 ? (tokensGenerated / totalTimeMs) * 1000 : 0;
        this.metrics.throughput.push(throughput);
        
        // Engagement Metrics
        const queryComp = this.calculateQueryComplexity(query);
        this.metrics.queryComplexity.push(queryComp.complexity);
        
        const queryType = this.classifyQuery(query);
        this.metrics.queryTypes[queryType]++;
        
        // Quality Metrics
        const hallucinationScore = this.detectHallucination(response, contextChunks);
        this.metrics.hallucinationScores.push(hallucinationScore);
        
        const completeness = this.calculateCompleteness(query, response);
        this.metrics.completenessScores.push(completeness);
        
        const sourceDiversity = this.calculateSourceDiversity(sources);
        this.metrics.sourceDiversity.push(sourceDiversity);
        
        return {
            responseLength,
            diversity,
            repetition,
            contextUtilization: contextUtil,
            answerGrounding: grounding,
            citationCoverage: citationCov,
            retrievalPrecision: retrievalPrec,
            throughput,
            queryComplexity: queryComp,
            queryType,
            hallucinationScore,
            completeness,
            sourceDiversity
        };
    }
    
    /**
     * Get aggregated statistics
     */
    getAggregatedStats() {
        const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const median = arr => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        };
        const percentile = (arr, p) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const idx = Math.ceil((p / 100) * sorted.length) - 1;
            return sorted[Math.max(0, idx)];
        };
        
        return {
            generation: {
                avgResponseLength: avg(this.metrics.responseLengths),
                medianResponseLength: median(this.metrics.responseLengths),
                minResponseLength: Math.min(...this.metrics.responseLengths, 0),
                maxResponseLength: Math.max(...this.metrics.responseLengths, 0),
                avgDistinct1: avg(this.metrics.diversityDistinct1),
                avgDistinct2: avg(this.metrics.diversityDistinct2),
                avgRepetition: avg(this.metrics.repetitionScores)
            },
            rag: {
                avgContextUtilization: avg(this.metrics.contextUtilization),
                avgAnswerGrounding: avg(this.metrics.answerGrounding),
                avgCitationCoverage: avg(this.metrics.citationCoverage),
                avgRetrievalPrecision: avg(this.metrics.retrievalPrecision)
            },
            performance: {
                avgTotalGenTime: avg(this.metrics.totalGenTime),
                medianTotalGenTime: median(this.metrics.totalGenTime),
                p95TotalGenTime: percentile(this.metrics.totalGenTime, 95),
                avgThroughput: avg(this.metrics.throughput)
            },
            engagement: {
                avgQueryComplexity: avg(this.metrics.queryComplexity),
                queryTypeDistribution: { ...this.metrics.queryTypes }
            },
            quality: {
                avgHallucinationScore: avg(this.metrics.hallucinationScores),
                avgCompleteness: avg(this.metrics.completenessScores),
                avgSourceDiversity: avg(this.metrics.sourceDiversity)
            }
        };
    }
    
    /**
     * Export all metrics for dashboard
     */
    export() {
        return {
            raw: this.metrics,
            aggregated: this.getAggregatedStats()
        };
    }
}