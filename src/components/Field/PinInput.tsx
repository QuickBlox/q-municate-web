import { type InputHTMLAttributes, forwardRef, type ForwardedRef } from 'react'
import './styles.scss'

interface PinInputProps extends InputHTMLAttributes<HTMLInputElement> {
  setCode: (value: string) => void
}

function PinInput({ value, setCode, ...rest }: PinInputProps, ref: ForwardedRef<HTMLInputElement>) {
  return (
    <div className={'input-container'}>
      <input
        ref={ref}
        type="text"
        autoComplete="sms-code"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) => {
          e.target.style.setProperty(
            '--digit',
            e.target.selectionStart!.toString(),
          )

          setCode(e.target.value)
        }}
        pattern="\d{6}"
        {...rest}
      />
    </div>
  )
}

export default forwardRef<HTMLInputElement, PinInputProps>(PinInput)
