import {
  type Props,
  type DefaultInputComponentProps,
} from 'react-phone-number-input'
import ReactPhoneInput from 'react-phone-number-input/input'
import cn from 'classnames'
import 'react-phone-number-input/style.css'

type PhoneInputProps = Props<DefaultInputComponentProps>

export default function PhoneInput({
  className,
  inputComponent,
  ...props
}: PhoneInputProps) {
  return (
    <ReactPhoneInput
      {...props}
      international
      defaultCountry={props.country}
      className={cn('field', className)}
      onChange={props.onChange}
    />
  )
}
