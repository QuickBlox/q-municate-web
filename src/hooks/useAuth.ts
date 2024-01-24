import {
  useQbUIKitDataContext,
} from 'quickblox-react-ui-kit'
import { useState } from 'react'
import {
  type User,
  type ConfirmationResult,
  getAuth,
  signInWithPhoneNumber,
  browserLocalPersistence,
} from '@firebase/auth'
import QB, { type QBSession } from 'quickblox/quickblox'

import {
  prepareSDK,
  QBChatConnect,
  QBStartSessionWithToken,
} from '../qb-api-calls'
import useReCaptcha from './useReCaptcha'

export default function useAuth() {
  const qbUIKitContext = useQbUIKitDataContext()
  const { screenRef, reCaptcha, updateReCaptcha } = useReCaptcha()
  const [session, setSession] = useState<QBSession | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const init = async () => {
    prepareSDK()
    const firebaseAuth = getAuth()
    await firebaseAuth.setPersistence(browserLocalPersistence)
    const firebaseUser = firebaseAuth.currentUser

    if (firebaseUser) {
      setUser(firebaseUser)

      await restoreSession(firebaseUser)
    }
  }

  const logout = () => {
    const firebaseAuth = getAuth()
    void firebaseAuth.signOut()

    setUser(null)
    setSession(null)
    qbUIKitContext.release()
  }

  const sendCode = async (phone: string) => {
    const isUpdated = updateReCaptcha()

    if (isUpdated && reCaptcha.current?.verifier) {
      const firebaseAuth = getAuth()

      const confirmationResult = await signInWithPhoneNumber(
        firebaseAuth,
        phone,
        reCaptcha.current.verifier,
      )

      return confirmationResult
    }

    return null
  }

  const loginWithFirebase = async (firebaseUser: User) => {
    const firebaseToken = await firebaseUser.getIdToken(true)

    const { session }: { session: QBSession } = await fetch(
      process.env.REACT_APP_API_BASE_URL! + process.env.REACT_APP_API_AUTH_PATH!,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: firebaseToken
        })
      }
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    ).then(res => res.json())

    await QBStartSessionWithToken(session.token)

    await qbUIKitContext.authorize({
      userId: session.user_id,
      password: session.token,
      userName: '',
      sessionToken: session.token,
    })

    return session
  }

  const codeVerification = async (confirmation?: ConfirmationResult | null, code?: string | null) => {
    if (!confirmation) {
      throw new Error('No confirmation result')
    }

    if (!code) {
      throw new Error('Missing verification code')
    }
    const userCredential = await confirmation.confirm(code)

    const session = await loginWithFirebase(userCredential.user)

    setSession(session)
  }

  const restoreSession = async (firebaseUser: User) => {
    const session = await loginWithFirebase(firebaseUser)

    setSession(session)

    await QBChatConnect({
      userId: session.user_id,
      password: session.token,
    })

    qbUIKitContext.setSubscribeOnSessionExpiredListener(() => {
      console.log('[Q-Municate] React ui-kit session expired')
      void refreshToken()
    })

    // @ts-expect-error types is absent
    QB.chat.onSessionExpiredListener = function (error) {
      if (error) {
        console.log('[Q-Municate] QB session unexpired - error: ', error)
      } else {
        console.log('[Q-Municate] QB session expired')
        void refreshToken()
      }
    }
  }

  const refreshToken = async () => {
    const firebaseUser = getAuth().currentUser

    if (!firebaseUser) throw Error()

    const session = await loginWithFirebase(firebaseUser)

    setSession(session)
  }

  return {
    refs: { screenRef },
    data: {
      session,
      user,
    },
    handlers: {
      init,
      logout,
      sendCode,
      codeVerification,
      restoreSession,
    },
  }
}
