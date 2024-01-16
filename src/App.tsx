import { Route, Routes } from 'react-router-dom'
import RootScreen from './screens/RootScreen'
import SignInScreen from './screens/SignInScreen'
import { useAuth } from './hooks'
import Header from './components/Header'
import LoaderComponent from './components/NewLoader/LoaderComponent'

export default function App() {
  const {
    data: { isLoad },
  } = useAuth()

  if (isLoad) {
    return (
      <>
        <Header />
        <LoaderComponent />
      </>
    )
  }

  return (
    <Routes>
      <Route path={'/sign-in'} element={<SignInScreen />} />
      <Route path={'*'} element={<RootScreen />} />
    </Routes>
  )
}
