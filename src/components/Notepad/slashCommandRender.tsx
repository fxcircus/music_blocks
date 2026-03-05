import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import SlashCommandMenu, { SlashCommandMenuRef } from './SlashCommandMenu';
import { SlashCommandItem } from './SlashCommands';

/**
 * Creates a Tiptap suggestion render function that mounts the
 * SlashCommandMenu React component imperatively.
 */
export function createSlashCommandRender(theme: any) {
  return () => {
    let container: HTMLDivElement | null = null;
    let root: Root | null = null;
    let menuRef: SlashCommandMenuRef | null = null;

    return {
      onStart: (props: {
        items: SlashCommandItem[];
        command: (item: SlashCommandItem) => void;
        clientRect: (() => DOMRect | null) | null;
      }) => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        root.render(
          <ThemeProvider theme={theme}>
            <SlashCommandMenu
              ref={(ref) => { menuRef = ref; }}
              items={props.items}
              command={props.command}
              clientRect={props.clientRect}
            />
          </ThemeProvider>
        );
      },

      onUpdate: (props: {
        items: SlashCommandItem[];
        command: (item: SlashCommandItem) => void;
        clientRect: (() => DOMRect | null) | null;
      }) => {
        if (!root) return;

        root.render(
          <ThemeProvider theme={theme}>
            <SlashCommandMenu
              ref={(ref) => { menuRef = ref; }}
              items={props.items}
              command={props.command}
              clientRect={props.clientRect}
            />
          </ThemeProvider>
        );
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === 'Escape') {
          // Let the suggestion plugin handle cleanup
          return true;
        }
        return menuRef?.onKeyDown(props.event) ?? false;
      },

      onExit: () => {
        if (root) {
          root.unmount();
          root = null;
        }
        if (container) {
          container.remove();
          container = null;
        }
        menuRef = null;
      },
    };
  };
}
