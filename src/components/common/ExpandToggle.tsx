import React from 'react';
import styled from 'styled-components';
import { FaExpandAlt, FaCompressAlt } from 'react-icons/fa';
import { Icon } from '../../utils/IconHelper';

interface ExpandToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const ToggleButton = styled.button<{ $expanded: boolean; $disabled: boolean }>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: ${({ $disabled }) => $disabled ? 0.2 : 0.4};
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    opacity: 1;
    border-color: ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => `${theme.colors.primary}11`};
    color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const ExpandToggle: React.FC<ExpandToggleProps> = ({ isExpanded, onToggle, disabled = false }) => {
  return (
    <ToggleButton
      $expanded={isExpanded}
      $disabled={disabled}
      disabled={disabled}
      onClick={onToggle}
      title={disabled ? 'Block fills remaining space' : isExpanded ? 'Collapse block' : 'Expand block'}
    >
      <span style={{ display: 'inline-flex', transform: 'rotate(90deg)' }}>
        <Icon icon={isExpanded ? FaCompressAlt : FaExpandAlt} size={12} />
      </span>
    </ToggleButton>
  );
};

export default ExpandToggle;
