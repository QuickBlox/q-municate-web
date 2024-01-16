import { type QBUser } from 'quickblox'
import { Avatar, LogoSvg } from '../../assets/img'
import Select from '../Field/Select'
import pckg from '../../../package.json'
import './style.scss'

interface HeaderProps {
  avatarUrl?: string | null
  options?: Array<{ label: string; value: string | number }>
  handleChange?: (value: string | number) => void
  user?: QBUser | null
}

export default function Header(props: HeaderProps) {
  const { handleChange, options, user, avatarUrl } = props

  return (
    <div className="header">
      <LogoSvg className="logo" />
      {user && (
        <div className="user-info">
          {avatarUrl ? (
            <img className="avatar" src={avatarUrl} alt="Avatar" />
          ) : (
            <Avatar className="avatar-icon" />
          )}
          <Select
            options={options!}
            className="header-select"
            onChange={(value) => {
              handleChange!(value)
            }}
            userName={user.full_name || user.phone}
            version={pckg.version}
          />
        </div>
      )}
    </div>
  )
}
