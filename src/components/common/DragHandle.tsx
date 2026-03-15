import React from 'react';
import styled from 'styled-components';
import { MdDragIndicator } from 'react-icons/md';
import { Icon } from '../../utils/IconHelper';

const DragHandleWrapper = styled.div<{ $isDraggable?: boolean }>`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ${({ $isDraggable }) => $isDraggable ? 'grab' : 'default'};
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.4;
  transition: opacity ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  z-index: 10;

  &:hover {
    opacity: 0.8;
    color: ${({ theme }) => theme.colors.primary};
  }

  &:active {
    cursor: grabbing;
    opacity: 1;
  }

  @media (max-width: 768px) {
    left: 4px;
  }
`;

interface DragHandleProps {
  dragHandleProps?: any;
}

const DragHandle: React.FC<DragHandleProps> = ({ dragHandleProps }) => {
  if (!dragHandleProps) return null;

  return (
    <DragHandleWrapper {...dragHandleProps} $isDraggable={true}>
      <Icon icon={MdDragIndicator} size={20} />
    </DragHandleWrapper>
  );
};

export default DragHandle;