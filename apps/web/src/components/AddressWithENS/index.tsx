import { Skeleton, Text, FlexGap } from '@pancakeswap/uikit'
import { useDomainNameForAddress } from 'hooks/useDomain'
import styled from 'styled-components'
import { Address } from 'viem'

const AvatarImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  object-fit: cover;
`

const Placeholder = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSubtle};
`

interface AddressWithENSProps {
  address?: Address | string
  showFullAddress?: boolean
  avatarSize?: number
  fontSize?: string
}

/**
 * Component that displays an address with its ENS name and avatar (if available)
 *
 * Shows:
 * - ENS avatar (or placeholder with first character)
 * - ENS name (if available) or shortened address
 * - Full address on hover (optional)
 */
export const AddressWithENS: React.FC<AddressWithENSProps> = ({
  address,
  showFullAddress = false,
  avatarSize = 24,
  fontSize = '14px',
}) => {
  const { domainName, avatar, isLoading } = useDomainNameForAddress(address ?? '')

  if (!address) return null

  if (isLoading) {
    return (
      <FlexGap gap="8px" alignItems="center">
        <Skeleton width={`${avatarSize}px`} height={`${avatarSize}px`} variant="circle" />
        <Skeleton width="80px" height="16px" />
      </FlexGap>
    )
  }

  const displayText = domainName || (showFullAddress ? address : `${address.slice(0, 6)}...${address.slice(-4)}`)

  const firstChar = domainName ? domainName.charAt(0).toUpperCase() : address.slice(2, 3).toUpperCase()

  return (
    <FlexGap gap="8px" alignItems="center">
      {avatar ? (
        <AvatarImage src={avatar} alt={domainName || address} style={{ width: avatarSize, height: avatarSize }} />
      ) : (
        <Placeholder style={{ width: avatarSize, height: avatarSize, fontSize: `${avatarSize * 0.45}px` }}>
          {firstChar}
        </Placeholder>
      )}
      <Text
        fontSize={fontSize}
        style={{
          fontFamily: domainName ? undefined : 'monospace',
          fontWeight: domainName ? 500 : 400,
        }}
        title={showFullAddress ? undefined : address}
      >
        {displayText}
      </Text>
    </FlexGap>
  )
}
