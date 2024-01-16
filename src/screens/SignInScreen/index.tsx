import cn from 'classnames'

import './style.scss'
import PhoneInput from '../../components/Field/PhoneInput'
import Button from '../../components/Button'
import { Back } from '../../assets/img'
import { useAuth } from '../../hooks'
import Header from '../../components/Header'
import CountrySelect from '../../components/Field/CountrySelect'
import PinInput from '../../components/Field/PinInput'
import { ErrorToast } from '../../components/ErrorToast'
import Footer from '../../components/Footer'
import { useEffect, useRef } from 'react'

const SignInScreen = () => {
  const {
    data: { phone, codeSent, reSendDisabled, isOffLine, errorMessage, country },
    actions: { setPhone, setCountry, setCode },
    refs: { screenRef },
    handlers: { handlePhoneSubmit, handleCodeSubmit, requestCode, goBack },
  } = useAuth()
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (codeSent) {
      codeRef.current?.focus()
    }
  }, [codeSent])

  return (
    <>
      <Header />
      <div className="login-screen" ref={screenRef}>
        {errorMessage && <ErrorToast messageText={errorMessage} />}
        <main className="form-wrapper">
          <form
            className={cn('login-form', { inactive: codeSent })}
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
            className={cn('login-form', { inactive: !codeSent })}
            onSubmit={handleCodeSubmit}
          >
            <div className="form-header">
              <Back className="back-icon" onClick={goBack} />
              <h3 className="title">Verify phone number</h3>
            </div>
            <div className="phone-fields">
              <div className="code-label">
                {'Enter the 6-digit code we sent to'}
                <span className="phone-number">{phone}</span>
              </div>
              <PinInput ref={codeRef} name="code" setCode={setCode} type="text" />
            </div>
            <Button
              size="xl"
              theme="primary"
              type="submit"
              className="verify-btn"
            >
              {'Verify'}
            </Button>
            {!isOffLine && !reSendDisabled && (
              <button className="re-send" type="button" onClick={requestCode}>
                {'Resend code'}
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
