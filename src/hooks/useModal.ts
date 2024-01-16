import { useState } from 'react'

export default function useModal() {
  const theme = localStorage.getItem('theme')
  const [options, setOptions] = useState([
    { label: 'Settings', value: 'settings' },
    { label: 'Light Theme', value: theme ?? 'light' },
    // { label: "Dark Theme", value: "dark-theme" },
    { label: 'Log out', value: 'logout' },
  ])
  const [selectedValue, setSelectedValue] = useState<string | number>('')

  const handleChange = (value: string | number) => {
    if (value === 'dark') {
      localStorage.setItem('theme', value)
      document.documentElement.setAttribute('data-theme', value)
      setOptions([
        { label: 'Settings', value: 'settings' },
        { label: 'Light Theme', value: 'light' },
        { label: 'Log out', value: 'logout' },
      ])
    } else if (value === 'light') {
      localStorage.setItem('theme', value)
      document.documentElement.setAttribute('data-theme', value)
      setOptions([
        { label: 'Settings', value: 'settings' },
        { label: 'Dark Theme', value: 'dark' },
        { label: 'Log out', value: 'logout' },
      ])
    }
    setSelectedValue(value)
  }

  return {
    data: { options, selectedValue, theme },
    actions: { setSelectedValue },
    handlers: { handleChange },
  }
}
