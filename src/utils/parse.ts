import { FirebaseError } from '@firebase/app'

export const jsonParse = <P>(text: string): P | string => {
  try {
    return JSON.parse(text)
  } catch (error) {
    return text
  }
}

export const parseErrorObject = (data: Dictionary<string | string[]>) =>
  Object.keys(data)
    .map((key) => {
      const field = data[key]

      return Array.isArray(field)
        ? `${key} ${field.join('')}`
        : `${key} ${field}`
    })
    .join(' ')
    .replace(/errors\s?/, '')

export const parseErrorMessage = (message: string) => {
  const data = jsonParse<string | string[] | Dictionary<string | string[]>>(
    message,
  )

  if (typeof data === 'string') {
    return data
  }

  if (Array.isArray(data)) {
    return data.join('')
  }

  if (typeof data === 'object') {
    return parseErrorObject(data)
  }

  return data
}

export function isQBError(error: unknown): error is QBError {
  return typeof error === 'object' && error !== null && 'message' in error
}

export function stringifyError(error: unknown) {
  if (error instanceof FirebaseError && error.code) return error.code
  if (typeof error === 'string') return error

  if (error && typeof error === 'object') {
    const dataError:
      | { detail?: string; message?: string }
      | Dictionary<string | string[]> = error

    if (dataError.detail) {
      return parseErrorMessage(dataError.detail)
    }

    if (dataError?.message) {
      return parseErrorMessage(dataError.message)
    }

    return parseErrorObject(dataError)
  }

  return JSON.stringify(error)
}
