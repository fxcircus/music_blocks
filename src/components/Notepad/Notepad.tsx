import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, TextArea } from '../common/StyledComponents';
import { FaEdit, FaEye, FaCopy, FaCheck, FaQuestionCircle } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';
import TipsModal from '../common/TipsModal';

interface NotesProps {
  notes: string;
  setNotes: (notes: string) => void;
}

// ─── Styled Components ────────────────────────────────────────────

const NotesCard = styled(Card)`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  flex: 1;
  text-align: left;
  align-items: stretch;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ToggleGroup = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow: hidden;
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  background: ${({ $active, theme }) =>
    $active ? `${theme.colors.primary}22` : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
  }

  &:not(:last-child) {
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionBtn = styled.button<{ $success?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: transparent;
  color: ${({ $success, theme }) =>
    $success ? theme.colors.secondary : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}11`};
  }
`;

const StyledTextArea = styled(TextArea)`
  min-height: 200px;
  flex: 1;
  width: 100%;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: ${({ theme }) => theme.spacing.md};
  resize: none;

  @media (max-width: 768px) {
    min-height: 150px;
    padding: ${({ theme }) => theme.spacing.sm};
    font-size: 12px;
  }
`;

const MarkdownPreview = styled.div`
  min-height: 200px;
  flex: 1;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.inputBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow-y: auto;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.7;

  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.colors.primary};
    margin: 0.8em 0 0.4em;
    font-weight: 600;
    line-height: 1.3;

    &:first-child { margin-top: 0; }
  }
  h1 { font-size: 1.5em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.15em; }
  h4, h5, h6 { font-size: 1em; }

  p { margin: 0 0 0.6em; }

  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
  }

  em { color: ${({ theme }) => theme.colors.textSecondary}; }

  ul, ol {
    margin: 0 0 0.6em;
    padding-left: 1.5em;
  }
  li { margin-bottom: 0.25em; }

  /* Task list checkboxes (remark-gfm) */
  li.task-list-item {
    list-style: none;
    margin-left: -1.5em;
    padding-left: 0;
  }
  input[type="checkbox"] {
    margin-right: 6px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }

  code {
    background: ${({ theme }) => `${theme.colors.primary}11`};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 3px;
    padding: 1px 5px;
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.85em;
    color: ${({ theme }) => theme.colors.secondary};
  }

  pre {
    background: ${({ theme }) => theme.colors.background};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    padding: ${({ theme }) => theme.spacing.sm};
    margin: 0.6em 0;
    overflow-x: auto;

    code {
      background: none;
      border: none;
      padding: 0;
      font-size: 0.85em;
      color: ${({ theme }) => theme.colors.text};
    }
  }

  blockquote {
    margin: 0.6em 0;
    padding: 0.4em 0 0.4em 1em;
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textSecondary};

    p { margin: 0; }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.6em 0;
  }
  th, td {
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 6px 10px;
    text-align: left;
    font-size: 0.9em;
  }
  th {
    background: ${({ theme }) => `${theme.colors.primary}11`};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }

  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    margin: 1em 0;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  img { max-width: 100%; border-radius: 4px; }

  /* Strikethrough (remark-gfm) */
  del { color: ${({ theme }) => theme.colors.textSecondary}; opacity: 0.6; }

  @media (max-width: 768px) {
    min-height: 150px;
    padding: ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const Placeholder = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.5;
  font-style: italic;
`;

// ─── Component ────────────────────────────────────────────────────

export default function Notes({ notes, setNotes }: NotesProps) {
  const [text, setText] = useState<{ newText: string }>({ newText: '' });
  const [isPreview, setIsPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Load notes from localStorage on component mount and when notes prop changes
  useEffect(() => {
    if (notes) {
      setText({ newText: notes });
    } else {
      const savedNotes = localStorage.getItem('tilesNotes');
      if (savedNotes) {
        setText({ newText: savedNotes });
        setNotes(savedNotes);
      }
    }
  }, [notes, setNotes]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setText({ ...text, [event.target.name]: newValue });
    setNotes(newValue);
    localStorage.setItem('tilesNotes', newValue);
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text.newText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text.newText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text.newText]);

  return (
    <NotesCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Toolbar>
        <ToggleGroup>
          <ToggleBtn $active={!isPreview} onClick={() => setIsPreview(false)} title="Edit markdown">
            <Icon icon={FaEdit} size={12} /> Edit
          </ToggleBtn>
          <ToggleBtn $active={isPreview} onClick={() => setIsPreview(true)} title="Preview rendered markdown">
            <Icon icon={FaEye} size={12} /> Preview
          </ToggleBtn>
        </ToggleGroup>
        <ToolbarActions>
          <ActionBtn
            $success={copied}
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            <Icon icon={copied ? FaCheck : FaCopy} size={14} />
          </ActionBtn>
          <ActionBtn onClick={() => setShowTips(true)} title="Markdown help">
            <Icon icon={FaQuestionCircle} size={14} />
          </ActionBtn>
        </ToolbarActions>
      </Toolbar>

      {isPreview ? (
        <MarkdownPreview>
          {text.newText ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text.newText}</ReactMarkdown>
          ) : (
            <Placeholder>Nothing to preview yet. Switch to Edit and start writing.</Placeholder>
          )}
        </MarkdownPreview>
      ) : (
        <StyledTextArea
          name="newText"
          onChange={handleChange}
          value={text.newText}
          placeholder="Write using markdown — use **bold**, *italic*, ## headers, - lists, and more..."
        />
      )}

      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="Notes - Markdown Guide"
        content={
          <>
            <h3>Edit &amp; Preview</h3>
            <p>
              Switch between <strong>Edit</strong> mode (write markdown) and <strong>Preview</strong> mode
              (see it rendered). Your notes save automatically. Use the <strong>copy button</strong> to
              copy the raw text to your clipboard.
            </p>

            <h3>Quick Reference</h3>
            <p>
              <code># Heading 1</code> &nbsp; <code>## Heading 2</code> &nbsp; <code>### Heading 3</code>
            </p>
            <p>
              <code>**bold**</code> &nbsp; <code>*italic*</code> &nbsp; <code>~~strikethrough~~</code>
            </p>
            <p>
              <code>- bullet list</code> &nbsp; <code>1. numbered list</code>
            </p>
            <p>
              <code>- [ ] task</code> &nbsp; <code>- [x] done</code> — interactive checklists
            </p>
            <p>
              <code>&gt; blockquote</code> — for callouts or lyric quotes
            </p>
            <p>
              <code>`inline code`</code> — useful for chord names like <code>Cmaj7</code>
            </p>
            <p>
              <code>---</code> — horizontal rule to separate sections
            </p>

            <h3>Ideas for Musicians</h3>
            <ul>
              <li><strong>Song structure</strong> — use headings for sections: <code>## Verse 1</code>, <code>## Chorus</code>, <code>## Bridge</code></li>
              <li><strong>Chord progressions</strong> — bold the chords: <code>**Am** - **F** - **C** - **G**</code></li>
              <li><strong>Lyrics</strong> — write freely, use <code>&gt;</code> blockquotes for reference lyrics</li>
              <li><strong>Practice checklist</strong> — track your session goals with task lists</li>
              <li><strong>Arrangement notes</strong> — use tables for section breakdowns</li>
            </ul>

            <h3>Tables</h3>
            <p>Great for comparing arrangements or mapping out song sections:</p>
            <p>
              <code>| Section | Bars | Energy |</code><br/>
              <code>|---------|------|--------|</code><br/>
              <code>| Intro   | 4    | Low    |</code><br/>
              <code>| Verse   | 8    | Medium |</code>
            </p>

            <h3>Code Blocks</h3>
            <p>Wrap text in triple backticks for chord charts or tab notation:</p>
            <p>
              <code>```</code><br/>
              <code>Am      F        C       G</code><br/>
              <code>Here's the verse progression</code><br/>
              <code>```</code>
            </p>
          </>
        }
      />
    </NotesCard>
  );
}
