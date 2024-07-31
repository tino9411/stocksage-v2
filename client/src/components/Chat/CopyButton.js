import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const CopyButton = ({ text }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Tooltip title="Copy to clipboard">
      <IconButton onClick={handleCopy} size="small">
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default CopyButton;