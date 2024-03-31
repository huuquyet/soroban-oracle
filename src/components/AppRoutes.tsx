import Donate from '@/components/Forms/Donate'
import Mint from '@/components/Forms/Mint'
import { NotFoundPage } from '@/pages/Share/NotFoundPage'
import { oracle } from '@/shared/contracts'
import { useSorobanReact } from '@soroban-react/core'
import { Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import PairDetails from './Pairs/PairDetails'
import { PairsList } from './Pairs/PairsList'

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
