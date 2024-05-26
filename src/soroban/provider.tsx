import { futurenet, sandbox, testnet } from '@soroban-react/chains'
import { SorobanReactProvider } from '@soroban-react/core'
import { freighter } from '@soroban-react/freighter'
import type { Connector, WalletChain } from '@soroban-react/types'
import type { FC, ReactNode } from 'react'

const allowedChains: WalletChain[] = [futurenet, testnet, sandbox]
const allowedConnectors: Connector[] = [freighter()]

const MySorobanReactProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SorobanReactProvider chains={allowedChains} connectors={allowedConnectors}>
      {children}
    </SorobanReactProvider>
  )
}
export default MySorobanReactProvider
