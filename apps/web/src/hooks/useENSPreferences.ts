import { ChainId } from '@pancakeswap/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useDomainNameForAddress } from 'hooks/useDomain'
import { useMemo } from 'react'
import { useAccount, useEnsText } from 'wagmi'

/**
 * ENS Text Record Keys for PancakeSwap Preferences
 * Users can set these on their ENS name via app.ens.domains
 */
const ENS_PREFERENCE_KEYS = {
  SLIPPAGE: 'com.pancakeswap.slippage', // e.g., "0.5" for 0.5%
  THEME: 'com.pancakeswap.theme', // "dark" or "light"
  EXPERT_MODE: 'com.pancakeswap.expertMode', // "true" or "false"
  GAS_PRIORITY: 'com.pancakeswap.gas', // "low", "medium", "high"
} as const

export interface ENSPreferences {
  slippage?: string
  theme?: 'dark' | 'light'
  expertMode?: boolean
  gasPriority?: 'low' | 'medium' | 'high'
}

/**
 * Hook to read PancakeSwap preferences from user's ENS text records
 *
 * This enables users to store their preferences on-chain via ENS,
 * making settings portable across devices and browsers.
 *
 * Users can set these records at app.ens.domains under "Text Records":
 * - com.pancakeswap.slippage: "0.5" (for 0.5%)
 * - com.pancakeswap.theme: "dark" or "light"
 * - com.pancakeswap.expertMode: "true" or "false"
 * - com.pancakeswap.gas: "low", "medium", or "high"
 *
 * @returns Object containing ENS preferences, loading state, and whether any were found
 */
export const useENSPreferences = () => {
  // Get the account address
  const { address: account } = useAccount()
  // Get the active chain id
  const { chainId } = useActiveChainId()
  // Get the domain name for the account
  const { domainName } = useDomainNameForAddress(account ?? '')

  // Determine ENS chain (mainnet or goerli)
  const ensChainId = useMemo(() => {
    if (chainId === ChainId.GOERLI) return ChainId.GOERLI
    return ChainId.ETHEREUM
  }, [chainId])

  // Read all text records in parallel
  const { data: slippageText, isLoading: isLoadingSlippage } = useEnsText({
    name: domainName ?? undefined,
    key: ENS_PREFERENCE_KEYS.SLIPPAGE,
    chainId: ensChainId,
    query: {
      enabled: Boolean(domainName),
    },
  })

  const { data: themeText, isLoading: isLoadingTheme } = useEnsText({
    name: domainName ?? undefined,
    key: ENS_PREFERENCE_KEYS.THEME,
    chainId: ensChainId,
    query: {
      enabled: Boolean(domainName),
    },
  })

  const { data: expertModeText, isLoading: isLoadingExpertMode } = useEnsText({
    name: domainName ?? undefined,
    key: ENS_PREFERENCE_KEYS.EXPERT_MODE,
    chainId: ensChainId,
    query: {
      enabled: Boolean(domainName),
    },
  })

  const { data: gasText, isLoading: isLoadingGas } = useEnsText({
    name: domainName ?? undefined,
    key: ENS_PREFERENCE_KEYS.GAS_PRIORITY,
    chainId: ensChainId,
    query: {
      enabled: Boolean(domainName),
    },
  })

  const isLoading = isLoadingSlippage || isLoadingTheme || isLoadingExpertMode || isLoadingGas

  // Parse and validate preferences
  const preferences: ENSPreferences = useMemo(() => {
    const prefs: ENSPreferences = {}

    // Parse slippage (should be a valid number string)
    if (slippageText) {
      const slippage = parseFloat(slippageText)
      if (!Number.isNaN(slippage) && slippage >= 0 && slippage <= 50) {
        prefs.slippage = slippageText
      }
    }

    // Parse theme
    if (themeText && (themeText === 'dark' || themeText === 'light')) {
      prefs.theme = themeText
    }

    // Parse expert mode
    if (expertModeText) {
      prefs.expertMode = expertModeText.toLowerCase() === 'true'
    }

    // Parse gas priority
    if (gasText && ['low', 'medium', 'high'].includes(gasText.toLowerCase())) {
      prefs.gasPriority = gasText.toLowerCase() as 'low' | 'medium' | 'high'
    }

    return prefs
  }, [slippageText, themeText, expertModeText, gasText])

  const hasAnyPreferences = useMemo(() => {
    return Object.keys(preferences).length > 0
  }, [preferences])

  return {
    preferences,
    isLoading,
    hasAnyPreferences,
    ensName: domainName,
  }
}
