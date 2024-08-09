import React, { useEffect, useState, useCallback } from 'react';
import { List, ListItem, ListItemText, Button, Typography } from '@mui/material';
import { useThreadManagement } from '../hooks/useThreadManagement';

function ThreadSidebar({ onSelectThread }) {
  const { threads, fetchThreads, createThread, deleteThread } = useThreadManagement();
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [creationError, setCreationError] = useState(null);

  const fetchThreadsMemoized = useCallback(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    fetchThreadsMemoized();
  }, [fetchThreadsMemoized]);

  const handleThreadSelect = (threadId) => {
    setSelectedThreadId(threadId);
    onSelectThread(threadId);
  };

  const handleThreadDelete = async (threadId, event) => {
    event.stopPropagation(); // Prevent triggering ListItem's onClick
    console.log('Attempting to delete thread with ID:', threadId); // Debugging
    try {
      await deleteThread(threadId);
      fetchThreadsMemoized(); // Refresh threads after deletion
    } catch (error) {
      console.error('Error deleting thread:', error); // Debugging
    }
  };

  const handleCreateThread = async () => {
    setIsCreatingThread(true);
    setCreationError(null);
    try {
      await createThread(); // Create a new thread
      fetchThreadsMemoized(); // Refresh threads after creation
    } catch (error) {
      setCreationError('Failed to create a new thread. Please try again.'); // Handle error
    } finally {
      setIsCreatingThread(false);
    }
  };

  if (!threads) {
    return <p>Loading threads...</p>; // Show a loading message or spinner while threads are being fetched
  }

  return (
    <div>
      <Button 
        onClick={handleCreateThread}
        disabled={isCreatingThread}
        variant="contained"
        color="primary"
      >
        {isCreatingThread ? 'Creating...' : 'Create Thread'}
      </Button>
      {creationError && (
        <Typography color="error">{creationError}</Typography>
      )}
      <Button onClick={fetchThreadsMemoized}>Refresh Threads</Button>
      <List>
        {threads.length === 0 ? (
          <ListItem>
            <ListItemText primary="No threads available" />
          </ListItem>
        ) : (
          threads.map((thread) => (
            <ListItem
              key={thread.threadId} // Use thread.threadId
              button
              selected={selectedThreadId === thread.threadId} // Compare with thread.threadId
              onClick={() => handleThreadSelect(thread.threadId)} // Pass thread.threadId
            >
              <ListItemText primary={`Thread ${thread.threadId}`} /> 
              <Button
                variant="outlined"
                color="secondary"
                onClick={(event) => handleThreadDelete(thread.threadId, event)} // Pass thread.threadId
              >
                Delete
              </Button>
            </ListItem>
          ))
        )}
      </List>
    </div>
  );
}

export default ThreadSidebar;