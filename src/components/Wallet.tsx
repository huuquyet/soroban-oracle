import CopyButton from '@/components/CopyButton.tsx'
import { formatShortAddress } from '@/utils/utils.tsx'
import { Button, useToast } from '@chakra-ui/react'
import { SorobanContextType } from '@soroban-react/core'
import { IconLoader, IconLogout, IconWallet } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

export function Wallet({ sorobanContext }: { sorobanContext: SorobanContextType }) {
  const { connect, activeChain } = sorobanContext
  const openConnectModal = async (): Promise<void> => {
    await connect()
  }

  const [isLoading, setIsLoading] = useState(false)

  if (isLoading) {
    return (
      <Button
        fontSize={'sm'}
        fontWeight={600}
        color={'white'}
        bg={'gray.700'}
        rightIcon={<IconLoader />}
      >
        Loading
      </Button>
    )
  }

  return (
    <>
      {activeChain ? (
        <div>{activeChain.name}</div>
      ) : (
        <Button
          fontSize={'sm'}
          fontWeight={600}
          color={'white'}
          bg={'pink.400'}
          rightIcon={<IconWallet />}
          onClick={openConnectModal}
          _hover={{ bg: 'pink.300' }}
        >
          Connect
        </Button>
      )}
    </>
  )
}
