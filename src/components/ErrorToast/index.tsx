import React from 'react'
import './styles.scss'

interface ErrorToastProps {
  messageText: string
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  messageText,
}: ErrorToastProps) => {
  return (
    <div className="toast">
      <div className="message">{messageText}</div>
    </div>
  )
}
