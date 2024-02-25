import Donate from '@/components/Forms/Donate.tsx'
import Mint from '@/components/Forms/Mint.tsx'
import { NotFoundPage } from '@/pages/Share/NotFoundPage.tsx'
import { oracle } from '@/shared/contracts.ts'
import { useSorobanReact } from '@soroban-react/core'
import { Route, Routes } from 'react-router-dom'
import Layout from './Layout.tsx'
import PairDetails from './Pairs/PairDetails.tsx'
import { PairsList } from './Pairs/PairsList.tsx'

const AppRoutes = () => {
  const sorobanContext = useSorobanReact()

  const routes = [
    { element: <PairsList />, path: '/' },
    { element: <PairsList />, path: '/home' },
    {
      element: <PairDetails sorobanContext={sorobanContext} contract={oracle} />,
      path: '/BTC_USDT',
    },
    { element: <Mint sorobanContext={sorobanContext} />, path: '/mint/btc' },
    { element: <Donate sorobanContext={sorobanContext} />, path: '/donation/btc' },
    { element: <NotFoundPage />, path: '/*' },
  ]

  return (
    <Routes>
      <Route path="/" element={<Layout sorobanContext={sorobanContext} />}>
        {routes?.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Route>
    </Routes>
  )
}

export default AppRoutes
