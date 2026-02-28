import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './theme/ThemeProvider';
import { AppWrapper } from './components/common/StyledComponents';
import Nav from './components/Nav/Nav';
import CurrentProject from './pages/CurrentProject/CurrentProject';
import AboutPage from './pages/About/About';
import './App.css';

const getBasename = (): string => {
  const isGitHubPages = window.location.hostname !== 'localhost' &&
                        window.location.hostname !== '127.0.0.1' &&
                        window.location.pathname.startsWith('/music_blocks');

  return isGitHubPages ? '/music_blocks' : '/';
};

export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AppWrapper>
        <BrowserRouter basename={getBasename()}>
          <div className='navigation-menu'>
            <Nav />
          </div>
          <Routes>
            <Route path="/" element={<CurrentProject result="" />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppWrapper>
    </ThemeProvider>
  );
}
