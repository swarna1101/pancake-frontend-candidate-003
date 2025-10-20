import { ChainId } from '@pancakeswap/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useMemo } from 'react'
import { Address, isAddress } from 'viem'
import { normalize } from 'viem/ens'
import { useEnsAddress, useEnsText } from 'wagmi'

/**
 * Hook to resolve ENS names to token contract addresses
 *
 * This hook enables users to import tokens using ENS names instead of contract addresses.
 * It supports two resolution methods:
 *
 * 1. **Primary Address Resolution**: Uses the primary address of the ENS name
 * 2. **Token Text Record**: Checks for a 'token' text record on the ENS name
 *    This allows ENS owners to specify a different token contract address
 *
 * The hook prioritizes the 'token' text record over the primary address,
 * allowing ENS names to point to token contracts they don't own.
 *
 * @param input - ENS name or Ethereum address
 * @param enabled - Whether to enable the resolution (default: true)
 * @returns Object containing resolved address, ENS name, loading state, and validity
 */
export const useENSTokenAddress = (input?: string, enabled = true) => {
  const { chainId } = useActiveChainId()

  // Determine if input is an ENS name (contains .eth) or already an address
  const { isENSName, normalizedName } = useMemo(() => {
    if (!input || input.trim() === '') {
      return { isENSName: false, normalizedName: null }
    }

    const trimmed = input.trim()

    // Check if it's already a valid address
    if (isAddress(trimmed)) {
      return { isENSName: false, normalizedName: null }
    }

    // Check if it looks like an ENS name
    if (trimmed.endsWith('.eth') || trimmed.includes('.')) {
      try {
        const normalized = normalize(trimmed)
        return { isENSName: true, normalizedName: normalized }
      } catch (error) {
        console.warn('Failed to normalize ENS name:', error)
        return { isENSName: false, normalizedName: null }
      }
    }

    return { isENSName: false, normalizedName: null }
  }, [input])

  // Determine if ENS is supported on the current chain
  const ensChainId = useMemo(() => {
    if (chainId === ChainId.ETHEREUM || chainId === ChainId.GOERLI) {
      return chainId
    }
    // Default to mainnet for ENS resolution
    return ChainId.ETHEREUM
  }, [chainId])

  // Resolve primary ENS address (owner of the ENS name)
  const { data: primaryAddress, isLoading: isPrimaryLoading } = useEnsAddress({
    name: normalizedName ?? undefined,
    chainId: ensChainId,
    query: {
      enabled: isENSName && enabled && normalizedName !== null,
    },
  })

  // Check if there's a 'token' text record that points to a token contract
  const { data: tokenTextRecord, isLoading: isTokenRecordLoading } = useEnsText({
    name: normalizedName ?? undefined,
    key: 'token',
    chainId: ensChainId,
    query: {
      enabled: isENSName && enabled && normalizedName !== null,
    },
  })

  // Determine the final resolved address
  const resolvedAddress = useMemo(() => {
    // If input is already an address, return it
    if (!isENSName && input && isAddress(input.trim())) {
      return input.trim() as Address
    }

    // Prefer the 'token' text record if it exists and is valid
    if (tokenTextRecord && isAddress(tokenTextRecord)) {
      return tokenTextRecord as Address
    }

    // Fall back to primary address if it's valid
    if (primaryAddress && isAddress(primaryAddress)) {
      return primaryAddress
    }

    return null
  }, [input, isENSName, tokenTextRecord, primaryAddress])

  const isLoading = isENSName && (isPrimaryLoading || isTokenRecordLoading)

  const isValid = useMemo(() => {
    if (!input || input.trim() === '') {
      return false
    }

    // If it's an ENS name, it's valid if we resolved an address
    if (isENSName) {
      return resolvedAddress !== null
    }

    // If it's not an ENS name, check if it's a valid address
    return isAddress(input.trim())
  }, [input, isENSName, resolvedAddress])

  return {
    address: resolvedAddress,
    isENSName,
    ensName: isENSName ? normalizedName : null,
    isLoading,
    isValid,
    hasTokenRecord: Boolean(tokenTextRecord && isAddress(tokenTextRecord)),
  }
}
