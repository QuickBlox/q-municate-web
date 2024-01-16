import countries from 'react-phone-number-input/locale/en.json'
import cn from 'classnames'
import {
  type Country,
  getCountries,
  getCountryCallingCode,
} from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'

import './styles.scss'
import { useEffect, useRef, useState } from 'react'
import { Check, Dropdown } from '../../assets/img'

const Flag = ({
  country,
  className,
}: {
  country: string
  className?: string
}) => {
  const CountryFlag = flags[country as Country] ?? null

  return (
    CountryFlag && (
      <span className={className}>
        <CountryFlag title={country} />
      </span>
    )
  )
}

interface CountrySelectProps {
  value: Country
  className?: string
  onChange: (value: Country) => void
}

export default function CountrySelect({
  value,
  onChange,
  className,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement | null>(null)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleOptionClick = (country: Country) => {
    onChange(country)
    setIsOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <div className={cn('select', className)} ref={selectRef}>
      <div className="select-header" onClick={toggleDropdown}>
        <div>
          <Flag className="country-icon" country={value} />
          <span>{`+${getCountryCallingCode(value)} (${
            countries[value]
          })`}</span>
        </div>
        <Dropdown className={cn('select-dropdown', { opened: isOpen })} />
      </div>
      <ul className={cn('select-options', { opened: isOpen })}>
        {getCountries()
          .sort((a, b) =>
            countries[a]
              .toLowerCase()
              .localeCompare(countries[b].toLowerCase()),
          )
          .map((country) => (
            <li
              key={country}
              className={cn('option')}
              onClick={() => {
                handleOptionClick(country)
              }}
              value={country}
            >
              <div>
                <Flag className="country-icon" country={country} />
                <span>{`+${getCountryCallingCode(country)} (${
                  countries[country]
                })`}</span>
              </div>
              {country === value && <Check className="check-icon" />}
            </li>
          ))}
      </ul>
    </div>
  )
}
