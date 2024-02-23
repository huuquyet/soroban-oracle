import { AppProvider } from '@/context/appContext.tsx'
import { ChakraProvider } from '@chakra-ui/react'
import { ThirdwebProvider } from '@thirdweb-dev/react'
import { ErrorBoundary } from 'react-error-boundary'
import { BrowserRouter } from 'react-router-dom'
import ErrorPage from '../pages/Share/ErrorPage.tsx'
import AppRoutes from './AppRoutes.tsx'

const AppProviders = () => {
  return (
    <BrowserRouter>
      <ThirdwebProvider clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}>
        <ChakraProvider>
          <ErrorBoundary FallbackComponent={ErrorPage}>
            <AppProvider>
              <AppRoutes />
            </AppProvider>
          </ErrorBoundary>
        </ChakraProvider>
      </ThirdwebProvider>
    </BrowserRouter>
  )
}

export default AppProviders
