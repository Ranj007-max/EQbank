// This module will manage the HLPE Web Worker.
// It will be responsible for creating the worker, sending it messages,
// and listening for messages from it.

let hlpeWorker: Worker | null = null;

export const startHlpe = (): Worker | null => {
  if (window.Worker) {
    if (hlpeWorker === null) {
      hlpeWorker = new Worker(new URL('./hlpeEngine.worker.ts', import.meta.url), {
        type: 'module',
      });

      hlpeWorker.onerror = (error) => {
        console.error('Error in HLPE worker:', error);
      };

      console.log('HLPE Worker started.');
      return hlpeWorker;
    }
    return hlpeWorker;
  } else {
    console.warn('Web Workers are not supported in this browser. HLPE will not run.');
    return null;
  }
};

export const stopHlpe = () => {
  if (hlpeWorker) {
    hlpeWorker.terminate();
    hlpeWorker = null;
    console.log('HLPE Worker stopped.');
  }
};

export const postMessageToHlpe = (message: any) => {
  if (hlpeWorker) {
    hlpeWorker.postMessage(message);
  } else {
    console.warn('Cannot post message: HLPE worker is not running.');
  }
};
