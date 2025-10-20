import { Box, Button, Flex, Text } from '@pancakeswap/uikit'
import { useENSPreferences } from 'hooks/useENSPreferences'
import { useState } from 'react'
import styled from 'styled-components'

const BannerContainer = styled(Box)`
  background: #1fc7d4;
  border-radius: 12px;
  padding: 12px 20px;
  position: relative;
  margin-bottom: 12px;
  color: white;
`

const CloseButton = styled(Button)`
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  padding: 0;
  width: 24px;
  height: 24px;
  min-width: 24px;
  background: rgba(255, 255, 255, 0.2);
  color: white;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }
`

/**
 * Component that displays a notification when ENS preferences are loaded
 */
export const ENSPreferencesIndicator: React.FC = () => {
  const { preferences, hasAnyPreferences, ensName, isLoading } = useENSPreferences()
  const [isDismissed, setIsDismissed] = useState(false)

  if (isLoading || !ensName || !hasAnyPreferences || isDismissed) {
    return null
  }

  return (
    <BannerContainer>
      <CloseButton variant="text" onClick={() => setIsDismissed(true)}>
        ×
      </CloseButton>

      <Flex alignItems="center" style={{ gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>⚙️</span>

        <Box>
          <Text color="white" fontSize="14px" bold>
            ENS Settings Loaded ({ensName})
          </Text>

          <Flex style={{ gap: '12px', marginTop: '4px' }}>
            {preferences.slippage && (
              <Text color="white" fontSize="12px" style={{ opacity: 0.9 }}>
                Slippage: {preferences.slippage}%
              </Text>
            )}
            {preferences.theme && (
              <Text color="white" fontSize="12px" style={{ opacity: 0.9 }}>
                Theme: {preferences.theme}
              </Text>
            )}
            {preferences.expertMode !== undefined && (
              <Text color="white" fontSize="12px" style={{ opacity: 0.9 }}>
                Expert Mode: {preferences.expertMode ? 'On' : 'Off'}
              </Text>
            )}
            {preferences.gasPriority && (
              <Text color="white" fontSize="12px" style={{ opacity: 0.9 }}>
                Gas: {preferences.gasPriority}
              </Text>
            )}
          </Flex>
        </Box>
      </Flex>
    </BannerContainer>
  )
}
