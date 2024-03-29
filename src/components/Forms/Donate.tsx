import DepositForm from '@/components/Forms/DepositForm'
import WithdrawForm from '@/components/Forms/WithdrawForm'
import { donation } from '@/shared/contracts'
import { oracle } from '@/shared/contracts'
import { btc } from '@/shared/contracts'
import {
  Box,
  Flex,
  Spinner,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import type { SorobanContextType } from '@soroban-react/core'
import type { EpochData, PairInfo } from 'oracle-contract'
import { useEffect, useState } from 'react'

function Donate({ sorobanContext }: { sorobanContext: SorobanContextType }) {
  const account = sorobanContext.address ? sorobanContext.address : ''

  const [isLoadingDeposits, setIsLoadingDeposits] = useState(false)
  const [deposits, setDeposits] = useState(0)
  const [contractBalance, setContractBalance] = useState(0)
  const [pairInfo, setPairInfo] = useState<(PairInfo & EpochData) | null>(null)
  const [isLoadingPairInfo, setIsLoadingPairInfo] = useState<boolean>(false)
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(false)
  const [recipient, setRecipient] = useState<any>(null)
  const [myBalance, setMyBalance] = useState(0)
  const [isLoadingMint, setIsLoadingMint] = useState(false)
  const [isLoadingMyBalance, setIsLoadingMyBalance] = useState(false)

  const getPairInfo = async () => {
    setIsLoadingPairInfo(true)
    try {
      const txPairInfo = await oracle.getPairInfo().then((tx) => tx.result)
      await oracle
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

  const getTotalDeposits = async () => {
    try {
      setIsLoadingDeposits(true)
      await donation
        .getTotalDeposits()
        .then((tx) => setDeposits(Number.parseFloat(tx.result.toString()) / 10 ** 10))
      setIsLoadingDeposits(false)
    } catch (e) {
      console.log(e)
      setIsLoadingDeposits(false)
    }
  }

  const getContractBalance = async () => {
    try {
      setIsLoadingDeposits(true)
      await donation
        .getContractBalance()
        .then((tx) => setContractBalance(Number.parseFloat(tx.result.toString()) / 10 ** 10))
      setIsLoadingDeposits(false)
    } catch (e) {
      console.log(e)
      setIsLoadingDeposits(false)
    }
  }

  const getRecipient = async () => {
    try {
      setIsLoadingRecipient(true)
      await donation.recipient().then((tx) => setRecipient(tx.result))
      setIsLoadingRecipient(false)
    } catch (e) {
      console.log(e)
      setIsLoadingRecipient(false)
    }
  }

  const getMyBalance = async () => {
    try {
      setIsLoadingMyBalance(true)
      await btc
        .balance({
          id: account,
        })
        .then((tx) => setMyBalance(Number.parseFloat(tx.result.toString()) / 10 ** 10))
      setIsLoadingMyBalance(false)
    } catch (e) {
      console.log(e)
      setIsLoadingMyBalance(false)
    }
  }

  const getData = () => {
    getTotalDeposits()
    getContractBalance()
  }

  useEffect(() => {
    if (donation) {
      getData()
      getRecipient()
    }
  }, [donation])

  useEffect(() => {
    if (account) getMyBalance()
  }, [account])

  useEffect(() => {
    if (btc) {
      getPairInfo()
    }
  }, [btc])

  if (isLoadingPairInfo || isLoadingMyBalance)
    return (
      <Flex justify={'center'} align={'center'}>
        <Spinner size="lg" />
      </Flex>
    )

  return (
    <Stack>
      {isLoadingDeposits || isLoadingPairInfo ? (
        <Flex justify={'center'} align={'center'}>
          <Spinner size="lg" />
        </Flex>
      ) : (
        <Flex direction={{ base: 'column', sm: 'row' }} w={'100%'} gap={3}>
          <Box
            bg={useColorModeValue('white', 'gray.800')}
            boxShadow={'md'}
            borderWidth="3px"
            w={{ base: '100%', sm: '50%' }}
            rounded="lg"
            p={3}
          >
            <Stat>
              <StatLabel>Total deposits</StatLabel>
              <StatNumber>
                <Text>{deposits} BTC</Text>
              </StatNumber>
              <StatHelpText>{deposits * (Number(pairInfo?.value) / 10 ** 5)} $</StatHelpText>
            </Stat>
          </Box>
          {pairInfo && (
            <Box
              bg={useColorModeValue('white', 'gray.800')}
              boxShadow={'md'}
              borderWidth="3px"
              rounded="lg"
              w={{ base: '100%', sm: '50%' }}
              p={3}
            >
              <Stat>
                <StatLabel>Contract balance</StatLabel>
                <StatNumber>
                  <Text>{contractBalance} BTC</Text>
                </StatNumber>
                <StatHelpText>
                  {contractBalance * (Number(pairInfo?.value) / 10 ** 5)} $
                </StatHelpText>
              </Stat>
            </Box>
          )}
        </Flex>
      )}
      <>
        <DepositForm
          sorobanContext={sorobanContext}
          myBalance={myBalance}
          recipient={recipient}
          pairInfo={pairInfo}
          submitFormCallback={getData}
        />
        <WithdrawForm
          sorobanContext={sorobanContext}
          contractBalance={contractBalance}
          myBalance={myBalance}
          recipient={recipient}
          pairInfo={pairInfo}
          submitFormCallback={getData}
        />
      </>
    </Stack>
  )
}

export default Donate
