import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import {
  AutoColumn,
  BscScanIcon,
  Button,
  Column,
  DeleteOutlineIcon,
  FlexGap,
  IconButton,
  Input,
  Link,
  Skeleton,
  Text,
} from '@pancakeswap/uikit'
import Row, { RowBetween, RowFixed } from 'components/Layout/Row'
import { CurrencyLogo } from 'components/Logo'
import { useTokenByChainId } from 'hooks/Tokens'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useENSTokenAddress } from 'hooks/useENSTokenAddress'
import { useDebounce } from '@pancakeswap/hooks'
import { RefObject, useCallback, useMemo, useRef, useState } from 'react'
import { useRemoveUserAddedToken } from 'state/user/hooks'
import useUserAddedTokens from 'state/user/hooks/useUserAddedTokens'
import { styled } from 'styled-components'
import { getBlockExploreLink, safeGetAddress } from 'utils'
import ImportRow from './ImportRow'
import { CurrencyModalView } from './types'

const Wrapper = styled.div`
  width: 100%;
  height: calc(100% - 60px);
  position: relative;
  padding-bottom: 60px;
`

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export default function ManageTokens({
  setModalView,
  setImportToken,
  chainId: chainIdProp,
}: {
  setModalView: (view: CurrencyModalView) => void
  setImportToken: (token: Token) => void
  chainId?: number
}) {
  const { chainId: activeChainId } = useActiveChainId()
  const chainId = chainIdProp || activeChainId

  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback((event) => {
    const input = event.target.value
    setSearchQuery(input)
  }, [])

  // Check if input looks like an ENS name
  const looksLikeENS = searchQuery.trim().endsWith('.eth')

  // Resolve ENS name or address
  const {
    address: resolvedAddress,
    isENSName,
    ensName,
    isLoading: isResolvingENS,
    hasTokenRecord,
  } = useENSTokenAddress(debouncedSearchQuery, true)

  // if they input an address or ENS name, use it
  const finalAddress = resolvedAddress || (safeGetAddress(debouncedSearchQuery) ? debouncedSearchQuery : undefined)
  const searchToken = useTokenByChainId(finalAddress, chainId)

  // all tokens for local list
  const userAddedTokens: Token[] = useUserAddedTokens(chainId)
  const removeToken = useRemoveUserAddedToken()

  const handleRemoveAll = useCallback(() => {
    if (chainId && userAddedTokens) {
      userAddedTokens.forEach((token) => {
        return removeToken(chainId, token.address)
      })
    }
  }, [removeToken, userAddedTokens, chainId])

  const tokenList = useMemo(() => {
    return (
      chainId &&
      userAddedTokens.map((token) => (
        <RowBetween key={token.address} width="100%">
          <RowFixed>
            <CurrencyLogo currency={token} size="20px" />
            <Link
              external
              href={getBlockExploreLink(token.address, 'address', chainId)}
              color="textSubtle"
              ml="10px"
              mr="3px"
            >
              {token.symbol}
            </Link>
            <a href={getBlockExploreLink(token.address, 'token', chainId)} target="_blank" rel="noreferrer noopener">
              <BscScanIcon width="20px" color="textSubtle" />
            </a>
          </RowFixed>
          <RowFixed>
            <IconButton variant="text" onClick={() => removeToken(chainId, token.address)}>
              <DeleteOutlineIcon color="textSubtle" />
            </IconButton>
          </RowFixed>
        </RowBetween>
      ))
    )
  }, [userAddedTokens, chainId, removeToken])

  const isAddressValid = searchQuery === '' || safeGetAddress(searchQuery) || isENSName

  // Check if ENS resolved but no valid token was found
  const ensResolvedButNoToken = isENSName && resolvedAddress && !isResolvingENS && !searchToken

  return (
    <Wrapper>
      <Column style={{ width: '100%', flex: '1 1' }}>
        <AutoColumn gap="14px">
          <Row>
            <Input
              id="token-search-input"
              scale="lg"
              placeholder={t('Token address or ENS name (e.g., uniswap.eth)')}
              value={searchQuery}
              autoComplete="off"
              ref={inputRef as RefObject<HTMLInputElement>}
              onChange={handleInput}
              isWarning={!isAddressValid && !isResolvingENS && debouncedSearchQuery !== ''}
            />
          </Row>
          {!isAddressValid && !isResolvingENS && debouncedSearchQuery !== '' && (
            <Text color="failure" fontSize="14px">
              {t('Enter valid token address or ENS name')}
            </Text>
          )}
          {looksLikeENS && isResolvingENS && (
            <FlexGap gap="8px" alignItems="center" style={{ padding: '8px 0' }}>
              <Skeleton width="16px" height="16px" variant="circle" />
              <Text color="textSubtle" fontSize="13px">
                {t('Resolving ENS name...')}
              </Text>
            </FlexGap>
          )}
          {isENSName && resolvedAddress && !isResolvingENS && (
            <FlexGap gap="8px" alignItems="center" style={{ padding: '8px 0' }}>
              <Text fontSize="16px" color="success" bold>
                ✓
              </Text>
              <FlexGap gap="6px" alignItems="center" flexWrap="wrap">
                <Text fontSize="14px" color="text" bold>
                  {ensName}
                </Text>
                <Text fontSize="14px" color="textSubtle">
                  →
                </Text>
                <Text fontSize="13px" color="textSubtle" style={{ fontFamily: 'monospace' }}>
                  {resolvedAddress?.slice(0, 8)}...{resolvedAddress?.slice(-6)}
                </Text>
                {searchToken && (
                  <Text fontSize="12px" color="success">
                    ({t('Token found')})
                  </Text>
                )}
              </FlexGap>
            </FlexGap>
          )}
          {searchToken && !isResolvingENS && (
            <ImportRow
              token={searchToken}
              showImportView={() => setModalView(CurrencyModalView.importToken)}
              setImportToken={setImportToken}
              style={{ height: 'fit-content' }}
              chainId={chainId}
            />
          )}
        </AutoColumn>
        {tokenList}
        <Footer>
          <Text bold color="textSubtle">
            {userAddedTokens?.length} {userAddedTokens.length === 1 ? t('Imported Token') : t('Imported Tokens')}
          </Text>
          {userAddedTokens.length > 0 && (
            <Button variant="tertiary" onClick={handleRemoveAll}>
              {t('Clear all')}
            </Button>
          )}
        </Footer>
      </Column>
    </Wrapper>
  )
}
