import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import { useChatState } from '../hooks/useChatState';
import { InputArea, StyledTextField, StyledButton } from '../styles/chatStyles';
import { Popper, Paper, Typography, ClickAwayListener, IconButton, Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/system';
import FilePreviewComponent from './FilePreviewComponent';
import { debounce } from 'lodash';

const commands = [
  { command: '/analyse', description: 'Provide a comprehensive analysis of a stock' },
  { command: '/price', description: 'Get the current price of a stock' },
  { command: '/news', description: 'Fetch the latest news related to a stock' },
  { command: '/forecast', description: 'Get price forecast for a stock' },
  { command: '/history', description: 'Retrieve historical performance data for a stock' },
  { command: '/compare', description: 'Compare financial metrics of two stocks' },
  { command: '/recommendations', description: 'Get buy, hold, or sell recommendations for a stock' },
  { command: '/dividends', description: 'Get dividend information for a stock' },
  { command: '/insights', description: 'Provide insights from recent earnings calls and reports' },
  { command: '/insider', description: 'Show recent insider trading activities' },
  { command: '/financials', description: 'Fetch detailed financial statements for a stock' },
  { command: '/peers', description: 'List peer companies and competitors of a stock' },
  { command: '/sentiment', description: 'Provide sentiment analysis for a stock' },
  { command: '/risk', description: 'Analyze risk factors associated with a stock' },
  { command: '/events', description: 'List upcoming events related to a stock' },
  { command: '/ownership', description: 'Provide information about major ownership of a stock' },
  { command: '/technicals', description: 'Provide technical analysis for a stock' },
];

const CommandPopper = styled(Popper)(({ theme }) => ({
  zIndex: 1300,
  width: 'calc(100% - 32px)',
  maxWidth: '350px',
  marginBottom: '10px',
  '& .MuiPaper-root': {
    backgroundColor: '#373944',
    color: theme.palette.text.primary,
    borderRadius: '0px',
    maxHeight: '200px',
    overflowY: 'auto',
    border: `2px solid ${theme.palette.divider}`,
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.divider,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: theme.palette.text.secondary,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
  },
}));

const CommandItem = styled('div')(({ theme, isSelected }) => ({
  padding: '6px 12px',
  cursor: 'pointer',
  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));


function InputAreaComponent() {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { 
    sendMessage, 
    isInitialized, 
    addLog, 
    isConversationStarted, 
    startConversation, 
    isStreaming, 
    uploadFile,
    removeUploadedFile,
    uploadingFiles,
    uploadedFiles,
    setUploadedFiles
  } = useChatState();
  const inputRef = useRef(null);
  const popperAnchorRef = useRef(null);
  const commandListRef = useRef(null);
  const fileInputRef = useRef(null);

  const debouncedFilterCommands = useCallback(
    debounce((inputValue) => {
      const filtered = commands.filter(cmd => 
        cmd.command.toLowerCase().startsWith(inputValue.toLowerCase())
      );
      setFilteredCommands(filtered);
      setShowCommands(filtered.length > 0);
      setSelectedIndex(0);
    }, 300),
    []
  );

  useEffect(() => {
    if (input.startsWith('/')) {
      debouncedFilterCommands(input);
    } else {
      setShowCommands(false);
    }
  }, [input, debouncedFilterCommands]);

  useEffect(() => {
    if (commandListRef.current) {
      const selectedElement = commandListRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if ((input.trim() || uploadedFiles.length > 0) && !isStreaming && !isLoading) {
      setIsLoading(true);
      try {
        await sendMessage(input);
        setInput('');
      } catch (error) {
        console.error('Error during message sending:', error);
        setErrorMessage(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const newFiles = Array.from(event.target.files);
    for (const file of newFiles) {
      try {
        await uploadFile(file);
      } catch (error) {
        setErrorMessage(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
  };

  const removeFile = useCallback((fileId) => {
    if (!fileId) {
      console.error('Invalid file ID');
      setErrorMessage('Failed to remove file: Invalid file ID');
      return;
    }
    removeUploadedFile(fileId)
      .then(() => {
        setSuccessMessage(`File removed successfully`);
      })
      .catch(error => {
        console.error('Error removing file:', error);
        setErrorMessage(`Failed to remove file: ${error.message}`);
      });
  }, [removeUploadedFile, setErrorMessage, setSuccessMessage]);

  const handleKeyDown = (e) => {
    if (showCommands) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prevIndex) => 
            prevIndex > 0 ? prevIndex - 1 : filteredCommands.length - 1
          );
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prevIndex) => 
            prevIndex < filteredCommands.length - 1 ? prevIndex + 1 : 0
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex].command);
          } else {
            handleSendMessage();
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex].command);
          }
          break;
        default:
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCommandSelect = (command) => {
    setInput(command + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const handleClearInput = () => {
    setInput('');
    setUploadedFiles([]);
    inputRef.current?.focus();
  };

  const memoizedFilePreviewComponent = useMemo(() => (
    <FilePreviewComponent 
      selectedFiles={uploadedFiles} 
      removeFile={removeFile} 
      uploadingFiles={uploadingFiles}
    />
  ), [uploadedFiles, removeFile, uploadingFiles]);

  return (
    <Box>
      {memoizedFilePreviewComponent}
      <ClickAwayListener onClickAway={() => setShowCommands(false)}>
        <InputArea>
          <div ref={popperAnchorRef} style={{ width: '100%', position: 'relative' }}>
            <StyledTextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isInitialized || isStreaming || isLoading}
              multiline
              minRows={1}
              maxRows={4}
              inputRef={inputRef}
              InputProps={{
                endAdornment: (input || uploadedFiles.length > 0) && (
                  <IconButton
                    onClick={handleClearInput}
                    edge="end"
                    aria-label="clear input and files"
                  >
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
            <CommandPopper
              open={showCommands}
              anchorEl={popperAnchorRef.current}
              placement="top-start"
              modifiers={[
                {
                  name: 'offset',
                  options: {
                    offset: [0, 15],
                  },
                },
              ]}
              role="listbox"
              aria-label="Command suggestions"
            >
              <Paper elevation={0} ref={commandListRef}>
                {filteredCommands.map((cmd, index) => (
                  <CommandItem
                    key={index}
                    onClick={() => handleCommandSelect(cmd.command)}
                    isSelected={index === selectedIndex}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <Typography variant="body2" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {cmd.command}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.75rem' }}>
                      {cmd.description}
                    </Typography>
                  </CommandItem>
                ))}
              </Paper>
            </CommandPopper>
          </div>
          <input
            type="file"
            multiple
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
            aria-label="Upload files"
          />
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={!isInitialized || isStreaming || isLoading}
            style={{ marginRight: '8px' }}
            aria-label="Attach files"
          >
            <AttachFileIcon />
          </IconButton>
          <StyledButton
            variant="contained"
            onClick={handleSendMessage}
            disabled={(!input.trim() && uploadedFiles.length === 0) || !isInitialized || isStreaming || isLoading}
            aria-label="Send message or upload files"
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </StyledButton>
        </InputArea>
      </ClickAwayListener>
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={3000} 
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default InputAreaComponent;