import MySorobanReactProvider from '@/soroban/provider'
import { ChakraProvider } from '@chakra-ui/react'
import { ThirdwebProvider } from '@thirdweb-dev/react'
import { Analytics } from '@vercel/analytics/react'
import { ErrorBoundary } from 'react-error-boundary'
import { BrowserRouter } from 'react-router-dom'
import ErrorPage from '../pages/Share/ErrorPage'
import AppRoutes from './AppRoutes'

function AppProviders() {
  return (
    <BrowserRouter>
      <ThirdwebProvider clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}>
        <ChakraProvider>
          <ErrorBoundary FallbackComponent={ErrorPage}>
            <MySorobanReactProvider>
              <AppRoutes />
            </MySorobanReactProvider>
          </ErrorBoundary>
        </ChakraProvider>
      </ThirdwebProvider>
      <Analytics />
    </BrowserRouter>
  )
}

export default AppProviders
