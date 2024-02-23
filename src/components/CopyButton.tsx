import { Button, Tooltip, useClipboard } from '@chakra-ui/react'
import { Address } from '@stellar/stellar-sdk'
import { IconCopy } from '@tabler/icons-react'

type CopyButtonProps = {
  str: string | typeof Address | undefined | null
  value: string
  size: 'sm' | 'md' | 'xs'
}

const CopyButton = ({ str, value, size = 'xs' }: CopyButtonProps) => {
  const { onCopy, hasCopied } = useClipboard(value)
  return (
    <Tooltip closeOnClick={false} label={hasCopied ? 'Copied!' : 'Copy'}>
      <Button
        colorScheme={hasCopied ? 'teal' : 'gray'}
        size={size}
        rightIcon={<IconCopy size={15} />}
        onClick={onCopy}
      >
        {str as string}
      </Button>
    </Tooltip>
  )
}

export default CopyButton
