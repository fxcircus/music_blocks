/**
 * BlockPicker Component
 *
 * Modal that displays available blocks that can be added to the workspace.
 * Only shows blocks that are not currently active.
 */

import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllBlockTypes, BlockType } from '../../blocks';
import { Icon } from '../../utils/IconHelper';
import { FaTimes } from 'react-icons/fa';

interface BlockPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (blockTypeId: string) => void;
  activeBlockTypes: string[]; // IDs of blocks already in use
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Modal = styled(motion.div)`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.large};
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xl};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ModalContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
  flex: 1;
`;

const BlockGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const BlockCard = styled(motion.button)`
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-align: center;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }

  &:active {
    transform: translateY(0);
  }
`;

const BlockIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 32px;
`;

const BlockName = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 500;
`;

const BlockDescription = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const BlockPicker: React.FC<BlockPickerProps> = ({
  isOpen,
  onClose,
  onSelectBlock,
  activeBlockTypes
}) => {
  // Get all available blocks
  const allBlockTypes = getAllBlockTypes();

  // Filter out blocks that are already active
  const availableBlocks = allBlockTypes.filter(
    blockType => !activeBlockTypes.includes(blockType.id)
  );

  const handleSelectBlock = (blockType: BlockType) => {
    onSelectBlock(blockType.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Modal
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>Add Block</ModalTitle>
              <CloseButton onClick={onClose}>
                <Icon icon={FaTimes} size={20} />
              </CloseButton>
            </ModalHeader>

            <ModalContent>
              {availableBlocks.length > 0 ? (
                <BlockGrid>
                  {availableBlocks.map((blockType) => (
                    <BlockCard
                      key={blockType.id}
                      onClick={() => handleSelectBlock(blockType)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BlockIcon>
                        <Icon icon={blockType.icon} size={32} />
                      </BlockIcon>
                      <BlockName>{blockType.name}</BlockName>
                      {blockType.description && (
                        <BlockDescription>{blockType.description}</BlockDescription>
                      )}
                    </BlockCard>
                  ))}
                </BlockGrid>
              ) : (
                <EmptyMessage>
                  <p>All blocks are already added!</p>
                  <p>Each block can only be added once.</p>
                </EmptyMessage>
              )}
            </ModalContent>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default BlockPicker;