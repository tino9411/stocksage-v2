// stocksage-v2/client/src/features/chat/components/FilePreviewComponent.js

import React, { memo } from 'react';
import { Box, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  FilePreviewContainer,
  FilePreview,
  FileIconWrapper,
  FileNameWrapper,
  RemoveFileButton,
  LoadingOverlay
} from '../styles/chatStyles';

const getFileIcon = (file) => {
  if (!file.type) {
    return <InsertDriveFileIcon />;
  }
  const fileType = file.type.split('/')[0];
  switch (fileType) {
    case 'image':
      return <ImageIcon />;
    case 'application':
      return file.type === 'application/pdf' ? <PictureAsPdfIcon /> : <InsertDriveFileIcon />;
    default:
      return <InsertDriveFileIcon />;
  }
};

const FilePreviewComponent = memo(({ selectedFiles, removeFile, uploadingFiles }) => {
  if (selectedFiles.length === 0) return null;

  return (
    <FilePreviewContainer role="region" aria-label="Selected files">
      {selectedFiles.map((file) => (
        <FilePreview key={file.id}>
          <FileIconWrapper>{getFileIcon(file)}</FileIconWrapper>
          <FileNameWrapper>
            <Tooltip title={`${file.name} (${(file.size / 1024).toFixed(2)} KB)`}>
              <Typography variant="caption" noWrap>
                {file.name}
              </Typography>
            </Tooltip>
          </FileNameWrapper>
          <RemoveFileButton 
            onClick={() => removeFile(file.id)} 
            size="small"
            aria-label={`Remove ${file.name}`}
          >
            <CloseIcon fontSize="small" />
          </RemoveFileButton>
          {uploadingFiles[file.name] && (
            <LoadingOverlay>
              <CircularProgress size={24} />
            </LoadingOverlay>
          )}
        </FilePreview>
      ))}
    </FilePreviewContainer>
  );
});

export default FilePreviewComponent;