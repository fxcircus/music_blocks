import React, { ReactNode, useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardTitle, CardIconWrapper } from './StyledComponents';
import { Icon } from '../../utils/IconHelper';
import { IconType } from 'react-icons';
import { FaTimes, FaChevronUp, FaChevronDown } from 'react-icons/fa';

interface ToolCardProps {
  title: string;
  icon: IconType;
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canRemove?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  hideHeader?: boolean;
  showControlsOnly?: boolean;
  additionalControls?: ReactNode;
}

const StyledToolCard = styled(Card)`
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

const ControlButtons = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  z-index: 10;
`;

const ControlButton = styled.button<{ $danger?: boolean; $disabled?: boolean }>`
  background: ${({ theme, $danger }) => $danger ? theme.colors.error : theme.colors.buttonPrimary};
  color: ${({ theme }) => theme.colors.buttonText};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.xs}`};
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ $disabled }) => $disabled ? 0.5 : 1};
  transition: ${({ theme }) => theme.transitions.normal};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  &:hover:not(:disabled) {
    opacity: ${({ $disabled }) => $disabled ? 0.5 : 0.8};
    transform: ${({ $disabled }) => $disabled ? 'none' : 'scale(1.05)'};
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const RemoveConfirmation = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => theme.colors.card};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  z-index: 20;
  text-align: center;
  min-width: 200px;
`;

const ConfirmationButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  justify-content: center;
`;

const ConfirmButton = styled.button<{ $danger?: boolean }>`
  background: ${({ theme, $danger }) => $danger ? theme.colors.error : theme.colors.buttonSecondary};
  color: ${({ theme }) => theme.colors.buttonText};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.8;
  }
`;

/**
 * Reusable component for tool cards with consistent styling and animations
 */
const ToolCard: React.FC<ToolCardProps> = ({
  title,
  icon,
  children,
  className,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove = true,
  canMoveUp = true,
  canMoveDown = true,
  hideHeader = false,
  showControlsOnly = false,
  additionalControls
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRemoveClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmRemove = () => {
    setShowConfirmation(false);
    if (onRemove) {
      onRemove();
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmation(false);
  };

  return (
    <StyledToolCard
      className={`tool-card ${className || ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Control buttons for move and remove */}
      {(onMoveUp || onMoveDown || onRemove || additionalControls) && (
        <ControlButtons>
          {additionalControls}
          {onMoveUp && (
            <ControlButton
              onClick={onMoveUp}
              disabled={!canMoveUp}
              $disabled={!canMoveUp}
              title="Move up"
            >
              <Icon icon={FaChevronUp} size={14} />
            </ControlButton>
          )}
          {onMoveDown && (
            <ControlButton
              onClick={onMoveDown}
              disabled={!canMoveDown}
              $disabled={!canMoveDown}
              title="Move down"
            >
              <Icon icon={FaChevronDown} size={14} />
            </ControlButton>
          )}
          {onRemove && (
            <ControlButton
              onClick={handleRemoveClick}
              disabled={!canRemove}
              $disabled={!canRemove}
              $danger
              title="Remove block"
            >
              <Icon icon={FaTimes} size={14} />
            </ControlButton>
          )}
        </ControlButtons>
      )}

      {/* Confirmation dialog */}
      {showConfirmation && (
        <RemoveConfirmation>
          <p>Remove this block?</p>
          <ConfirmationButtons>
            <ConfirmButton onClick={handleCancelRemove}>
              Cancel
            </ConfirmButton>
            <ConfirmButton $danger onClick={handleConfirmRemove}>
              Remove
            </ConfirmButton>
          </ConfirmationButtons>
        </RemoveConfirmation>
      )}

      {!hideHeader && (
        <CardHeader>
          <CardIconWrapper>
            <Icon icon={icon} size={20} />
          </CardIconWrapper>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}

      {!showControlsOnly && children}
    </StyledToolCard>
  );
};

export default ToolCard; 