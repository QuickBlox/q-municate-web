import { type CSSProperties } from 'react'
import cn from 'classnames'

import './styles.scss'

interface LoaderProps {
  className?: string
  theme?: 'primary' | 'secondary' | 'default'
  size?: number
}

export default function Loader(props: LoaderProps) {
  const { className, theme, size } = props
  const spinnerStyle: CSSProperties = size
    ? {
        height: size,
        width: size,
      }
    : {}

  return (
    <div
      className={cn('spinner', theme ?? 'default', className)}
      style={spinnerStyle}
    >
      <div className="bar1" />
      <div className="bar2" />
      <div className="bar3" />
      <div className="bar4" />
      <div className="bar5" />
      <div className="bar6" />
      <div className="bar7" />
      <div className="bar8" />
      <div className="bar9" />
      <div className="bar10" />
      <div className="bar11" />
      <div className="bar12" />
    </div>
  )
}
