import {
  QuickBloxUIKitDesktopLayout,
  QuickBloxUIKitProvider,
} from 'quickblox-react-ui-kit'
import { useEffect } from 'react'

import { QBConfig } from '../../configs/QBconfig'
import { useAuth } from '../../hooks'
import Header from '../../components/Header'
import LoaderComponent from '../../components/NewLoader/LoaderComponent'
import useModal from '../../hooks/useModal'
import LogoutModal from '../../components/modals/LogoutModal'
import SettingModal from '../../components/modals/SettingModal'

const RootScreen = () => {
  const {
    data: { options, selectedValue },
    actions: { setSelectedValue },
    handlers: { handleChange },
  } = useModal()

  const {
    data: { isLoad, user, avatarUrl, userName },
    actions: { setUserAvatar, setUserName, setAvatarUrl },
    handlers: { handleLogout, handleUpdateUser, getAvatarUrl },
  } = useAuth()

  const regex = /^(?=[a-zA-Z])[-a-zA-Z_ ]{3,49}(?<! )$/

  useEffect(() => {
    if ((user && !user?.full_name) || (user && !regex.test(user.full_name))) {
      setSelectedValue('settings')
    }
  }, [user])

  if (isLoad) {
    return <LoaderComponent />
  }

  return (
    <QuickBloxUIKitProvider
      maxFileSize={100 * 1000000}
      accountData={{ ...QBConfig.credentials }}
      qbConfig={{ ...QBConfig }}
    >
      <Header
        avatarUrl={avatarUrl}
        options={options}
        handleChange={handleChange}
        user={user}
        regex={regex}
      />
      <QuickBloxUIKitDesktopLayout uikitHeightOffset={'40px'} />
      <SettingModal
        user={user}
        userName={userName}
        avatarUrl={avatarUrl}
        selectedValue={selectedValue}
        setAvatarUrl={setAvatarUrl}
        setSelectedValue={setSelectedValue}
        setUserAvatar={setUserAvatar}
        setUserName={setUserName}
        handleUpdateUser={handleUpdateUser}
        getAvatarUrl={getAvatarUrl}
        regex={regex}
      />
      <LogoutModal
        selectedValue={selectedValue}
        setSelectedValue={setSelectedValue}
        handleLogout={handleLogout}
      />
    </QuickBloxUIKitProvider>
  )
}

export default RootScreen
