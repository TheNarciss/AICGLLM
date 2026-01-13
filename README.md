# Literature Reviewer

Hi everyone, here's my not very local... local RAG system for reviewing scientific papers.

**Why isn't it fully local ?** I found it useful to add a dashboard that tracks various metrics about the RAG performance. If you want something fully private with no cloud, just go into the dashboard code and delete the Firebase API key (you also can create your own Firebase project and copy-paste your API key...)

![Interface Screenshot](/Screenshots/Interface.png)
![Dashboard Screenshot](/Screenshots/Dashboard.png)

## First words : How to improve 

1 - This RAG could be improved by implementing a more reliable way to parse PDFs (finding title, subtitle, and section delimitation). As it is, the algorithm tries to find the title and to understand the paper's format (one column, two columns, etc.) using a trivial "is there a space in the center". Using a more advanced Python PDF parsing library could be useful, but I really wanted to deploy on GitHub Pages, soooooooooo we are stuck with PDF.js (didn't find any other reliable lib which is quick enough to be used in this context).

2- I use a system which re-rank the "Summary" chunks if ask "Summarize this text" or equivalent. The agorithme of this need to be improved as rightnow he always re rank it on the top.


## Features
Here are all the cool features we implemented in this project. (Take the time to read them to understand better how everything works)

### Quick Start & Lazy Loading
- **Priority Embedding:** First 20% of document (abstract, intro) embedded immediately
- **Background Processing:** Remaining chunks embedded progressively while you read
- **Model Fallback:** Tries 3B model first, auto-fallback to 1B if GPU can't handle it
- **PDF Caching:** IndexedDB cache for previously loaded PDFs

### Smart Retrieval
- **Hybrid Search:** Combines semantic (cosine similarity) + keyword (BM25) with RRF fusion
- **Query Classification:** Detects generic vs specific questions, adjusts retrieval strategy
- **Chunk Type Boosting:** Abstracts and introductions get priority for overview questions

### Chat Interface
- **Clickable Citations:** Click `[1]`, `[2]` in responses to see the exact source chunk
- **Source Popup:** Shows file, page, chunk type, similarity score, and full text
- **Markdown Rendering:** Bold, bullets, headers rendered in real-time
- **Chat History:** Multi-turn conversations with context

### Voice Features
- **Voice Input:** Hold mic button or use Whisper for accurate transcription
- **Voice Activity Detection (VAD):** Auto-stops recording when you stop talking
- **Text-to-Speech:** Optional TTS for responses (toggle in settings)

### Analytics Dashboard
- **Real-time Metrics:** TTFT, throughput, retrieval time per query
- **Quality Scores:** Context utilization, grounding, hallucination detection
- **Multi-user Tracking:** Anonymous session tracking across users
- **LLM Analysis:** Dashboard has its own local LLM to summarize performance trends (yeah, I know that is over-engineered but quite cool!)

### UI/UX
- **Retro Terminal Aesthetic:** Dark mode, monospace fonts, amber accents
- **Custom Modals:** Styled popups instead of native browser alerts
- **Responsive Design:** Works on desktop and tablet 
- **Keyboard Shortcuts:** Enter to send, Shift+Enter for newline

### Privacy Controls
- **Fully Local Option:** Remove Firebase config for zero cloud dependency
- **No Document Upload:** PDFs never leave your browser
- **Incognito Friendly:** All processing in-browser via WebGPU/WASM

## Tech Stack

| Component | Technology |
|-----------|------------|
| LLM | [WebLLM](https://github.com/mlc-ai/web-llm) (Llama 3.2 3B/1B) |
| Embeddings | [Transformers.js](https://huggingface.co/docs/transformers.js) (BGE-small-en-v1.5) |
| PDF Parsing | PDF.js |
| Speech | Web Speech API + Transformers.js Whisper |
| Styling | Tailwind CSS |
| Analytics | Firebase Realtime Database |
| Framework | Vanilla JS (no React/Vue) |



## How It Works

### RAG Pipeline

```
PDF Upload → Chunking → Embedding → Vector Store
                                        ↓
User Query → Embed Query → Hybrid Search → Top-K Chunks → LLM → Response
```

### Chunking
- **Size:** 800 chars, 100 overlap
- **Priority:** First 20% embedded immediately (abstracts, intros)

### Hybrid Search (RRF Fusion)

```
RRF_score(chunk) = Σ 1/(k + rank_i)
```
- `k = 60`
- Combines semantic similarity + keyword BM25

### Query Classification
Cosine similarity against template embeddings:
- **Generic** (summaries) → boost intro/abstract chunks
- **Specific** (detailed) → standard retrieval



## Metrics

### Performance
| Metric | Description |
|--------|-------------|
| TTFT | Time to First Token (ms) |
| Throughput | `tokens / time × 1000` (tok/s) |

### Quality
| Metric | Formula |
|--------|---------|
| Context Utilization | `matched_tokens / response_tokens` |
| Answer Grounding | `word_overlap × 0.6 + bigram_overlap × 0.4` |
| Hallucination Score | Sentences with low context overlap |
| Distinct-1/2 | Lexical diversity (unique n-grams ratio) |



## Local Setup

**Requirements:**
- Browser with WebGPU (Chrome/Edge 113+)
- ~2.5GB VRAM (3B) or ~1.2GB (1B fallback)

**Run:**
```

VS Code Live Server extension 
( you can do a python server if you want but god liveserver... we like it ! )

```

**Go fully private:** Delete the Firebase config in `index.html` and `dashboard.html`.



## Files

```
├── index.html           # Main app
├── dashboard.html       # Analytics
├── analytics.js         # Metrics tracking
├── analytics_worker.js  # Background computation
├── embeddings_worker.js # Background embeddings
└── 404.html             # SPA redirect
```



## Privacy

**Local:** PDFs, LLM, embeddings — all in-browser, nothing uploaded.

**Cloud (optional):** Anonymous metrics only. Remove Firebase to disable.


## Clement Gardair 