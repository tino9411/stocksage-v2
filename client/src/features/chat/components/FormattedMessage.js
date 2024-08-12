import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Table, TableBody, TableCell, TableHead, TableRow, Box, Link, Button } from '@mui/material';
import { styled, keyframes } from '@mui/system';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyButton from './ui/CopyButton';

const StyledTable = styled(Table)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& th, & td': {
    borderColor: '#4d4d4d',
    padding: theme.spacing(1),
    fontSize: '0.875rem',
  },
}));

const CodeHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[800],
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
}));

const CodeBlock = styled(Box)(({ theme }) => ({
  margin: 0,
  padding: 0,
  overflow: 'auto',
  borderRadius: '4px',
  '& pre': {
    margin: 0,
    padding: '16px',
    overflowX: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
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

const FileLink = ({ href, children }) => {
  const fileId = href.split('/').pop();
  const apiUrl = `/api/files/${fileId}`;

  return (
    <Button
      component="a"
      href={apiUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant="outlined"
      size="small"
      sx={{ margin: '0 4px' }}
    >
      {children}
    </Button>
  );
};

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
`;

const BlinkingCursor = styled('span')({
  animation: `${blink} 1s step-end infinite`,
  display: 'inline-block',
  marginLeft: '1px',
});

const FormattedMessage = ({ content, isStreaming }) => {
  console.log(`FormattedMessage rendering, content length: ${content.length}, isStreaming: ${isStreaming}`);

  const components = useMemo(() => ({
    h1: (props) => <Typography variant="h5" {...props} style={{ marginBottom: '0.5em', fontWeight: 'bold' }} />,
    h2: (props) => <Typography variant="h6" {...props} style={{ marginBottom: '0.5em', fontWeight: 'bold' }} />,
    h3: (props) => <Typography variant="subtitle1" {...props} style={{ marginBottom: '0.5em', fontWeight: 'bold' }} />,
    p: (props) => <Typography variant="body1" {...props} style={{ marginBottom: '0.5em' }} />,
    ul: (props) => <Typography component="ul" variant="body1" {...props} style={{ marginLeft: '1em', marginBottom: '0.5em' }} />,
    ol: (props) => <Typography component="ol" variant="body1" {...props} style={{ marginLeft: '1em', marginBottom: '0.5em' }} />,
    li: (props) => <Typography component="li" variant="body1" {...props} style={{ marginBottom: '0.25em', paddingLeft: '0.5em' }} />,
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      return !inline && match ? (
        <CodeBlock>
          <CodeHeader>
            <Typography variant="caption">{language}</Typography>
            <CopyButton text={String(children).replace(/\n$/, '')} />
          </CodeHeader>
          <SyntaxHighlighter
            style={materialDark}
            language={language}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </CodeBlock>
      ) : (
        <Box component="code" sx={{
          backgroundColor: '#424557',
          padding: '2px 4px',
          borderRadius: '10px',
          fontSize: '0.875em',
        }} {...props}>
          {children}
        </Box>
      );
    },
    pre: (props) => (
      <Box component="pre" sx={{
        backgroundColor: '#3d3d3d',
        padding: '8px',
        borderRadius: '4px',
        overflowX: 'auto',
        fontSize: '0.875em',
      }} {...props} />
    ),
    table: (props) => <StyledTable {...props} />,
    thead: TableHead,
    tbody: TableBody,
    tr: TableRow,
    td: TableCell,
    th: (props) => <TableCell {...props} style={{ fontWeight: 'bold' }} />,
    img: ({ node, ...props }) => (
      <Box component="span" sx={{ display: 'block', maxWidth: '100%', margin: '1em 0' }}>
        <img style={{ maxWidth: '100%', height: 'auto' }} {...props} alt={props.alt || 'Generated image'} />
      </Box>
    ),
    a: ({ node, ...props }) => {
      const href = props.href;
      if (href.startsWith('sandbox:/')) {
        return <FileLink href={href} {...props} />;
      }
      return <Link {...props} target="_blank" rel="noopener noreferrer" />;
    },
  }), []);

  return (
    <Box>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <Typography component="span" variant="body1">
          <BlinkingCursor>▋</BlinkingCursor>
        </Typography>
      )}
    </Box>
  );
};

export default FormattedMessage;