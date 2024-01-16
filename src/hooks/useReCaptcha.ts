import { useEffect, useRef } from 'react'
import { getAuth, RecaptchaVerifier } from '@firebase/auth'

const initReCaptcha = (container: HTMLDivElement, languageCode: string) => {
  const element = document.createElement('div')

  element.id = 'recaptcha'
  container.appendChild(element)
  const firebaseAuth = getAuth()

  firebaseAuth.languageCode = languageCode
  const verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha', {
    size: 'invisible',
    'expired-callback': () => {
      verifier.clear()
    },
    'error-callback': () => {
      verifier.clear()
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  verifier.render()

  return { verifier, element }
}

export default function useReCaptcha() {
  const reCaptcha = useRef<{
    element: HTMLDivElement
    verifier: RecaptchaVerifier
  }>()
  const screenRef = useRef<HTMLDivElement>(null)

  const updateReCaptcha = () => {
    if (screenRef.current && reCaptcha.current?.verifier) {
      reCaptcha.current.verifier?.clear()

      if (
        reCaptcha.current?.element &&
        screenRef.current?.contains(reCaptcha.current.element)
      ) {
        screenRef.current?.removeChild(reCaptcha.current.element)
      }

      reCaptcha.current = initReCaptcha(screenRef.current, 'en')

      return true
    }

    return false
  }

  useEffect(() => {
    if (screenRef.current) {
      reCaptcha.current = initReCaptcha(screenRef.current, 'en')
    }

    return () => {
      if (reCaptcha.current) {
        reCaptcha.current.verifier?.clear()

        if (
          reCaptcha.current?.element &&
          screenRef.current?.contains(reCaptcha.current.element)
        ) {
          screenRef.current?.removeChild(reCaptcha.current.element)
        }
      }
    }
  }, [])

  return { screenRef, reCaptcha, updateReCaptcha }
}
