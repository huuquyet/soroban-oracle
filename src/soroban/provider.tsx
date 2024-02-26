import { SorobanReactProvider } from '@soroban-react/core'
import { FC, ReactNode } from 'react'
import { allowedChains } from './allowedChains'
import { allowedConnectors } from './connectors'

const MySorobanReactProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SorobanReactProvider chains={allowedChains} connectors={allowedConnectors}>
      {children}
    </SorobanReactProvider>
  )
}
export default MySorobanReactProvider
