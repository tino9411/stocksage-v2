import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { styled } from '@mui/system';

const NavBar = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  width: '60px',
  backgroundColor: '#2e2e2e',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1),
  zIndex: 1200,
}));

const NavButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  margin: theme.spacing(1, 0),
}));

const SideNavigationBar = ({ onWatchlistToggle, onThreadsToggle }) => {
  return (
    <NavBar>
      <Tooltip title="Watchlist" placement="right">
        <NavButton onClick={onWatchlistToggle}>
          <ShowChartIcon />
        </NavButton>
      </Tooltip>
      <Tooltip title="Chat Threads" placement="right">
        <NavButton onClick={onThreadsToggle}>
          <ChatIcon />
        </NavButton>
      </Tooltip>
    </NavBar>
  );
};

export default SideNavigationBar;