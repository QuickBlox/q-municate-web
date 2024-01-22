import cn from 'classnames'
import { type QBUser } from 'quickblox'

import { AvatarBig, Close, Remove } from '../../assets/img'
import Button from '../Button'
import Input from '../Field/Input'
import { type ChangeEvent, type FormEvent } from 'react'
import { type UploadedImage } from '../../hooks/useAuth'
interface SettingModalProps {
  user: QBUser | null
  userName: string
  selectedValue: string | number
  setUserName: (value: string) => void
  setUserAvatar: (value: UploadedImage | null) => void
  setSelectedValue: (value: string) => void
  setAvatarUrl: (value: string) => void
  handleUpdateUser: (e: FormEvent<HTMLFormElement>) => Promise<void>
  avatarUrl: string | null
  getAvatarUrl: () => Promise<void>
  regex: RegExp
}

export default function SettingModal(props: SettingModalProps) {
  const {
    user,
    selectedValue,
    setSelectedValue,
    setAvatarUrl,
    userName,
    avatarUrl,
    setUserAvatar,
    setUserName,
    handleUpdateUser,
    getAvatarUrl,
    regex,
  } = props

  const handleUploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files![0]
    const reader = new FileReader()

    if (file) {
      reader.onloadend = () => {
        setAvatarUrl(reader.result ? (reader.result as string) : '')
      }

      setUserAvatar({
        name: file.name,
        file,
        type: file.type,
        size: file.size,
        public: false,
      })
    }

    reader.readAsDataURL(file)
  }

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setUserName(value)
  }

  const handleOnCancelClick = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (user!.blob_id) {
      void getAvatarUrl()
    }
    if (user!.full_name && regex.test(user!.full_name)) {
      setSelectedValue('')
      setUserName(user!.full_name)
    }
    if (avatarUrl) {
      setAvatarUrl('')
    }
  }

  if (selectedValue !== 'settings') return null

  return (
    <div className="wrapper">
      <form
        onSubmit={(e) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          handleUpdateUser(e)
          setSelectedValue('')
        }}
      >
        <div className={cn('content', 'setting')}>
          <div className="close">
            <span>
              {user!.full_name && regex.test(user!.full_name)
                ? 'Settings'
                : 'Create Profile'}
            </span>
            <Close className="close-icon" onClick={handleOnCancelClick} />
          </div>
          <div className="user-info">
            <span>{'Photo'}</span>
            <div className="user-avatar">
              {avatarUrl ? (
                <img className="avatar" src={avatarUrl} alt="Avatar" />
              ) : (
                <AvatarBig className="avatar-icon" />
              )}
              {avatarUrl ? (
                <Button
                  onClick={() => {
                    setUserAvatar(null)
                    setAvatarUrl('')
                  }}
                  className="remove"
                  size="sm"
                >
                  {'Remove'}
                </Button>
              ) : (
                <label className="upload">
                  <input
                    type="file"
                    onChange={handleUploadAvatar}
                    accept="image/*,image/heic"
                  />
                  {'Upload'}
                </label>
              )}
            </div>
            <span>{'Your name'}</span>
            <div className="user-name">
              <Input
                className={cn('name-input')}
                type="text"
                placeholder="Enter your name"
                onChange={handleChangeName}
                value={userName}
              />
              <Remove
                className="remove-name"
                onClick={() => {
                  setUserName('')
                }}
              />

              {
                <span className="hint-info">
                  {
                    'Start with a letter, use only a-z, A-Z, hyphens, underscores, and spaces. Length: 3-50 characters.'
                  }
                </span>
              }
            </div>
            <div className={cn('buttons', 'buttons-setting')}>
              <Button
                onClick={handleOnCancelClick}
                disabled={!user!.full_name}
                className={'cancel-btn'}
                size="sm"
              >
                {'Cancel'}
              </Button>
              <Button
                disabled={!userName || !regex.test(userName)}
                type="submit"
                className={cn('finish-btn', {
                  disable: !userName || !regex.test(userName),
                })}
                size="sm"
              >
                {'Finish'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
