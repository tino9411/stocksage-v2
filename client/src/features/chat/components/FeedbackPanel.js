// client/src/components/chat/FeedbackPanel.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const PanelContainer = styled(Box)(({ theme, isExpanded }) => ({
  position: 'fixed',
  right: isExpanded ? 0 : -448,
  top: 0,
  bottom: 0,
  width: '450px',
  backgroundColor: '#2A2B31',
  borderLeft: `1px solid ${theme.palette.divider}`,
  transition: 'right 0.3s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const LogContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflowY: 'auto',
  flexGrow: 1,
}));

const StyledPre = styled('pre')(({ theme }) => ({
  margin: 0,
  marginBottom: theme.spacing(1),
  fontSize: '0.8rem',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}));

const ToggleButton = styled(IconButton)(({ theme, isExpanded }) => ({
  position: 'absolute',
  left: -28,
  top: '25%',
  transform: 'translateY(-50%)',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const LogEntry = ({ log }) => {
    // eslint-disable-next-line no-control-regex
    const cleanLog = log.replace(/\x1b\[[0-9;]*m/g, '');
    return <StyledPre>{cleanLog}</StyledPre>;
  };
  

const FeedbackPanel = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (logs.length > 0) {
      setIsExpanded(true);
    }
  }, [logs]);

  return (
    <PanelContainer isExpanded={isExpanded}>
      <ToggleButton
        size="small"
        onClick={() => setIsExpanded(!isExpanded)}
        isExpanded={isExpanded}
      >
        {isExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </ToggleButton>
      <PanelHeader>
        <Typography variant="subtitle2">System Feedback</Typography>
        <IconButton size="small" onClick={() => setIsExpanded(false)} color="inherit">
          <CloseIcon fontSize="small" />
        </IconButton>
      </PanelHeader>
      <LogContainer>
        {logs.map((log, index) => (
          <LogEntry key={index} log={log} />
        ))}
      </LogContainer>
    </PanelContainer>
  );
};

export default FeedbackPanel;