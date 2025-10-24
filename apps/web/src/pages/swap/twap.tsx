import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { NextPageWithLayout } from 'utils/page.types'
import { CHAIN_IDS } from 'utils/wagmi'
import { useIsSmartAccount } from 'hooks/useIsSmartAccount'
import Page from 'views/Page'
import SwapLayout from 'views/Swap/SwapLayout'

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Page showExternalLink={false} showHelpLink={false} removePadding>
      {children}
    </Page>
  )
}

const TwapAndLimitSwap = dynamic(() => import('views/Swap/Twap/TwapSwap'), { ssr: false })

const TwapView = () => {
  const router = useRouter()
  const isSmartAccount = useIsSmartAccount()

  useEffect(() => {
    if (isSmartAccount) {
      router.replace('/swap')
    }
  }, [isSmartAccount, router])

  if (isSmartAccount) {
    return null
  }

  return (
    <SwapLayout>
      <TwapAndLimitSwap />
    </SwapLayout>
  )
}

const TwapPage = dynamic(() => Promise.resolve(TwapView), {
  ssr: false,
}) as NextPageWithLayout

TwapPage.chains = CHAIN_IDS
TwapPage.screen = true
TwapPage.Layout = Layout

export default TwapPage
