import { Box, Flex, FlexGap, Link, Skeleton, Text, TwitterIcon } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'
import styled from 'styled-components'
import { Address } from 'viem'

const ProfileContainer = styled(Box)`
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.backgroundAlt} 0%,
    ${({ theme }) => theme.colors.background} 100%
  );
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 20px;
  margin-top: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #1fc7d4 0%, #7645d9 50%, #1fc7d4 100%);
  }
`

const AvatarContainer = styled(Box)`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const SocialBadge = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.backgroundAlt} 0%,
    ${({ theme }) => theme.colors.tertiary} 100%
  );
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.tertiary} 0%,
      ${({ theme }) => theme.colors.primary} 100%
    );
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`

const ENSBadge = styled(Box)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #1fc7d4 0%, #7645d9 100%);
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 4px rgba(31, 199, 212, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const AddressText = styled(Text)`
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSubtle};
  word-break: break-all;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

interface SocialRecords {
  twitter?: string
  github?: string
  discord?: string
  telegram?: string
  email?: string
  url?: string
}

interface ENSProfileDisplayProps {
  ensName?: string
  address?: Address
  avatar?: string
  socialRecords?: SocialRecords
  isLoading?: boolean
}

/**
 * Component to display ENS profile information including avatar and social records
 * Used to help users verify they're sending assets to the correct recipient
 */
export function ENSProfileDisplay({ ensName, address, avatar, socialRecords, isLoading }: ENSProfileDisplayProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <ProfileContainer>
        <FlexGap gap="12px" alignItems="center">
          <Skeleton width="48px" height="48px" variant="circle" />
          <Box style={{ flex: 1 }}>
            <Skeleton width="120px" height="20px" mb="8px" />
            <Skeleton width="200px" height="16px" />
          </Box>
        </FlexGap>
      </ProfileContainer>
    )
  }

  if (!ensName || !address) {
    return null
  }

  const hasSocialRecords =
    socialRecords &&
    (socialRecords.twitter ||
      socialRecords.github ||
      socialRecords.discord ||
      socialRecords.telegram ||
      socialRecords.url)

  return (
    <ProfileContainer>
      <FlexGap gap="16px" alignItems="flex-start">
        <AvatarContainer>
          {avatar ? (
            <Avatar src={avatar} alt={ensName} />
          ) : (
            <Text fontSize="20px" bold>
              {ensName.charAt(0).toUpperCase()}
            </Text>
          )}
        </AvatarContainer>

        <Box style={{ flex: 1 }}>
          <FlexGap alignItems="center" gap="8px" mb="4px">
            <Text fontSize="16px" bold>
              {ensName}
            </Text>
            <ENSBadge>
              <Text fontSize="10px">✓ ENS</Text>
            </ENSBadge>
          </FlexGap>

          <AddressText mb="8px">{address}</AddressText>

          {hasSocialRecords && (
            <>
              <Text fontSize="12px" color="textSubtle" mb="8px">
                {t('Verified Records:')}
              </Text>
              <FlexGap gap="6px" flexWrap="wrap">
                {socialRecords.twitter && (
                  <SocialBadge
                    external
                    href={`https://twitter.com/${socialRecords.twitter.replace('@', '')}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TwitterIcon width="14px" />
                    <Text fontSize="11px">@{socialRecords.twitter.replace('@', '')}</Text>
                  </SocialBadge>
                )}
                {socialRecords.github && (
                  <SocialBadge
                    external
                    href={`https://github.com/${socialRecords.github}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Text fontSize="11px">🐙 {socialRecords.github}</Text>
                  </SocialBadge>
                )}
                {socialRecords.discord && (
                  <SocialBadge as="div">
                    <Text fontSize="11px">💬 {socialRecords.discord}</Text>
                  </SocialBadge>
                )}
                {socialRecords.telegram && (
                  <SocialBadge
                    external
                    href={`https://t.me/${socialRecords.telegram.replace('@', '')}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Text fontSize="11px">✈️ {socialRecords.telegram}</Text>
                  </SocialBadge>
                )}
                {socialRecords.url && (
                  <SocialBadge external href={socialRecords.url} onClick={(e) => e.stopPropagation()}>
                    <Text fontSize="11px">🔗 {t('Website')}</Text>
                  </SocialBadge>
                )}
              </FlexGap>
            </>
          )}
        </Box>
      </FlexGap>

      <Box mt="12px" pt="12px" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        <Text fontSize="11px" color="textSubtle" textAlign="center">
          {t('✓ Sending to this ENS name. Please verify the information above.')}
        </Text>
      </Box>
    </ProfileContainer>
  )
}
