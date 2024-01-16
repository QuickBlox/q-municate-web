import { useEffect, useState } from 'react'

export default function useIsOffLine() {
  const [isOnLine, setIsOnLine] = useState(window.navigator.onLine)

  useEffect(() => {
    const onChange = () => {
      setIsOnLine(window.navigator.onLine)
    }

    window.addEventListener('online', onChange)
    window.addEventListener('offline', onChange)

    return () => {
      window.removeEventListener('online', onChange)
      window.removeEventListener('offline', onChange)
    }
  }, [])

  return !isOnLine
}
