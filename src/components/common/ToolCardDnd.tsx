import React, { ReactNode, useState } from 'react';
import styled from 'styled-components';
import { Card, CardTitle, CardIconWrapper } from './StyledComponents';
import { Icon } from '../../utils/IconHelper';
import { IconType } from 'react-icons';
import { FaTimes } from 'react-icons/fa';
import DragHandle from './DragHandle';
import HelpButton from './HelpButton';

interface ToolCardDndProps {
  title: string;
  icon: IconType;
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
  canRemove?: boolean;
  hideHeader?: boolean;
  showControlsOnly?: boolean;
  additionalControls?: ReactNode;
  titleExtra?: ReactNode;
  dragHandleProps?: any;
  isRecentlyDragged?: boolean;
  onShowHelp?: () => void;
  alignTop?: boolean;
}

const StyledToolCard = styled(Card)`
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  position: relative;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

const ContentWrapper = styled.div<{ $alignTop?: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: ${({ $alignTop }) => $alignTop ? 'flex-start' : 'center'};
  text-align: center;
  width: 100%;
`;


const DraggableCardHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  user-select: none;
  min-height: 32px;
  width: 100%;
`;

const ControlButtons = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  z-index: 10;
`;

const ControlButton = styled.button<{ $visible?: boolean }>`
  background: transparent;
  color: #b33939; /* Dark red color for the X icon */
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs}`};
  cursor: pointer;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: ${({ theme }) => theme.transitions.normal};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};

  /* Always visible on mobile/tablet (no hover available) */
  @media (max-width: 768px) {
    opacity: 1;
    pointer-events: auto;
  }

  /* Show on card hover or when active */
  .tool-card:hover & {
    opacity: 1;
    pointer-events: auto;
  }

  &:hover:not(:disabled) {
    opacity: 1;
    transform: scale(1.05);
    border-color: #b33939;
    background: rgba(179, 57, 57, 0.1);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

/**
 * Reusable component for tool cards with drag-and-drop support
 */
const ToolCardDnd: React.FC<ToolCardDndProps> = ({
  title,
  icon,
  children,
  className,
  onRemove,
  canRemove = true,
  hideHeader = false,
  showControlsOnly = false,
  additionalControls,
  titleExtra,
  dragHandleProps,
  isRecentlyDragged = false,
  onShowHelp,
  alignTop = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Show remove button if recently dragged
  const showRemoveButton = isHovered || isActive || isRecentlyDragged;

  const handleRemoveClick = () => {
    if (onRemove) {
      onRemove();
    }
  };

  const handleHeaderClick = () => {
    setIsActive(!isActive);
  };

  return (
    <StyledToolCard
      className={`tool-card ${className || ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Control buttons for help and remove */}
      {(onRemove || additionalControls || onShowHelp) && (
        <ControlButtons>
          {onShowHelp && (
            <HelpButton
              onClick={onShowHelp}
              className="tool-card-help"
            />
          )}
          {additionalControls}
          {onRemove && (
            <ControlButton
              onClick={handleRemoveClick}
              disabled={!canRemove}
              $visible={showRemoveButton}
              title="Remove block"
            >
              <Icon icon={FaTimes} size={14} />
            </ControlButton>
          )}
        </ControlButtons>
      )}

      {!hideHeader && (
        <DraggableCardHeader>
          <DragHandle dragHandleProps={dragHandleProps} />
          <CardIconWrapper>
            <Icon icon={icon} size={20} />
          </CardIconWrapper>
          <CardTitle onClick={handleHeaderClick}>
            {title}
          </CardTitle>
          {titleExtra}
        </DraggableCardHeader>
      )}

      {!showControlsOnly && <ContentWrapper $alignTop={alignTop}>{children}</ContentWrapper>}
    </StyledToolCard>
  );
};

export default ToolCardDnd;