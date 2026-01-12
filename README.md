# 📚 Local LLM Literature Reviewer

> A privacy-first, fully browser-based AI research assistant powered by WebLLM and Transformers.js. No cloud, no data sharing - everything runs locally on your device.

![Interface Preview](preview.png)

## 🎯 Project Overview

This application enables researchers to analyze multiple PDF research papers simultaneously using a local Large Language Model. The RAG (Retrieval-Augmented Generation) pipeline runs entirely in the browser, ensuring complete privacy for sensitive research documents.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔒 **100% Local** | All processing happens in your browser - no data sent to servers |
| 📄 **Multi-PDF Support** | Upload and analyze multiple research papers simultaneously |
| 🔍 **Hybrid Search** | Combines semantic embeddings + keyword matching (RRF) for best results |
| 📊 **Analytics Dashboard** | Track performance metrics, grounding scores, and user feedback |
| 🎤 **Voice Interface** | Speech-to-Text (Whisper) and Text-to-Speech support |
| ⚡ **Smart Caching** | IndexedDB caching for instant re-uploads (7-day expiry) |
| 📑 **Page Citations** | Inline citations with page numbers `[1] [Page 5]` |

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **WebLLM** | In-browser LLM inference via WebGPU | Latest |
| **Transformers.js** | Embeddings (all-MiniLM-L6-v2) + Whisper STT | 2.17.1 |
| **PDF.js** | PDF text extraction with parallel processing | 3.11.174 |
| **Tailwind CSS** | Responsive UI styling | CDN |
| **Firebase** | Analytics persistence (optional) | 11.7.0 |
| **IndexedDB** | Client-side document caching | Native |
| **Vanilla JavaScript** | No framework dependencies | ES2020 |

## 🚀 Quick Start

### Prerequisites

- **Browser**: Chrome 113+ or Edge 113+ with WebGPU support
- **RAM**: 8GB minimum (16GB recommended for 3B model)
- **GPU**: WebGPU-compatible graphics card

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/TheNarciss/AICGLLM.git
   cd AICGLLM
   ```

2. **Start the local server** (required for COOP/COEP headers)
   ```bash
   python server.py
   ```
   
   Or with Python's built-in server:
   ```bash
   python -m http.server 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Load models** and start analyzing papers!

### GitHub Pages Deployment

Live demo: **https://yourusername.github.io/AICGLLM/**

> ⚠️ Note: For full WebGPU functionality, we recommend Cloudflare Pages or Netlify with the provided `_headers` file for COOP/COEP support.

## 📖 Usage Guide

### Step 1: Load Models
Click **"Load Models"** to initialize:
- 📦 Embedding model (~30MB) - for semantic search
- 🤖 LLM model (3B: ~1.5GB, 1B fallback: ~500MB) - for generation
- 🎤 Whisper tiny (~40MB) - for voice input

### Step 2: Upload Research Papers
- Drag & drop PDF files onto the upload zone
- Multiple files supported simultaneously
- Progress shows: extraction → chunking → embedding phases
- **Cached documents load instantly** on re-upload (⚡ <1 second)

### Step 3: Ask Questions
Example queries:
- *"What are the main themes across these papers?"*
- *"Compare the methodologies used"*
- *"Generate a literature review"*
- *"What does Paper A say about [topic] vs Paper B?"*

### Step 4: Review with Citations
Responses include:
- Inline citations `[1]`, `[2]` referencing source documents
- Page numbers: `[Page 5-7]`
- Retrieved context panel showing used chunks with similarity scores

## 🧠 Architecture

### RAG Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PDF Upload                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│     PDF.js Parallel Extraction (8 pages/batch)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│     Page-Aware Chunking (800 chars, 100 overlap)            │
│     + Chapter/Section Detection                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│      Transformers.js Embedding (all-MiniLM-L6-v2)           │
│      Priority: Overview chunks first for quick start         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Vector Store + IndexedDB Cache (7 days)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
         User Query    │
              │        │
              ▼        ▼
┌─────────────────────────────────────────────────────────────┐
│     Query Classification (Embedding-based)                   │
│     Generic → Overview chunks | Specific → Hybrid Search     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             Hybrid Search (Semantic + Keyword)               │
│             Reciprocal Rank Fusion (RRF, k=60)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Context Truncation (~3000 tokens max)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│    System Prompt + Context + Chat History → WebLLM          │
│    (Llama-3.2-3B-Instruct with 1B fallback)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Response with Inline Citations [1][2]          │
└─────────────────────────────────────────────────────────────┘
```

### Cosine Similarity Formula

$$\text{similarity} = \frac{\sum (A_i \times B_i)}{\sqrt{\sum A_i^2} \times \sqrt{\sum B_i^2}}$$

### Hybrid Search: Reciprocal Rank Fusion

```javascript
// Combines semantic and keyword search results
score(doc) = Σ 1/(k + rank_i)  // k=60, across all rankings
```

## 📊 Analytics Dashboard

Access via the **"📊 Dashboard"** button to view:

### Tracked Metrics

| Metric | Description | Good | Warning |
|--------|-------------|------|---------|
| Context Utilization | % of response words from context | >50% | <30% |
| Answer Grounding | % of sentences with source overlap | >60% | <40% |
| Hallucination Score | % of unsupported factual claims | <20% | >40% |
| TTFT | Time to First Token | <5s | >15s |
| Throughput | Tokens per second | >10 | <5 |

### Self-Evaluation (LLM-based)

Each response is automatically rated 1-5 on:
- **Faithfulness**: Uses only context information
- **Relevance**: Answers the question asked  
- **Coherence**: Well-structured response

## 🔧 Configuration

### Adjustable Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `CHUNK_SIZE` | 800 | Characters per chunk |
| `CHUNK_OVERLAP` | 100 | Overlap between chunks |
| `TOP_K` | 10 | Chunks retrieved per query |
| `Temperature` | 0.3 | LLM creativity (lower = more factual) |
| `LLM_MODEL` | Llama-3.2-3B | Primary model (auto-fallback to 1B) |

### System Prompt

Customizable via System Controls panel. Default enforces:
- ✅ Inline citations `[1]`, `[2]`
- ✅ Literature review structure (Intro, Themes, Methods, Conclusion)
- ✅ Anti-hallucination rules
- ✅ Quote requirements for factual claims

## 🎤 Voice Features (Bonus)

### Speech-to-Text (STT)
- Model: `Xenova/whisper-tiny`
- Click 🎤 microphone icon to record
- Automatic transcription to chat input

### Text-to-Speech (TTS)
- Uses browser's native `SpeechSynthesis` API
- Auto-reads responses under 800 characters
- Toggle on/off in System Controls

## 📁 Project Structure

```
AICGLLM/
├── index.html              # Main SPA application
├── dashboard.html          # Analytics dashboard
├── analytics.js            # Advanced metrics computation
├── analytics.worker.js     # Off-thread analytics (Web Worker)
├── embeddings.worker.js    # Off-thread embeddings (Web Worker)
├── server.py               # Local dev server with CORS headers
├── _headers                # Cloudflare/Netlify COOP/COEP config
├── 404.html                # SPA redirect for GitHub Pages
└── README.md               # Documentation
```

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| "WebGPU not supported" | Update Chrome/Edge to version 113+ |
| Models fail to load | Check internet connection, clear cache, retry |
| "Context window exceeded" | Automatic truncation handles this |
| PDF extraction empty | PDF may be image-based (OCR not supported) |
| Slow performance | Close other GPU-intensive tabs |
| SharedArrayBuffer error | Use `python server.py` for proper COOP/COEP headers |

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - free for personal and commercial use.

## 🙏 Acknowledgments

- [WebLLM](https://webllm.mlc.ai/) by MLC team - Browser LLM inference
- [Transformers.js](https://huggingface.co/docs/transformers.js/) by Hugging Face - Web ML
- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla - PDF parsing
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Made with ❤️ for privacy-conscious researchers**

*All processing happens locally. Your research stays yours.*
