import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
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
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  padding: theme.spacing(0.5, 1),
}));

const FileIcon = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
}));

const RemoveFileButton = styled(IconButton)(({ theme }) => ({
  padding: 2,
  marginLeft: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const getFileIcon = (file) => {
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

const FilePreviewComponent = ({ selectedFiles, removeFile }) => {
  if (selectedFiles.length === 0) return null;

  return (
    <FilePreviewContainer>
      {selectedFiles.map((file, index) => (
        <FilePreview key={index}>
          <FileIcon>{getFileIcon(file)}</FileIcon>
          <Typography variant="caption">{file.name}</Typography>
          <RemoveFileButton onClick={() => removeFile(index)} size="small">
            <CloseIcon fontSize="small" />
          </RemoveFileButton>
        </FilePreview>
      ))}
    </FilePreviewContainer>
  );
};

export default FilePreviewComponent;