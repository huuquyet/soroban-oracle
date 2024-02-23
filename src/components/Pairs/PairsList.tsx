import { ItemCardContainer } from '@/components/Pairs/PairCard.tsx'
import { oracle } from '@/shared/contracts'
import { Stack } from '@chakra-ui/react'

export const PairsList = () => {
  return (
    <Stack>
      <ItemCardContainer contract={oracle} />
    </Stack>
  )
}
