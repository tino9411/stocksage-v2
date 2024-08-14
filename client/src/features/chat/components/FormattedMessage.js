import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, TableBody, TableCell, TableHead, TableRow, Box, Link, Button } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyButton from './ui/CopyButton';
import {
  StyledTable,
  CodeHeader,
  CodeBlock,
  BlinkingCursor
} from '../styles/chatStyles';

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

const FormattedMessage = ({ content, isStreaming, isSidebar }) => {
  console.log(`FormattedMessage rendering, content length: ${content.length}, isStreaming: ${isStreaming}, isSidebar: ${isSidebar}`);

  const components = useMemo(() => ({
    h1: (props) => <Typography variant="h5" {...props} style={{ marginBottom: '0.5em', fontWeight: 'bold', fontSize: isSidebar ? '0.875rem' : '0.9rem' }} />,
    h2: (props) => <Typography variant="h6" {...props} style={{ marginBottom: '0.5em', fontWeight: 'bold', fontSize: isSidebar ? '0.875rem' : '0.9rem' }} />,
    h3: (props) => <Typography variant="subtitle1" {...props} style={{ marginBottom: '0.5em', fontWeight: 'bold', fontSize: isSidebar ? '0.75rem' : '0.9rem' }} />,
    p: (props) => <Typography variant="body1" {...props} style={{ marginBottom: '0.5em', fontSize: isSidebar ? '0.75rem' : '0.9rem' }} />,
    ul: (props) => <Typography component="ul" variant="body1" {...props} style={{ marginLeft: '1em', marginBottom: '0.5em', fontSize: isSidebar ? '0.75rem' : '0.8rem' }} />,
    ol: (props) => <Typography component="ol" variant="body1" {...props} style={{ marginLeft: '1em', marginBottom: '0.5em', fontSize: isSidebar ? '0.75rem' : '0.8rem' }} />,
    li: (props) => <Typography component="li" variant="body1" {...props} style={{ marginBottom: '0.25em', paddingLeft: '0.5em', fontSize: isSidebar ? '0.75rem' : '0.9rem' }} />,
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
          fontSize: isSidebar ? '0.75em' : '0.875em',
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
        fontSize: isSidebar ? '0.75em' : '0.875em',
      }} {...props} />
    ),
    table: (props) => <StyledTable {...props} />,
    thead: TableHead,
    tbody: TableBody,
    tr: TableRow,
    td: TableCell,
    th: (props) => <TableCell {...props} style={{ fontWeight: 'bold', fontSize: isSidebar ? '0.75rem' : '1rem' }} />,
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
  }), [isSidebar]);

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