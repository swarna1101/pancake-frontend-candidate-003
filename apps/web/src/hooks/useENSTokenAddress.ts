import { ChainId } from '@pancakeswap/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useMemo } from 'react'
import { Address, isAddress } from 'viem'
import { normalize } from 'viem/ens'
import { useEnsAddress, useEnsText, useReadContract } from 'wagmi'

// Minimal ERC20 ABI to check if address is a token
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
] as const

/**
 * Hook to resolve ENS names to token contract addresses with ERC20 verification
 *
 * This hook enables users to import tokens using ENS names instead of contract addresses.
 * It supports multiple ENS TLDs (.eth, .xyz, .luxe, .kred, .art, .club, etc.)
 *
 * Resolution methods:
 * 1. **Token Text Record**: Checks for a 'token' text record on the ENS name
 *    This allows ENS owners to specify a different token contract address
 * 2. **Primary Address Resolution**: Falls back to the primary address of the ENS name
 *
 * The hook verifies that the resolved address is a valid ERC20 token by checking
 * for the decimals() function. This prevents non-token addresses from being imported.
 *
 * @param input - ENS name (any TLD) or Ethereum address
 * @param enabled - Whether to enable the resolution (default: true)
 * @returns Object containing resolved address, ENS name, loading state, validity, and ERC20 verification
 */
export const useENSTokenAddress = (input?: string, enabled = true) => {
  const { chainId } = useActiveChainId()

  // Determine if input is an ENS name (any domain with a dot) or already an address
  const { isENSName, normalizedName } = useMemo(() => {
    if (!input || input.trim() === '') {
      return { isENSName: false, normalizedName: null }
    }

    const trimmed = input.trim()

    // Check if it's already a valid address
    if (isAddress(trimmed)) {
      return { isENSName: false, normalizedName: null }
    }

    // Check if it looks like an ENS name (contains a dot)

    if (trimmed.includes('.')) {
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

  // Verify if the resolved address is an ERC20 token by checking for decimals function
  const {
    data: decimals,
    isLoading: isVerifyingToken,
    isError: isTokenVerificationError,
  } = useReadContract({
    address: resolvedAddress ?? undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId,
    query: {
      enabled: Boolean(resolvedAddress),
      retry: 1, // Only retry once to fail fast for non-token addresses
      staleTime: 60000, // Cache for 1 minute
    },
  })

  const isERC20Token = useMemo(() => {
    // If we have a resolved address and decimals were successfully fetched, it's an ERC20 token
    return Boolean(resolvedAddress && decimals !== undefined && !isTokenVerificationError)
  }, [resolvedAddress, decimals, isTokenVerificationError])

  const isLoading = isENSName && (isPrimaryLoading || isTokenRecordLoading || isVerifyingToken)

  const isValid = useMemo(() => {
    if (!input || input.trim() === '') {
      return false
    }

    // If it's an ENS name, it's valid if we resolved an address AND it's an ERC20 token
    if (isENSName) {
      return resolvedAddress !== null && isERC20Token
    }

    // If it's not an ENS name, check if it's a valid address AND an ERC20 token
    return isAddress(input.trim()) && isERC20Token
  }, [input, isENSName, resolvedAddress, isERC20Token])

  // Return the resolved address, ENS name, loading state, validity, token verification, and whether there's a token record
  return {
    address: resolvedAddress,
    isENSName,
    ensName: isENSName ? normalizedName : null,
    isLoading,
    isValid,
    isERC20Token,
    decimals: decimals as number | undefined,
    hasTokenRecord: Boolean(tokenTextRecord && isAddress(tokenTextRecord)),
  }
}
