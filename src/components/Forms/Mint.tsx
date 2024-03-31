import { btc } from '@/shared/contracts'
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import type { SorobanContextType } from '@soroban-react/core'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

function Mint({ sorobanContext }: { sorobanContext: SorobanContextType }) {
  const toast = useToast()
  const account = sorobanContext.address ? sorobanContext.address : ''

  const [myBalance, setMyBalance] = useState(0)
  const [isLoadingMint, setIsLoadingMint] = useState(false)
  const [isLoadingMyBalance, setIsLoadingMyBalance] = useState(false)

  const {
    reset,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<{
    amount: string
  }>({
    defaultValues: {
      amount: '',
    },
  })

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

  const onSubmitMint = async (formData: { amount: string }): Promise<void> => {
    if (account) {
      setIsLoadingMint(true)
      try {
        const txMint = await btc.mint(
          {
            amount: BigInt(Number.parseFloat(formData?.amount) * 10 ** 10),
            to: account,
          },
          { fee: 100 }
        )
        await txMint.signAndSend()

        toast({
          title: 'Mint Successful!',
          description: '',
          position: 'bottom-right',
          status: 'success',
          duration: 3000,
          isClosable: true,
          variant: 'subtle',
        })

        getMyBalance()

        reset({ amount: '' })
        setIsLoadingMint(false)
      } catch (e) {
        console.log(e)
        reset({ amount: '' })
        setIsLoadingMint(false)
        toast({
          title: 'Mint Error!',
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

  useEffect(() => {
    if (account) {
      getMyBalance()
    }
  }, [account])

  return (
    <Stack>
      <Box
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow={'md'}
        borderWidth="3px"
        rounded="lg"
        p={6}
      >
        <>
          <Heading w="100%" textAlign={'center'} fontWeight="normal" mb="2%">
            Mint
          </Heading>
          <Stack>
            <form onSubmit={handleSubmit(onSubmitMint)}>
              <Flex gap={3} align={'flex-start'}>
                <FormControl isInvalid={!!errors.amount} id="bio" mt={1}>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="md"
                    color="gray.700"
                    _dark={{ color: 'gray.50' }}
                  />

                  <NumberInput>
                    <NumberInputField
                      shadow="sm"
                      disabled={isLoadingMint}
                      fontSize={{ sm: 'sm' }}
                      placeholder="Amount"
                      {...register('amount', {
                        required: 'This field is required',
                        min: {
                          value: 0.000000001,
                          message: 'Enter a value greater than 0!',
                        },
                      })}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>

                  <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
                </FormControl>

                <Button
                  style={{ marginTop: 11.5 }}
                  isLoading={isLoadingMint}
                  type="submit"
                  w="7rem"
                  colorScheme="blue"
                >
                  Mint
                </Button>
              </Flex>
            </form>
          </Stack>
        </>
      </Box>

      {account && (
        <Box
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow={'md'}
          borderWidth="3px"
          rounded="lg"
          p={3}
          mb={20}
        >
          {isLoadingMyBalance ? (
            <Flex style={{ marginTop: 15 }} justify={'center'} align={'center'}>
              <Spinner size="lg" />
            </Flex>
          ) : (
            <>
              <Heading w="100%" textAlign={'center'} fontWeight="normal" mb="1%">
                Your balance
              </Heading>
              <Flex align={'center'} justify={'center'}>
                <Text fontSize="2xl" fontWeight="bold">
                  <Badge ml="1" fontSize="1em" colorScheme="green">
                    {myBalance} BTC
                  </Badge>
                </Text>
              </Flex>
            </>
          )}
        </Box>
      )}
    </Stack>
  )
}

export default Mint
