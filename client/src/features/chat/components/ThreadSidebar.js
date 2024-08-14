import React from 'react';
import { Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getRelativeTime } from '../utils/dateUtils';
import {
    ThreadSidebar as StyledThreadSidebar,
    ThreadList,
    ThreadListItem,
    ThreadSidebarHeader,
    StyledThreadButton,
    ThreadTitle,
    ThreadInfo,
    ThreadListItemContent
} from '../styles/chatStyles';  // Updated import path

function ThreadSidebar({ onSelectThread, selectedThreadId, threads, onCreateThread }) {
    const getThreadTitle = (threadId) => {
        return `${threadId.slice(0, 27)}...`;
    };

    return (
        <StyledThreadSidebar>
            <ThreadSidebarHeader>
                <StyledThreadButton
                    variant="outlined"
                    size="small"
                    onClick={onCreateThread}
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
                        </ThreadListItem>
                    ))
                )}
            </ThreadList>
        </StyledThreadSidebar>
    );
}

export default ThreadSidebar;