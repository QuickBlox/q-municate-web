import cn from 'classnames'
import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react'
import { type QBUser } from 'quickblox/quickblox'

import { AvatarBig, Close, Remove } from '../../assets/img'
import Button from '../Button'
import Input from '../Field/Input'
import {
  QBCreateContent,
  QBDeleteUserAvatar,
  QBUserUpdate,
} from '../../qb-api-calls'

interface SettingModalProps {
  user?: QBUser | null
  selectedValue: string | number
  setSelectedValue: (value: string) => void
  avatarUrl: string | null
  regex: RegExp
  setUser: (user: QBUser) => void
}

export default function SettingModal(props: SettingModalProps) {
  const {
    user,
    selectedValue,
    setSelectedValue,
    avatarUrl: defaultAvatarUrl,
    regex,
    setUser,
  } = props

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const handleUploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files || []

    setAvatarFile(file)
    setAvatarUrl(URL.createObjectURL(file))
  }

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleOnCancelClick = () => {
    if (!name || !regex.test(name)) return
    setSelectedValue('')
    setAvatarFile(null)
    setName(user!.full_name)
    setAvatarUrl(defaultAvatarUrl || '')
  }

  const handleUpdateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user) return
    const updates: { full_name?: string; blob_id?: number } = {}

    if (name) {
      updates.full_name = name
    }

    if (avatarFile) {
      const blob = await QBCreateContent({
        file: avatarFile as any,
        name: avatarFile.name,
        size: avatarFile.size,
        type: avatarFile.type,
      })

      updates.blob_id = blob.id
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (user?.blob_id && !avatarUrl) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      await QBDeleteUserAvatar(user.blob_id).catch(() => null)
    }

    if (Object.keys(updates).length > 0) {
      const updatedUser = await QBUserUpdate(user.id, updates)

      setUser(updatedUser)
    }

    setSelectedValue('')
  }

  useEffect(() => {
    if (selectedValue === 'settings') {
      setName(user?.full_name || '')
      setAvatarUrl(defaultAvatarUrl || '')
    }
  }, [selectedValue])

  if (selectedValue !== 'settings') return null

  return (
    <div className="wrapper">
      <form onSubmit={handleUpdateUser}>
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
            <span>Photo</span>
            <div className="user-avatar">
              {avatarUrl ? (
                <img className="avatar" src={avatarUrl} alt="Avatar" />
              ) : (
                <AvatarBig className="avatar-icon" />
              )}
              {avatarUrl ? (
                <Button
                  onClick={() => {
                    setAvatarFile(null)
                    setAvatarUrl('')
                  }}
                  className="remove"
                  size="sm"
                >
                  Remove
                </Button>
              ) : (
                <label className="upload">
                  <input
                    type="file"
                    onChange={handleUploadAvatar}
                    accept="image/*"
                  />
                  Upload
                </label>
              )}
            </div>
            <span>Your name</span>
            <div className="user-name">
              <Input
                className={cn('name-input')}
                type="text"
                placeholder="Enter your name"
                onChange={handleChangeName}
                value={name}
              />
              <Remove
                className="remove-name"
                onClick={() => {
                  setName('')
                }}
              />
              <span className="hint-info">
                Start with a letter, use only a-z, A-Z, hyphens, underscores,
                and spaces. Length: 3-50 characters.
              </span>
            </div>
            <div className={cn('buttons', 'buttons-setting')}>
              <Button
                onClick={handleOnCancelClick}
                disabled={!user!.full_name}
                className={'cancel-btn'}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                disabled={!name || !regex.test(name)}
                type="submit"
                className={cn('finish-btn', {
                  disable: !name || !regex.test(name),
                })}
                size="sm"
              >
                Finish
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
