import OracleForm from '@/components/OracleForm.tsx'
import { oracle } from '@/shared/contracts.ts'
import { Stack } from '@chakra-ui/react'
import { SorobanContextType } from '@soroban-react/core'
import { EpochData, PairInfo } from 'oracle-contract'
import { useEffect, useState } from 'react'
import PairCard, { ItemCardContainer } from './PairCard.tsx'

function PairDetails({
  sorobanContext,
  contract,
}: { sorobanContext: SorobanContextType; contract: typeof oracle }) {
  const account = sorobanContext.address ? sorobanContext.address : ''
  const [pairInfo, setPairInfo] = useState<(PairInfo & EpochData) | null>(null)
  const [isLoadingContractOwner, setIsLoadingContractOwner] = useState<boolean>(false)
  const [isContractOwner, setIsContractOwner] = useState(false)
  const [isLoadingPairInfo, setIsLoadingPairInfo] = useState<boolean>(false)

  const getPairInfo = async () => {
    setIsLoadingPairInfo(true)
    try {
      const txPairInfo = await contract.getPairInfo().then((tx) => tx.result)
      await contract
        .getPairDataAtEpoch({
          epoch_nr: txPairInfo?.last_epoch,
        })
        .then((tx) => setPairInfo({ ...txPairInfo, ...tx.result }))
      setIsLoadingPairInfo(false)
    } catch (e) {
      console.log(e)
      setIsLoadingPairInfo(false)
    }
  }

  useEffect(() => {
    if (contract) {
      getPairInfo()
      getPairInfo()
    }
  }, [contract])

  const getIsContractOwner = async () => {
    setIsLoadingContractOwner(true)
    try {
      const txContractOwner = await contract.getContractOwner().then((tx) => tx.result)
      if (txContractOwner === account) {
        setIsContractOwner(true)
      }
      setIsLoadingContractOwner(false)
    } catch (e) {
      console.log(e)
      setIsLoadingContractOwner(false)
    }
  }

  useEffect(() => {
    if (contract && account) getIsContractOwner()
  }, [contract, account])

  return (
    <Stack>
      <PairCard
        pairInfo={pairInfo}
        isLoadingPairInfo={isLoadingPairInfo}
        callback={setPairInfo}
        contract={contract}
      />
      {isContractOwner && <OracleForm sorobanContext={sorobanContext} pairInfo={pairInfo} />}
    </Stack>
  )
}

export default PairDetails
