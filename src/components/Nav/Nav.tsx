import React, { FC, useState, useRef, useEffect, useCallback } from "react";
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme, THEME_ORDER, THEME_LABELS } from '../../theme/ThemeProvider';
import { FaCheck, FaTimes, FaLink, FaCoffee } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';
import ThemeIcon from './ThemeIcons';
import { loadBlockState } from '../../utils/blockStorage';
import { copyAppStateURLToClipboard } from '../../utils/urlSharing';
import Toast from '../common/Toast';

interface Project {
  id: string;
  date: string;
  app?: string;
  appVersion?: string;
  appURL?: string;
  notes: string;
  rootEl: string;
  scaleEl: string;
  tonesEl: string;
  tonesArrEl: string[];
  bpmEl: string;
  soundEl: string;
}

// Styled components
const NavContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.card};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ theme }) => theme.spacing.md};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  backdrop-filter: blur(10px);
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const NavInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`;

const NavBrand = styled(motion.div)`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  background: ${({ theme }) => theme.colors.accentGradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const NavItems = styled.ul`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled(motion.li)`
  position: relative;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-weight: 600;
  transition: all ${({ theme }) => theme.transitions.fast};
  color: ${({ theme }) => theme.colors.text};

  &.active {
    color: ${({ theme }) => theme.colors.primary};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: ${({ theme }) => theme.colors.accentGradient};
    transition: width ${({ theme }) => theme.transitions.normal};
  }

  &.active::after {
    width: 100%;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    
    &::after {
      width: 100%;
    }
  }
`;

const ImportExportGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.accentGradient};
  color: ${({ theme }) => theme.colors.buttonText};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }

  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 576px) {
    padding: ${({ theme }) => theme.spacing.xs};
    
    span:not(:first-child) {
      display: none;
    }
  }
`;

const SupportButton = styled(motion.a)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: linear-gradient(135deg, #FFDD00 0%, #FBB034 100%);
  color: #1a1a1a;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.small};
  transition: all ${({ theme }) => theme.transitions.fast};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.md};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 221, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

`;

const ThemePickerWrapper = styled.div`
  position: relative;
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const ThemeToggleButton = styled(motion.button)`
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xs};
  transition: all ${({ theme }) => theme.transitions.fast};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  font-size: ${({ theme }) => theme.fontSizes.lg};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => `${theme.colors.primary}11`};
  }
`;

const ThemeDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing.xs});
  right: 0;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  min-width: 160px;
  overflow: hidden;
  z-index: 10000;
`;

const ThemeOption = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ $active, theme }) => $active ? `${theme.colors.primary}18` : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $active }) => $active ? 700 : 500};
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: left;

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ThemeOptionLabel = styled.span`
  flex: 1;
`;

const ThemeCheckMark = styled.span`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

// Modal styled components
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled(motion.div)`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  width: 90%;
  max-width: 500px;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.error};
    transform: rotate(90deg);
  }
`;

const DropArea = styled.div<{ isDragActive: boolean }>`
  padding: ${({ theme }) => theme.spacing.xl};
  border: 2px dashed ${({ isDragActive, theme }) => 
    isDragActive ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  transition: all ${({ theme }) => theme.transitions.normal};
  background-color: ${({ isDragActive, theme }) => 
    isDragActive ? `${theme.colors.primary}11` : 'transparent'};
`;

const FileButton = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.primary};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 50, transition: { duration: 0.2 } }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Nav: FC = () => {
  const navigate = useNavigate();
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { themeName, setThemeName } = useTheme();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themePickerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (themePickerRef.current && !themePickerRef.current.contains(e.target as Node)) {
      setShowThemeDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showThemeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThemeDropdown, handleClickOutside]);

  const handleCloseModal = () => {
    setShowImportModal(false);
    setDragActive(false);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const jsonData = JSON.parse(result) as Project;
          
          // Verify it's a valid project file
          if (!jsonData.rootEl || !jsonData.scaleEl) {
            throw new Error("This doesn't appear to be a valid Blocks project file.");
          }
          
          // Save all project data to localStorage
          localStorage.setItem('tilesNotes', jsonData.notes || '');
          localStorage.setItem('tilesRootEl', jsonData.rootEl || 'C');
          localStorage.setItem('tilesScaleEl', jsonData.scaleEl || 'Major');
          localStorage.setItem('tilesTonesEl', jsonData.tonesEl || 'T - T - S - T - T - T - S');
          localStorage.setItem('tilesTonesArrEl', JSON.stringify(jsonData.tonesArrEl || ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']));
          localStorage.setItem('tilesBpmEl', jsonData.bpmEl || '100');
          localStorage.setItem('tilesSoundEl', jsonData.soundEl || 'Guitar');
          
          // Close the modal
          setShowImportModal(false);
          
          // Provide feedback
          alert(`Project imported successfully!\nRoot: ${jsonData.rootEl} ${jsonData.scaleEl}\nBPM: ${jsonData.bpmEl}`);
          
          // Force page reload to ensure everything is updated
          window.location.reload();
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert(`Error importing project: ${error instanceof Error ? error.message : "Invalid file format"}. Please try again.`);
      }
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
    };
    reader.readAsText(file);
  };

  const handleShareLink = async () => {
    const currentState = loadBlockState();
    const success = await copyAppStateURLToClipboard(currentState);
    
    if (success) {
      setToastMessage('Link copied! Bookmark to reopen later or share with a friend.');
      setShowToast(true);
    } else {
      setToastMessage('❌ Failed to copy link. Please try again.');
      setShowToast(true);
    }
  };

  const handleCloseToast = () => {
    setShowToast(false);
  };

  return (
    <NavContainer>
      <NavInner>
        <NavBrand
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.span 
            initial={{ rotate: -10 }}
            animate={{ rotate: [0, -10, 0] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            🎵
          </motion.span>
          Blocks
        </NavBrand>
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <NavItems>
            <NavItem 
              className={window.location.pathname === '/' || window.location.pathname === '/music-tools-studio/' ? 'active' : ''}
              whileHover={{ scale: 1.05 }} 
              onClick={() => navigate('/')}
            >
              Project
            </NavItem>
            <NavItem 
              className={window.location.pathname.includes('/about') ? 'active' : ''}
              whileHover={{ scale: 1.05 }} 
              onClick={() => navigate('/about')}
            >
              About
            </NavItem>
          </NavItems>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
        >
          <ImportExportGroup>
            <ActionButton 
              onClick={handleShareLink}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Copy Share Link"
            >
              <IconWrapper>
                <Icon icon={FaLink} size={16} />
              </IconWrapper>
            </ActionButton>
            
            <SupportButton
              href="https://buymeacoffee.com/fxcircus"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Support this project (on Buy Me Coffee)"
            >
              <IconWrapper>
                <Icon icon={FaCoffee} size={16} />
              </IconWrapper>
            </SupportButton>

            {/* Legacy JSON export option. Can be re-enabled if needed.
            <ActionButton 
              onClick={exportProject}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Export Project"
            >
              <IconWrapper>
                <Icon icon={FaFileExport} size={16} />
              </IconWrapper>
              Export
            </ActionButton>
            */}
            
            {/* Legacy JSON import option. Can be re-enabled if needed.
            <ActionButton 
              onClick={handleImportClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Import Project"
            >
              <IconWrapper>
                <Icon icon={FaFileImport} size={16} />
              </IconWrapper>
              Import
            </ActionButton>
            */}
          </ImportExportGroup>
          
          <ThemePickerWrapper ref={themePickerRef}>
            <ThemeToggleButton
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Choose theme"
              title="Choose theme"
            >
              <ThemeIcon theme={themeName} size={22} />
            </ThemeToggleButton>

            <AnimatePresence>
              {showThemeDropdown && (
                <ThemeDropdown
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {THEME_ORDER.map((t) => (
                    <ThemeOption
                      key={t}
                      $active={t === themeName}
                      onClick={() => {
                        setThemeName(t);
                        setShowThemeDropdown(false);
                      }}
                    >
                      <ThemeIcon theme={t} size={16} />
                      <ThemeOptionLabel>{THEME_LABELS[t]}</ThemeOptionLabel>
                      {t === themeName && (
                        <ThemeCheckMark>
                          <Icon icon={FaCheck} size={10} />
                        </ThemeCheckMark>
                      )}
                    </ThemeOption>
                  ))}
                </ThemeDropdown>
              )}
            </AnimatePresence>
          </ThemePickerWrapper>
        </motion.div>
      </NavInner>

      <AnimatePresence>
        {showImportModal && (
          <ModalOverlay 
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={handleCloseModal}
          >
            <ModalContent
              onClick={(e) => e.stopPropagation()}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
            >
              <ModalHeader>
                <ModalTitle>Import Project</ModalTitle>
                <CloseButton onClick={handleCloseModal}>
                  <IconWrapper>
                    <Icon icon={FaTimes} size={20} />
                  </IconWrapper>
                </CloseButton>
              </ModalHeader>
              
              <DropArea 
                isDragActive={dragActive}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <p>Drag & drop your project file here</p>
                
                <FileButton 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={handleButtonClick}
                >
                  Choose File
                </FileButton>
                
                <input
                  ref={inputRef}
                  type="file"
                  accept=".json"
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
              </DropArea>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      
      <Toast 
        message={toastMessage}
        isVisible={showToast}
        onClose={handleCloseToast}
        type="success"
        duration={3000}
      />
    </NavContainer>
  );
}

export default Nav;
