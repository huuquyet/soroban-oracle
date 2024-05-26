import { useNavigate } from 'react-router-dom'
import { Button, H1, Text, YStack } from 'tamagui'

export const NotFoundPage = () => {
  const navigate = useNavigate()
  return (
    <YStack mt={20} gap>
      <H1>404</H1>
      <Text>You have found a secret place.</Text>
      <Button onPress={() => navigate('/')}>Home</Button>
    </YStack>
  )
}
