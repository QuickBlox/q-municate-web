import { type FormEvent, useEffect, useRef, useState, type RefObject } from 'react'
import cn from 'classnames'
import type { Country } from 'react-phone-number-input'
import type { ConfirmationResult } from '@firebase/auth'
import { stringifyError } from 'quickblox-react-ui-kit'

import PhoneInput from '../../components/Field/PhoneInput'
import Button from '../../components/Button'
import { Back } from '../../assets/img'
import { useIsOffLine, useTimer } from '../../hooks'
import Header from '../../components/Header'
import CountrySelect from '../../components/Field/CountrySelect'
import PinInput from '../../components/Field/PinInput'
import { ErrorToast } from '../../components/ErrorToast'
import Footer from '../../components/Footer'
import './style.scss'

interface SignInProps {
  screenRef: RefObject<HTMLDivElement>
  sendCode: (phone: string) => Promise<ConfirmationResult | null>
  codeVerification: (confirmation?: ConfirmationResult | null | undefined, code?: string | null | undefined) => Promise<void>
}

const SignInScreen = (props: SignInProps) => {
  const { screenRef, sendCode, codeVerification } = props
  const isOffLine = useIsOffLine()
  const { timerIsOver, setActiveTimer } = useTimer(60)
  const codeRef = useRef<HTMLInputElement>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [country, setCountry] = useState<Country>('US')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  )

  const handleGoBack = () => {
    setConfirmation(null)
    setCode('')
  }

  const handleRequestCode = async () => {
    try {
      const confirmationResult = await sendCode(phone)

      setConfirmation(confirmationResult)
      setActiveTimer(true)
    } catch (error) {
      setErrorMessage(stringifyError(error))
    }
  }

  const handlePhoneSubmit = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()

      await handleRequestCode()
    } catch (error) {
      setErrorMessage(stringifyError(error))
    }
  }

  const handleCodeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()

      await codeVerification(confirmation, code)
    } catch (error) {
      setErrorMessage(stringifyError(error))
    }
  }

  useEffect(() => {
    if (confirmation) {
      codeRef.current?.focus()
    }
  }, [confirmation])

  return (
    <>
      <Header />
      <div className="login-screen" ref={screenRef}>
        {errorMessage && <ErrorToast messageText={errorMessage} />}
        <main className="form-wrapper">
          <form
            className={cn('login-form', { inactive: confirmation })}
            onSubmit={handlePhoneSubmit}
          >
            <div className="form-header">
              <h3 className="title">Enter phone number</h3>
            </div>
            <div className="phone-fields">
              <label>Country</label>
              <CountrySelect
                className="country-select"
                onChange={setCountry}
                value={country}
              />
              <label htmlFor="phone">Number</label>
              <PhoneInput
                id="phone"
                name="phone"
                className="phone-input"
                country={country}
                value={phone}
                placeholder="XXX XXX XXXX"
                onChange={(e) => {
                  setPhone(e!)
                }}
              />
            </div>
            <Button
              size="xl"
              theme="primary"
              type="submit"
              className="login-btn"
            >
              Get code
            </Button>
          </form>
          <form
            className={cn('login-form', { inactive: !confirmation })}
            onSubmit={handleCodeSubmit}
          >
            <div className="form-header">
              <Back className="back-icon" onClick={handleGoBack} />
              <h3 className="title">Verify phone number</h3>
            </div>
            <div className="phone-fields">
              <div className="code-label">
                Enter the 6-digit code we sent to
                <span className="phone-number">{phone}</span>
              </div>
              <PinInput ref={codeRef} name="code" value={code} setCode={setCode} type="text" />
            </div>
            <Button
              size="xl"
              theme="primary"
              type="submit"
              className="verify-btn"
            >
              Verify
            </Button>
            {!isOffLine && timerIsOver && (
              <button className="re-send" type="button" onClick={handleRequestCode}>
                Resend code
              </button>
            )}
          </form>
        </main>
      </div>
      <Footer />
    </>
  )
}

export default SignInScreen
