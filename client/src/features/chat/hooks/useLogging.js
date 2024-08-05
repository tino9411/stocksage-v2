import { useState, useCallback } from 'react';
import { debounce } from 'lodash';

export const useLogging = () => {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback(debounce((log) => {
    console.log(log);
    setLogs((prevLogs) => [...prevLogs, log]);
  }, 300), []);

  const addServerLogs = useCallback((serverLogs) => {
    if (Array.isArray(serverLogs)) {
      setLogs((prevLogs) => [...prevLogs, ...serverLogs]);
    }
  }, []);

  return {
    logs,
    addLog,
    addServerLogs
  };
};