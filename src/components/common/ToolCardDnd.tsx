import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Card, CardTitle, CardIconWrapper } from './StyledComponents';
import { Icon } from '../../utils/IconHelper';
import { IconType } from 'react-icons';
import { FaTimes } from 'react-icons/fa';
import DragHandle from './DragHandle';
import HelpButton from './HelpButton';
import ExpandToggle from './ExpandToggle';

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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandDisabled?: boolean;
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

const LeftControls = styled.div`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  z-index: 10;

  @media (max-width: 768px) {
    left: 4px;
  }
`;

const ControlButtons = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  z-index: 10;
`;

const ControlButton = styled.button`
  background: transparent;
  color: #b33939; /* Dark red color for the X icon */
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs}`};
  cursor: pointer;
  opacity: 1;
  transition: ${({ theme }) => theme.transitions.normal};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  &:hover:not(:disabled) {
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
  alignTop = false,
  isExpanded,
  onToggleExpand,
  expandDisabled = false
}) => {
  const handleRemoveClick = () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <StyledToolCard
      className={`tool-card ${className || ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Control buttons for help and remove */}
      {(onRemove || additionalControls || onShowHelp) && (
        <ControlButtons>
          {additionalControls}
          {onShowHelp && (
            <HelpButton
              onClick={onShowHelp}
              className="tool-card-help"
            />
          )}
          {onRemove && (
            <ControlButton
              onClick={handleRemoveClick}
              disabled={!canRemove}
              title="Remove block"
            >
              <Icon icon={FaTimes} size={14} />
            </ControlButton>
          )}
        </ControlButtons>
      )}

      {!hideHeader && (
        <DraggableCardHeader>
          <LeftControls>
            <DragHandle dragHandleProps={dragHandleProps} inline />
            {onToggleExpand && isExpanded !== undefined && (
              <ExpandToggle isExpanded={isExpanded} onToggle={onToggleExpand} disabled={expandDisabled} />
            )}
          </LeftControls>
          <CardIconWrapper>
            <Icon icon={icon} size={20} />
          </CardIconWrapper>
          <CardTitle>
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