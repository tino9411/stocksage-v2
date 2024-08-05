import React, { memo } from 'react';
import { Box, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const FilePreviewContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: '#373944',
  borderRadius: '4px 4px 0 0',
}));

const FilePreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#373944',
  borderRadius: '4px',
  padding: theme.spacing(1),
  width: '150px',
  height: '80px',
}));

const FileIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '40px',
}));

const FileNameWrapper = styled(Box)({
  width: '100%',
  textAlign: 'center',
  overflow: 'wrap',
});

const RemoveFileButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  padding: 2,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const LoadingOverlay = styled(Box)({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '4px',
  });

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