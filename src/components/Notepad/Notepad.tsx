import React, { useEffect, useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card, TextArea, CardHeader, CardTitle, CardIconWrapper } from '../common/StyledComponents';
import { FaStickyNote } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';

interface NotesProps {
  notes: string;
  setNotes: (notes: string) => void;
}

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

const StyledTextArea = styled(TextArea)`
  min-height: 200px;
  flex: 1;
  width: 100%;
  font-family: 'Inter', 'Roboto', sans-serif;
  padding: ${({ theme }) => theme.spacing.md};
  resize: none; /* Disable resizing to remove drag handle */

  @media (max-width: 768px) {
    min-height: 150px;
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

export default function Notes({ notes, setNotes }: NotesProps) {
  const [text, setText] = useState<{ newText: string }>({ newText: '' });

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
    
    // Save to localStorage
    localStorage.setItem('tilesNotes', newValue);
  };

  return (
    <NotesCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <CardHeader>
        <CardIconWrapper>
          <Icon icon={FaStickyNote} size={20} />
        </CardIconWrapper>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      
      <StyledTextArea
        name="newText"
        onChange={handleChange}
        value={text.newText}
        placeholder="Write down musical ideas, lyrics, or thoughts..."
      />
    </NotesCard>
  );
}
