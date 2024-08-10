import React, { useEffect, useCallback } from 'react';
import { Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useThreadManagement } from '../hooks/useThreadManagement';
import { getRelativeTime } from '../utils/dateUtils';
import {
    ThreadSidebar as StyledThreadSidebar,
    ThreadList,
    ThreadListItem,
    ThreadSidebarHeader,
    StyledThreadButton,
    ThreadTitle,
    ThreadInfo,
    DeleteButton,
    ThreadListItemContent
} from '../styles/threadStyles';

function ThreadSidebar({ onSelectThread, selectedThreadId }) {
    const { threads, fetchThreads, createThread, deleteThread } = useThreadManagement();

    const fetchThreadsMemoized = useCallback(() => {
        fetchThreads();
    }, [fetchThreads]);

    useEffect(() => {
        fetchThreadsMemoized();
        const intervalId = setInterval(fetchThreadsMemoized, 30000);
        return () => clearInterval(intervalId);
    }, [fetchThreadsMemoized]);

    const handleCreateThread = async () => {
        try {
            await createThread();
            fetchThreadsMemoized();
        } catch (error) {
            console.error('Failed to create a new thread:', error);
        }
    };

    const handleThreadDelete = async (threadId, event) => {
        event.stopPropagation();
        try {
            await deleteThread(threadId);
            fetchThreadsMemoized();
        } catch (error) {
            console.error('Error deleting thread:', error);
        }
    };

    const getThreadTitle = (threadId) => {
        return `${threadId.slice(0, 27)}...`;
    };

    return (
        <StyledThreadSidebar>
            <ThreadSidebarHeader>
                <Typography variant="h6">Threads</Typography>
                <StyledThreadButton
                    variant="outlined"
                    size="small"
                    onClick={handleCreateThread}
                    startIcon={<AddIcon />}
                >
                    New
                </StyledThreadButton>
            </ThreadSidebarHeader>
            <ThreadList>
                {threads.length === 0 ? (
                    <Typography variant="body2">No threads available</Typography>
                ) : (
                    threads.map((thread) => (
                        <ThreadListItem
                            key={thread.threadId}
                            selected={selectedThreadId === thread.threadId}
                            onClick={() => onSelectThread(thread.threadId)}
                        >
                            <ThreadListItemContent>
                                <ThreadTitle>{getThreadTitle(thread.threadId)}</ThreadTitle>
                                <ThreadInfo>{`${getRelativeTime(new Date(thread.createdAt))}`}</ThreadInfo>
                            </ThreadListItemContent>
                            <DeleteButton
                                className="delete-button"
                                size="small"
                                onClick={(event) => handleThreadDelete(thread.threadId, event)}
                                aria-label="delete thread"
                            >
                                <DeleteIcon fontSize="small" />
                            </DeleteButton>
                        </ThreadListItem>
                    ))
                )}
            </ThreadList>
        </StyledThreadSidebar>
    );
}

export default ThreadSidebar;