/**
 * A steady tick for the scheduler. A Worker keeps ticking while the tab is
 * in the background, where the page's own timers are throttled; where no
 * Worker starts, a plain interval stands in.
 */

export function startTicker(tick: () => void, everyMs = 25): () => void {
  const interval = () => {
    const id = setInterval(tick, everyMs);
    return () => clearInterval(id);
  };
  let url: string | undefined;
  try {
    const source =
      'let id;onmessage=e=>{clearInterval(id);if(e.data>0)id=setInterval(()=>postMessage(0),e.data)}';
    url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);
    let stop = () => {
      worker.terminate();
      if (url) URL.revokeObjectURL(url);
    };
    worker.onmessage = tick;
    worker.onerror = () => {
      stop();
      stop = interval();
    };
    worker.postMessage(everyMs);
    return () => stop();
  } catch {
    if (url) URL.revokeObjectURL(url);
    return interval();
  }
}
