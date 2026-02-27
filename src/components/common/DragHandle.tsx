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
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  z-index: 10;

  /* Show on card hover */
  .tool-card:hover &,
  .inspiration-card:hover &,
  .varispeed-card:hover & {
    opacity: 0.4;
  }

  &:hover {
    opacity: 0.8 !important;
    color: ${({ theme }) => theme.colors.primary};
  }

  &:active {
    cursor: grabbing;
    opacity: 1 !important;
  }

  /* Always show on mobile since hover isn't available */
  @media (max-width: 768px) {
    left: 4px;
    opacity: 0.3;
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