import type { FC } from 'react'
import { Button, H3, Text, YStack } from 'tamagui'

type ErrorPageProps = { error: any; resetErrorBoundary: any }

const ErrorPage: FC<ErrorPageProps> = ({ error, resetErrorBoundary }) => {
  return (
    <YStack m={20} gap>
      <H3>{error.message}</H3>
      <Text>Something went wrong:</Text>
      <Button onPress={resetErrorBoundary}>Try again</Button>
    </YStack>
  )
}

export default ErrorPage
