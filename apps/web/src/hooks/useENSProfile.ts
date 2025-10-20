import { ChainId } from '@pancakeswap/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useMemo } from 'react'
import { Address } from 'viem'
import { normalize } from 'viem/ens'
import { useEnsAddress, useEnsAvatar, useEnsText } from 'wagmi'

/**
 * Hook to get comprehensive ENS profile information for a given ENS name
 * Includes: resolved address, avatar, and social text records
 *
 * @param ensName - The ENS name to resolve (e.g., "vitalik.eth")
 * @param enabled - Whether to fetch data
 * @returns ENS profile data including address, avatar, and social records
 */
export function useENSProfile(ensName?: string, enabled = true) {
  const { chainId } = useActiveChainId()

  // Only enable ENS queries on supported chains
  const isENSSupported = useMemo(() => chainId !== ChainId.BSC && chainId !== ChainId.BSC_TESTNET, [chainId])

  // Normalize ENS name
  const normalizedName = useMemo(() => {
    if (!ensName) return undefined
    try {
      // Check if it's an ENS name (contains a dot)
      if (ensName.includes('.')) {
        return normalize(ensName)
      }
      return undefined
    } catch (error) {
      console.error('Error normalizing ENS name:', error)
      return undefined
    }
  }, [ensName])

  const shouldFetch = enabled && isENSSupported && Boolean(normalizedName)

  // Resolve ENS name to address
  const { data: address, isLoading: isAddressLoading } = useEnsAddress({
    name: normalizedName,
    chainId: chainId === ChainId.GOERLI ? ChainId.GOERLI : ChainId.ETHEREUM,
    query: {
      enabled: shouldFetch,
    },
  })

  // Get ENS avatar
  const { data: avatar, isLoading: isAvatarLoading } = useEnsAvatar({
    name: normalizedName,
    chainId: chainId === ChainId.GOERLI ? ChainId.GOERLI : ChainId.ETHEREUM,
    query: {
      enabled: shouldFetch,
    },
  })

  // Get social text records
  const { data: twitter } = useEnsText({
    name: normalizedName,
    key: 'com.twitter',
    chainId: chainId === ChainId.GOERLI ? ChainId.GOERLI : ChainId.ETHEREUM,
    query: {
      enabled: shouldFetch && Boolean(address),
    },
  })

  const { data: github } = useEnsText({
    name: normalizedName,
    key: 'com.github',
    chainId: chainId === ChainId.GOERLI ? ChainId.GOERLI : ChainId.ETHEREUM,
    query: {
      enabled: shouldFetch && Boolean(address),
    },
  })

  const { data: discord } = useEnsText({
    name: normalizedName,
    key: 'com.discord',
    chainId: chainId === ChainId.GOERLI ? ChainId.GOERLI : ChainId.ETHEREUM,
    query: {
      enabled: shouldFetch && Boolean(address),
    },
  })

  const { data: telegram } = useEnsText({
    name: normalizedName,
    key: 'org.telegram',
    chainId: chainId === ChainId.GOERLI ? ChainId.GOERLI : ChainId.ETHEREUM,
    query: {
      enabled: shouldFetch && Boolean(address),
    },
  })

  const { data: email } = useEnsText({
    name: normalizedName,
    key: 'email',
    chainId: chainId === ChainId.GOERLI ? ChainId.GOERLI : ChainId.ETHEREUM,
    query: {
      enabled: shouldFetch && Boolean(address),
    },
  })

  const { data: url } = useEnsText({
    name: normalizedName,
    key: 'url',
    chainId: chainId === ChainId.GOERLI ? ChainId.GOERLI : ChainId.ETHEREUM,
    query: {
      enabled: shouldFetch && Boolean(address),
    },
  })

  return useMemo(
    () => ({
      address: address as Address | undefined,
      avatar: avatar ?? undefined,
      isLoading: isAddressLoading || isAvatarLoading,
      socialRecords: {
        twitter: twitter ?? undefined,
        github: github ?? undefined,
        discord: discord ?? undefined,
        telegram: telegram ?? undefined,
        email: email ?? undefined,
        url: url ?? undefined,
      },
      isValid: Boolean(address),
    }),
    [address, avatar, isAddressLoading, isAvatarLoading, twitter, github, discord, telegram, email, url],
  )
}

/**
 * Hook to resolve an input that could be either an address or ENS name
 * Returns the resolved address and ENS profile information if applicable
 *
 * @param input - Address or ENS name
 * @param enabled - Whether to fetch data
 */
export function useResolveAddressOrENS(input?: string, enabled = true) {
  const isAddress = useMemo(() => {
    if (!input) return false
    return /^0x[a-fA-F0-9]{40}$/.test(input)
  }, [input])

  const isENSName = useMemo(() => {
    if (!input) return false
    // Check if it contains a dot and doesn't look like an address
    return input.includes('.') && !isAddress
  }, [input, isAddress])

  // If it's an ENS name, resolve it
  const ensProfile = useENSProfile(isENSName ? input : undefined, enabled && isENSName)

  return useMemo(() => {
    if (isAddress) {
      return {
        address: input as Address,
        isENSName: false,
        ensName: undefined,
        avatar: undefined,
        socialRecords: undefined,
        isLoading: false,
        isValid: true,
      }
    }

    if (isENSName) {
      return {
        address: ensProfile.address,
        isENSName: true,
        ensName: input,
        avatar: ensProfile.avatar,
        socialRecords: ensProfile.socialRecords,
        isLoading: ensProfile.isLoading,
        isValid: ensProfile.isValid,
      }
    }

    return {
      address: undefined,
      isENSName: false,
      ensName: undefined,
      avatar: undefined,
      socialRecords: undefined,
      isLoading: false,
      isValid: false,
    }
  }, [isAddress, isENSName, input, ensProfile])
}
