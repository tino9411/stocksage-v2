// src/utils/resizeObserver.js

export const createLimitedResizeObserver = (callback, delay = 100) => {
    let timeoutId = null;
    return new ResizeObserver((entries, observer) => {
      if (timeoutId) {
        return;
      }
      timeoutId = setTimeout(() => {
        callback(entries, observer);
        timeoutId = null;
      }, delay);
    });
  };