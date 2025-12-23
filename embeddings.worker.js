// embeddings.worker.js
// Web worker to run embedding pipeline off the main thread.
// It loads Transformers.js inside the worker and exposes a simple RPC:
// - postMessage({ action: 'init', model: '<model-name>' }) -> loads pipeline
// - postMessage({ action: 'embedBatch', id, texts: [...] }) -> replies with { id, buffers: [ArrayBuffer,...], dims }

let pipelineFn = null;
let modelName = null;
let pipelineObj = null;

self.onmessage = async (e) => {
  const { action } = e.data || {};
  try {
    if (action === 'init') {
      modelName = e.data.model;
      // dynamic import of transformers
      const mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
      pipelineFn = mod.pipeline;
      // create pipeline
      pipelineObj = await pipelineFn('feature-extraction', modelName, {
        progress_callback: (p) => {
          // optionally post progress
          self.postMessage({ action: 'initProgress', progress: p });
        }
      });
      self.postMessage({ action: 'inited', model: modelName });
    } else if (action === 'embedBatch') {
      if (!pipelineObj) {
        throw new Error('Pipeline not initialized in worker');
      }
      const { id, texts } = e.data;
      // compute embeddings sequentially or in parallel depending on env
      const results = await Promise.all(texts.map(t => pipelineObj(t, { pooling: 'mean', normalize: true })));
      const buffers = [];
      let dims = 0;
      for (const res of results) {
        const arr = res.data ? new Float32Array(res.data) : new Float32Array(res);
        buffers.push(arr.buffer);
        dims = arr.length; // assume consistent
      }
      // Transfer buffers back to main thread to avoid copy
      self.postMessage({ action: 'embedResult', id, buffers, dims }, buffers);
    }
  } catch (err) {
    self.postMessage({ action: 'error', message: err.message, stack: err.stack });
  }
};
