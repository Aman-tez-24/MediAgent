'use client'

import { useFormStatus } from 'react-dom'
import { Button, ButtonProps } from './button'
import { Loader2 } from 'lucide-react'

export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button {...props} disabled={pending || props.disabled}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </>
      ) : (
        children
      )}
    </Button>
  )
}
