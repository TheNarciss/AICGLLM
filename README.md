# 📚 Local LLM Literature Reviewer

> A privacy-first, fully browser-based AI research assistant that runs entirely on the client side.

![Interface Preview](preview.png)

## 🌟 Features

### 🔒 100% Private & Local
- **No Cloud Required**: All processing happens in your browser
- **No Data Leaves Your Device**: Your research papers stay private
- **Offline Capable**: Once models are loaded, works without internet

### 📄 Smart Document Processing (RAG Engine)
- **PDF Ingestion**: Drag & drop multiple research papers
- **Intelligent Chunking**: Sliding window algorithm (500 chars, 100 overlap)
- **Vector Embeddings**: Using Xenova/all-MiniLM-L6-v2
- **Custom Vector Database**: In-memory similarity search

### 🤖 AI-Powered Analysis
- **WebLLM Integration**: Runs Llama-3.2-1B directly in browser via WebGPU
- **Context-Aware Responses**: RAG retrieval for accurate answers
- **Literature Review Generation**: Synthesizes themes across papers
- **Source Citations**: Shows which papers were used for each answer

### 🎛️ Customizable Controls
- **Temperature Adjustment**: Control creativity vs precision
- **Top-K Chunks**: Adjust how much context is retrieved
- **Custom System Prompts**: Tailor the AI's behavior
- **Memory Bank Visualization**: See document stats in real-time

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **WebLLM** | In-browser LLM inference via WebGPU |
| **Transformers.js** | Embeddings with all-MiniLM-L6-v2 |
| **PDF.js** | PDF text extraction |
| **Tailwind CSS** | Responsive UI styling |
| **Vanilla JavaScript** | No framework dependencies |

## 🚀 Quick Start

### Prerequisites
- Modern browser with **WebGPU support**:
  - Chrome 113+ ✅
  - Edge 113+ ✅
  - Firefox (behind flag) ⚠️
  - Safari (experimental) ⚠️
- ~4GB RAM for model loading
- GPU with WebGPU capabilities

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lit-reviewer.git
   cd lit-reviewer
   ```

2. **Start a local server** (required for ES Modules)
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js
   npx serve .
   
   # Or using VS Code Live Server extension
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Load the models** by clicking the "Load Models" button

5. **Upload PDFs** and start asking questions!

### GitHub Pages Deployment

The app is deployed and accessible at:
```
https://yourusername.github.io/lit-reviewer/
```

## 📖 Usage Guide

### Step 1: Load Models
Click the **"Load Models"** button. This will:
- Download the embedding model (~30MB)
- Download the LLM model (~500MB)
- Initialize WebGPU inference

⏱️ First load takes 2-5 minutes depending on your connection.

### Step 2: Upload Research Papers
- Drag & drop PDF files onto the upload zone
- Or click to browse and select files
- Watch the progress as text is extracted and embedded

### Step 3: Ask Questions
Example queries:
- "What are the main themes across these papers?"
- "Compare the methodologies used in the uploaded papers"
- "Generate a literature review of the uploaded papers"
- "What do the authors say about [specific topic]?"

### Step 4: Review Sources
Each response shows which papers were used as context, ensuring transparency and traceability.

## 🧠 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    PDF Upload                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              PDF.js Text Extraction                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Chunking (500 chars, 100 overlap)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│      Transformers.js Embedding (all-MiniLM-L6-v2)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Vector Store (In-Memory)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
         User Query    │
              │        │
              ▼        ▼
┌─────────────────────────────────────────────────────────────┐
│         Cosine Similarity Search (Top-K)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│    Context Injection + Chat History + System Prompt          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              WebLLM (Llama-3.2-1B-Instruct)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Response + Citations                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Adjustable Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Chunk Size | 500 | Characters per text chunk |
| Chunk Overlap | 100 | Overlapping characters between chunks |
| Top-K | 5 | Number of relevant chunks to retrieve |
| Temperature | 0.7 | LLM creativity (0=focused, 1=creative) |

### System Prompt
The default system prompt instructs the model to act as an Academic Researcher. You can modify it in the System Controls panel.

## 🎤 Bonus: Voice Features

- **Text-to-Speech**: Uses browser's native SpeechSynthesis API
- **Speech-to-Text**: Microphone input with visual feedback
- Click the microphone icon to start voice input

## ⚠️ Troubleshooting

### "WebGPU not supported"
- Update your browser to the latest version
- Check if WebGPU is enabled in `chrome://flags` (if using Chrome)
- Try Chrome Canary or Edge Canary for latest WebGPU support

### "SharedArrayBuffer" errors
- Run with a dev server that supports COOP/COEP headers
- Or use a browser profile with reduced security for localhost

### Models fail to load
- Ensure you have stable internet for initial download
- Check browser console for specific error messages
- Try clearing browser cache and reloading

### PDF text extraction fails
- Some PDFs are image-based and don't contain extractable text
- Try OCR-processed PDFs instead
- Check if the PDF is password protected

## 📁 Project Structure

```
lit-reviewer/
├── index.html          # Main application (SPA)
├── README.md           # Documentation
└── preview.png         # Screenshot for README
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- [WebLLM](https://webllm.mlc.ai/) - MLC team for browser LLM inference
- [Transformers.js](https://huggingface.co/docs/transformers.js/) - Hugging Face for web ML
- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla for PDF parsing
- [Tailwind CSS](https://tailwindcss.com/) - For beautiful styling

---

Made with ❤️ for privacy-conscious researchers
