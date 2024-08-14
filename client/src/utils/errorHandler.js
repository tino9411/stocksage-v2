// src/utils/errorHandler.js

export const handleResizeObserverError = () => {
    const debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    };
  
    const resizeObserverError = Error("ResizeObserver loop limit exceeded");
    const debouncedConsoleError = debounce(console.error, 200);
  
    window.addEventListener("error", (e) => {
      if (e.message === resizeObserverError.message) {
        e.stopImmediatePropagation();
        debouncedConsoleError(resizeObserverError);
      }
    });
  };