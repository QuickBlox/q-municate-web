import {
  type QBDataContextType,
  useQbUIKitDataContext,
} from 'quickblox-react-ui-kit'
import { type QBUser } from 'quickblox'
import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type ConfirmationResult,
  type UserCredential,
  getAuth,
  signInWithPhoneNumber,
} from '@firebase/auth'
import QB from 'quickblox/quickblox'

import { stringifyError } from '../utils/parse'
import {
  QBChatConnect,
  QBCreateContent,
  QBCreateSession,
  QBDeleteUserAvatar,
  QBGetUserAvatar,
  QBLogin,
  QBStartSessionWithToken,
  QBUserList,
  QBUserUpdate,
  prepareSDK,
} from '../qb-api-calls'
import useReCaptcha from './useReCaptcha'
import useTimer from './useTimer'
import useIsOffLine from './useIsOffLine'
import { firebaseConfig } from '../configs'
import { type Country } from 'react-phone-number-input'
import useModal from './useModal'

export interface UploadedImage {
  name: string
  file: any
  type: string
  size: number
  public: boolean
}

export default function useAuth() {
  const qbUIKitContext: QBDataContextType = useQbUIKitDataContext()
  const [isLoad, setLoad] = useState(true)

  const [errorMessage, setErrorMessage] = useState('')

  const [country, setCountry] = useState<Country>('US')

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [reSendDisabled, setReSendDisabled] = useState(true)
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  )
  const [user, setUser] = useState<QBUser | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [userAvatar, setUserAvatar] = useState<UploadedImage | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const accessToken = sessionStorage.getItem('accessToken')
  const firebaseToken = sessionStorage.getItem('firebaseToken')

  const navigate = useNavigate()
  const isOffLine = useIsOffLine()
  const {
    data: { theme },
  } = useModal()

  const { screenRef, reCaptcha, updateReCaptcha } = useReCaptcha()
  const { timerIsOver, setActiveTimer } = useTimer(60)

  const handleLogout = async () => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('firebaseToken')
    qbUIKitContext.release()
    navigate('/sign-in')
  }

  const handleError = (error: unknown): void => {
    setErrorMessage(stringifyError(error))
    navigate('/sign-in')
  }

  const requestCode = async () => {
    const reCaptchaUpdated = updateReCaptcha()

    try {
      if (reCaptchaUpdated && reCaptcha.current?.verifier) {
        const firebaseAuth = getAuth()

        const result = await signInWithPhoneNumber(
          firebaseAuth,
          phone,
          reCaptcha.current.verifier,
        )

        setConfirmation(result)
        setCodeSent(true)
        setReSendDisabled(true)
      }
    } catch (e) {
      handleError(e)
    }
  }

  const goBack = () => {
    setCodeSent(false)
  }

  const handlePhoneSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (reCaptcha.current?.verifier) {
        const firebaseAuth = getAuth()

        const result = await signInWithPhoneNumber(
          firebaseAuth,
          phone,
          reCaptcha.current.verifier,
        )

        setConfirmation(result)
        setCodeSent(true)
      }

      if (!reSendDisabled) {
        setReSendDisabled(true)
      }
    } catch (e) {
      handleError(e)
    }
  }

  const handleCodeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (!confirmation) {
        throw new Error('No confirmation result')
      }

      if (!code) {
        throw new Error('Calling verifyCode saga but code is not provided')
      }
      const result = await confirmation.confirm(code)

      await loginWithFirebase(result)
    } catch (e) {
      handleError(e)
    }
  }

  const loginWithFirebase = async (
    credentials: UserCredential,
  ): Promise<void> => {
    try {
      await QBCreateSession()

      const token = await credentials.user.getIdToken(true)

      sessionStorage.setItem('firebaseToken', token)

      const result = await QBLogin({
        provider: 'firebase_phone',
        firebase_phone: {
          access_token: token,
          project_id: firebaseConfig.projectId,
        },
      })

      sessionStorage.setItem('accessToken', result.session.token)

      await qbUIKitContext.authorize({
        userId: result.user.id,
        password: result.session.token,
        userName: result.user.login,
        sessionToken: result.session.token,
      })

      setUser(result.user)
      setUserName(result.user.full_name)
      setLoad(false)
      navigate('/')
    } catch (e) {
      setLoad(false)
      handleError(e)
    }
  }

  const findUserById = async (userId: QBUser['id']) => {
    const userResult = await QBUserList({
      filter: { field: 'id', param: 'in', value: [userId] },
    })
    const [userData] = userResult?.items ?? []

    if (!userData?.user) {
      throw new Error('Error: User not found')
    }

    return userData.user
  }

  const loginWithToken = async () => {
    try {
      if (!accessToken) throw Error()

      const { user_id, token } = await QBStartSessionWithToken(accessToken)

      const user = await findUserById(user_id)

      await QBChatConnect({
        userId: user.id,
        password: token,
      })

      await qbUIKitContext.authorize({
        userId: user_id,
        password: token,
        userName: user.full_name,
        sessionToken: token,
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

      setUser(user)
      setUserName(user.full_name)
      setLoad(false)
      navigate('/')
    } catch (e) {
      if (firebaseToken) {
        console.log('[Q-Municate] Session expired in catch block')
        await refreshToken()
      } else {
        setLoad(false)
        handleError(e)
      }
    }
  }

  const refreshToken = async () => {
    try {
      if (!firebaseToken) throw Error()
      const result = await QBLogin({
        provider: 'firebase_phone',
        firebase_phone: {
          access_token: firebaseToken,
          project_id: firebaseConfig.projectId,
        },
      })

      sessionStorage.setItem('accessToken', result.session.token)

      setUser(result.user)
      setUserName(result.user.full_name)
      setLoad(false)
      navigate('/')
    } catch (e) {
      setLoad(false)
      handleError(e)
    }
  }

  const handleUpdateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (!user) return
      const updates: { full_name?: string; blob_id?: number } = {}

      if (userAvatar) {
        const file = await QBCreateContent({
          file: userAvatar.file,
          name: userAvatar.name,
          size: userAvatar.size,
          type: userAvatar.type,
        })

        updates.blob_id = file.id
      } else if (userName) {
        updates.full_name = userName
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (user && user.blob_id && !userAvatar) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        await QBDeleteUserAvatar(user.blob_id)
      }

      if (Object.keys(updates).length > 0) {
        const result = await QBUserUpdate(user.id, updates)
        setUser(result)
      }
    } catch (e) {
      setAvatarUrl(null)
      setUserAvatar(null)
      if (firebaseToken) {
        await refreshToken()
      } else {
        handleError(e)
      }
    }
  }

  const getAvatarUrl = async () => {
    try {
      // @ts-expect-error missing type in QBUser
      if (user && user.blob_id) {
        // @ts-expect-error missing type in QBUser
        const result = await QBGetUserAvatar(user.blob_id)
        setAvatarUrl(result)
      }
    } catch (e) {
      handleError(e)
    }
  }

  useEffect(() => {
    setTimeout(() => {
      setErrorMessage('')
    }, 5000)
  }, [errorMessage])

  useEffect(() => {
    prepareSDK()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loginWithToken()
    document.documentElement.setAttribute('data-theme', theme ?? 'light')
  }, [])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getAvatarUrl()
  }, [user])

  useEffect(() => {
    if (codeSent && reSendDisabled) {
      setActiveTimer(true)
    }
  }, [codeSent, reSendDisabled])

  useEffect(() => {
    if (timerIsOver) {
      setReSendDisabled(false)
    }
  }, [timerIsOver])

  return {
    refs: { screenRef },
    actions: {
      setPhone,
      setCountry,
      setCode,
      setUserName,
      setUserAvatar,
      setAvatarUrl,
    },
    data: {
      user,
      userName,
      isLoad,
      errorMessage,
      country,
      phone,
      code,
      codeSent,
      isOffLine,
      reSendDisabled,
      avatarUrl,
    },
    handlers: {
      handleError,
      handlePhoneSubmit,
      handleCodeSubmit,
      handleUpdateUser,
      requestCode,
      goBack,
      handleLogout,
      getAvatarUrl,
    },
  }
}
