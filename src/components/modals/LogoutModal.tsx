import cn from 'classnames'
import { Close } from '../../assets/img'
import Button from '../Button'
import './styles.scss'

interface LogoutModalProps {
  selectedValue: string | number
  setSelectedValue: (value: string) => void
  handleLogout: () => Promise<void>
}

export default function LogoutModal(props: LogoutModalProps) {
  const { selectedValue, setSelectedValue, handleLogout } = props

  if (selectedValue !== 'logout') return null

  return (
    <div className="wrapper">
      <div className={cn('content', 'logout')}>
        <div className="close">
          <span>{'Log out'}</span>
          <Close
            className="close-icon"
            onClick={() => {
              setSelectedValue('')
            }}
          />
        </div>
        <div className={cn('buttons', 'buttons-logout')}>
          <Button
            onClick={() => {
              setSelectedValue('')
            }}
            className="cancel-btn"
            size="sm"
          >
            {'Cancel'}
          </Button>
          <Button onClick={handleLogout} className="logout-btn" size="sm">
            {'Log out'}
          </Button>
        </div>
      </div>
    </div>
  )
}
