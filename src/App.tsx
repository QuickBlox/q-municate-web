import { useEffect } from 'react'
import RootScreen from './screens/RootScreen'
import SignInScreen from './screens/SignInScreen'
import { useAuth } from './hooks'
import LoaderComponent from './components/NewLoader/LoaderComponent'

export default function App() {
  const {
    refs: { screenRef },
    data: {
      session,
      user,
    },
    handlers: {
      init,
      sendCode,
      codeVerification,
      logout,
    }
  } = useAuth()

  useEffect(() => {
    void init()
  }, [])

  if (user && !session) {
    return <LoaderComponent />
  }

  if (session) {
    return <RootScreen session={session} logout={logout} />
  }

  return (
    <SignInScreen
      screenRef={screenRef}
      sendCode={sendCode}
      codeVerification={codeVerification}
    />
  )
}
