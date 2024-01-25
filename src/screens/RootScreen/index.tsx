import {
  QuickBloxUIKitDesktopLayout,
  QuickBloxUIKitProvider,
} from 'quickblox-react-ui-kit'
import { useEffect, useState } from 'react'
import type { QBSession, QBUser } from 'quickblox/quickblox'

import { QBConfig } from '../../configs/QBconfig'
import Header from '../../components/Header'
import LoaderComponent from '../../components/NewLoader/LoaderComponent'
import useModal from '../../hooks/useModal'
import LogoutModal from '../../components/modals/LogoutModal'
import SettingModal from '../../components/modals/SettingModal'
import { QBGetUserAvatar, QBUserList } from '../../qb-api-calls'

const regex = new RegExp(QBConfig.appConfig.regexUserName)

interface RootScreenProps {
  session: QBSession
  logout: VoidFunction
}

const RootScreen = (props: RootScreenProps) => {
  const { session, logout } = props
  const {
    data: { options, selectedValue },
    actions: { setSelectedValue },
    handlers: { handleChange },
  } = useModal()

  const [user, setUser] = useState<QBUser | null>(null)
  // const [userName, setUserName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

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

  const handleReceiveUser = async () => {
    if (session) {
      const user = await findUserById(session.user_id)

      setUser(user)

      if ((user && !user?.full_name) || (user && !regex.test(user.full_name))) {
        setSelectedValue('settings')
      }
      // else {
      //   setUserName(user.full_name)
      // }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (user?.blob_id) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const userAvatarUrl = await QBGetUserAvatar(user.blob_id)
        setAvatarUrl(userAvatarUrl)
      }
    }
  }

  useEffect(() => {
    if (session?.user_id) {
      void handleReceiveUser()
    }
  }, [session?.user_id])

  if (!user) {
    return <LoaderComponent />
  }

  return (
    <QuickBloxUIKitProvider
      maxFileSize={100 * 1000000}
      accountData={{ ...QBConfig.credentials, sessionToken: session.token }}
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
        avatarUrl={avatarUrl}
        selectedValue={selectedValue}
        setSelectedValue={setSelectedValue}
        regex={regex}
        setUser={setUser}
      />
      <LogoutModal
        selectedValue={selectedValue}
        setSelectedValue={setSelectedValue}
        handleLogout={logout}
      />
    </QuickBloxUIKitProvider>
  )
}

export default RootScreen
