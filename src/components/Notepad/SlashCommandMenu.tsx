import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import styled, { useTheme, ThemeProvider } from 'styled-components';
import { SlashCommandItem } from './SlashCommands';

// ─── Styled Components ────────────────────────────────────────────

const MenuPanel = styled.div`
  position: fixed;
  z-index: 99999;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  padding: 4px;
  min-width: 220px;
  max-height: 300px;
  overflow-y: auto;
  font-family: ${({ theme }) => theme.fontFamily};
`;

const MenuItem = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ $isActive, theme }) =>
    $isActive ? `${theme.colors.primary}22` : 'transparent'};
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 0.1s;

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}15`};
  }
`;

const MenuItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => `${theme.colors.primary}11`};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

const MenuItemText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const MenuItemTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const MenuItemDesc = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.7;
`;

const MenuItemShortcut = styled.span`
  font-size: 10px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => `${theme.colors.border}66`};
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0.7;
`;

const EmptyMessage = styled.div`
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

// ─── Component ────────────────────────────────────────────────────

export interface SlashCommandMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  clientRect: (() => DOMRect | null) | null;
  onClose?: () => void;
}

const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ items, command, clientRect, onClose }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const theme = useTheme();
    const menuRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLButtonElement>(null);

    // Close on outside click
    useEffect(() => {
      if (!onClose) return;
      const handler = (e: MouseEvent | TouchEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler);
      return () => {
        document.removeEventListener('mousedown', handler);
        document.removeEventListener('touchstart', handler);
      };
    }, [onClose]);

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    // Scroll selected item into view
    useEffect(() => {
      selectedRef.current?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command(item);
        }
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        if (event.key === 'Escape') {
          return true;
        }
        return false;
      },
    }));

    if (!clientRect) return null;
    const rect = clientRect();
    if (!rect) return null;

    // Position below the cursor, clamp to viewport
    const top = rect.bottom + 4;
    const left = Math.min(rect.left, window.innerWidth - 240);

    return createPortal(
      <ThemeProvider theme={theme}>
        <MenuPanel ref={menuRef} style={{ top, left }}>
          {items.length === 0 ? (
            <EmptyMessage>No matching commands</EmptyMessage>
          ) : (
            items.map((item, index) => (
              <MenuItem
                key={item.title}
                ref={index === selectedIndex ? selectedRef : undefined}
                $isActive={index === selectedIndex}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <MenuItemIcon>{item.icon}</MenuItemIcon>
                <MenuItemText>
                  <MenuItemTitle>{item.title}</MenuItemTitle>
                  <MenuItemDesc>{item.description}</MenuItemDesc>
                </MenuItemText>
                {item.shortcut && <MenuItemShortcut>{item.shortcut}</MenuItemShortcut>}
              </MenuItem>
            ))
          )}
        </MenuPanel>
      </ThemeProvider>,
      document.body
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';
export default SlashCommandMenu;
