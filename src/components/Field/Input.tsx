import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react'
import cn from 'classnames'

type HTMLInputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>

interface InputProps extends HTMLInputProps {
  type: 'email' | 'number' | 'password' | 'search' | 'text' | 'url'
}

export default function Input({ className, type, ...props }: InputProps) {
  return (
    <div className="field-wrapper">
      <input type={type} className={cn('field', className)} {...props} />
    </div>
  )
}
