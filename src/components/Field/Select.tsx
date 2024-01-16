import {
  type MouseEvent as ReactMouseEvent,
  type FocusEvent,
  useState,
  type DetailedHTMLProps,
  type InputHTMLAttributes,
} from 'react'
import cn from 'classnames'
import { DropdownSmall } from '../../assets/img'

type HTMLInputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>

interface SelectProps extends Omit<HTMLInputProps, 'onChange' | 'type'> {
  userName: string
  options: Array<{ label: string; value: string | number }>
  onChange: (value: string | number) => void
  version?: string
}

export default function Select(props: SelectProps) {
  const { className, options, onChange, userName, version, ...inputProps } =
    props
  const [isFocus, setIsFocus] = useState(false)
  const [isShowOptions, setIsShowOptions] = useState(false)

  const handleToggleShow = () => {
    setIsShowOptions(!isShowOptions)
  }

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (inputProps?.onFocus) {
      inputProps?.onFocus(e)
    }
    setIsFocus(true)
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (inputProps?.onBlur) {
      inputProps?.onBlur(e)
    }
    setIsFocus(false)
  }

  const handleSelect = (
    e: ReactMouseEvent<HTMLUListElement | HTMLLIElement, MouseEvent>,
  ) => {
    e.stopPropagation()
    const { dataset } = e.target as EventTarget & {
      dataset: { value?: string }
    }

    if (dataset.value) {
      onChange(dataset.value)
      setIsShowOptions(false)
    }
  }

  return (
    <div
      aria-haspopup="listbox"
      aria-expanded={isShowOptions}
      className={cn('field select-field', className, {
        'select-field--focus': isFocus,
      })}
      onClick={handleToggleShow}
    >
      <div className="flex-field">
        <span className="user-name" onFocus={handleFocus} onBlur={handleBlur}>
          {userName}
        </span>
        <DropdownSmall className="icon" />
      </div>
      {isShowOptions && (
        <ul
          role="listbox"
          id="select-field-list"
          className="select-field-list"
          onClick={handleSelect}
        >
          {options.map((option) => (
            <li
              key={option.value}
              tabIndex={-1}
              className="select-field-option"
              role="option"
              data-value={option.value}
              aria-selected={option.value === inputProps.value}
            >
              {option.label}
            </li>
          ))}
          <li className="select-app-version">{`v${version!}`}</li>
        </ul>
      )}
    </div>
  )
}
