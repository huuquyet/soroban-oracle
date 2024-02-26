import { donation } from '@/shared/contracts'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { SorobanContextType } from '@soroban-react/core'
import { EpochData, PairInfo } from 'oracle-contract'
import { useState } from 'react'

function WithdrawForm({
  sorobanContext,
  submitFormCallback,
  pairInfo,
  recipient,
  myBalance,
  contractBalance,
}: {
  sorobanContext: SorobanContextType
  recipient: any
  myBalance: any
  contractBalance: any
  submitFormCallback: any
  pairInfo: (PairInfo & EpochData) | null
}) {
  const toast = useToast()
  const account = sorobanContext.address ? sorobanContext.address : ''
  const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false)

  const onSubmitWithdraw4 = async (): Promise<void> => {
    if (account) {
      if (contractBalance > 0) {
        setIsLoadingWithdraw(true)
        try {
          const txWithdraw = await donation.withdraw(
            {
              caller: account,
            },
            { fee: 100 }
          )
          await txWithdraw.signAndSend()

          toast({
            title: 'Withdraw Successfully!',
            description: '',
            position: 'bottom-right',
            status: 'success',
            duration: 3000,
            isClosable: true,
            variant: 'subtle',
          })

          if (submitFormCallback) {
            setTimeout(() => {
              submitFormCallback()
            }, 1000)
          }

          setIsLoadingWithdraw(false)
        } catch (e) {
          console.log(e)
          setIsLoadingWithdraw(false)
          toast({
            title: 'Withdraw Error!',
            description: '',
            position: 'bottom-right',
            status: 'error',
            duration: 3000,
            isClosable: true,
            variant: 'subtle',
          })
        }
      } else {
        toast({
          title: 'Contract balance is 0',
          description: '',
          position: 'bottom-right',
          status: 'error',
          duration: 3000,
          isClosable: true,
          variant: 'subtle',
        })
      }
    } else {
      toast({
        title: 'Connect wallet!',
        description: '',
        position: 'bottom-right',
        status: 'error',
        duration: 3000,
        isClosable: true,
        variant: 'subtle',
      })
    }
  }

  if (!recipient || !account || (!isLoadingWithdraw && account !== recipient)) return <></>

  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      boxShadow={'md'}
      borderWidth="3px"
      rounded="lg"
      p={6}
    >
      <>
        <Heading w="100%" textAlign={'center'} fontWeight="normal" mb="2%">
          Withdraw
        </Heading>
        <Stack>
          {account === recipient ? (
            <Flex gap={3} align={'flex-end'}>
              <Button
                onClick={onSubmitWithdraw4}
                isLoading={isLoadingWithdraw}
                type="submit"
                w="100%"
                colorScheme="blue"
              >
                Withdraw
              </Button>
            </Flex>
          ) : (
            <Alert status="info">
              <AlertIcon />
              <AlertTitle>Not permit</AlertTitle>
            </Alert>
          )}
        </Stack>
      </>
    </Box>
  )
}

export default WithdrawForm
