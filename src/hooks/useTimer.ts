import { useEffect, useRef, useState } from 'react'

export default function useTimer(duration: number) {
  const SECOND = 1000
  const [timer, setTimer] = useState(duration)
  const [timerIsOver, setTimerIsOver] = useState(true)
  const [activeTimer, setActiveTimer] = useState(false)
  const intervalRef = useRef<number | undefined>()

  useEffect(() => {
    if (activeTimer) {
      setTimerIsOver(false)

      intervalRef.current = window.setInterval(() => {
        setTimer((currenTimer: number) => {
          if (currenTimer > 0) {
            return currenTimer - 1
          }

          window.clearInterval(intervalRef.current)
          intervalRef.current = undefined
          setTimerIsOver(true)
          setActiveTimer(false)

          return duration
        })
      }, SECOND)
    } else {
      window.clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }

    return () => {
      window.clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }, [activeTimer])

  return { timer, timerIsOver, setActiveTimer }
}
