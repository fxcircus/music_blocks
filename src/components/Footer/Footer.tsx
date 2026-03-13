import React from 'react';
import styled from 'styled-components';
import { FaGithub } from 'react-icons/fa';
import { BiCoffeeTogo } from 'react-icons/bi';
import { Icon } from '../../utils/IconHelper';

const FooterContainer = styled.footer`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const FooterLink = styled.a`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Separator = styled.span`
  color: ${({ theme }) => theme.colors.border};
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterInner>
        <FooterLink
          href="https://github.com/fxcircus/music_blocks"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconWrapper><Icon icon={FaGithub} size={14} /></IconWrapper>
          Music Blocks
        </FooterLink>
        <Separator>|</Separator>
        <FooterLink
          href="https://buymeacoffee.com/fxcircus"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconWrapper><Icon icon={BiCoffeeTogo} size={14} /></IconWrapper>
          Support the Project
        </FooterLink>
      </FooterInner>
    </FooterContainer>
  );
};

export default Footer;
