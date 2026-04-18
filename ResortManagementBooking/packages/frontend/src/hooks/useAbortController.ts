import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook that provides an AbortController which automatically aborts on component unmount.
 * Also tracks pending requests and cancels them when dependencies change.
 */
export const useAbortController = () => {
  const controllerRef = useRef<AbortController | null>(null);

  // Get or create controller
  const getController = useCallback(() => {
    if (!controllerRef.current) {
      controllerRef.current = new AbortController();
    }
    return controllerRef.current;
  }, []);

  // Abort current controller and create new one
  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Get signal for requests
  const getSignal = useCallback(() => {
    return getController().signal;
  }, [getController]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  return {
    getSignal,
    abort,
    controllerRef,
    isAborted: () => controllerRef.current?.signal.aborted ?? false,
  };
};

/**
 * Hook that creates a new AbortController and aborts previous requests
 * when dependency array changes. Perfect for tab changes and search inputs.
 */
export const useCancellableRequest = <T>(
  requestFn: (signal: AbortSignal) => Promise<T>,
  deps: any[] = []
) => {
  const controllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (): Promise<T> => {
    // Abort previous request if exists
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // Create new controller
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      return await requestFn(controller.signal);
    } catch (error: any) {
      // If this request was canceled, swallow the error
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        // Return rejected promise with marked canceled error
        error.isCanceled = true;
      }
      throw error;
    }
  }, deps);

  // Abort on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  // Abort on dependency change
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, deps);

  return {
    execute,
    abort: () => controllerRef.current?.abort(),
  };
};

export default useAbortController;
