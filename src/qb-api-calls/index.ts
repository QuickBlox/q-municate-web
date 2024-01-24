import QB from 'quickblox/quickblox'
import type {
  QBContentObject,
  ListUserParams,
  QBSession,
  QBUser,
  ListUserResponse
} from 'quickblox/quickblox'
import { QBConfig } from '../configs'
import { stringifyError } from '../utils/parse'

export const prepareSDK = () => {
  if ((window as any).QB === undefined) {
    (window as any).QB = QB
  }

  QB.initWithAppId(
    QBConfig.credentials.appId,
    QBConfig.credentials.accountKey,
    QBConfig.appConfig,
  )
}

export function QBUserList(params: ListUserParams) {
  return new Promise<ListUserResponse>((resolve, reject) => {
    QB.users.listUsers(params, (error, result) => {
      if (result) {
        resolve(result)
      } else {
        reject(stringifyError(error))
      }
    })
  })
}

export function QBStartSessionWithToken(token: string) {
  return new Promise<QBSession>((resolve, reject) => {
    QB.startSessionWithToken(
      token,
      (
        sessionError: any,
        result: { session: QBSession } | null | undefined,
      ) => {
        if (result?.session) {
          resolve(result.session)
        } else {
          reject(sessionError || new Error('Session result is missing or invalid.'))
        }
      },
    )
  })
}

export function QBChatConnect(params: ChatConnectParams) {
  return new Promise((resolve, reject) => {
    QB.chat.connect(params, (error, result) => {
      if (result) {
        resolve(result)
      } else {
        reject(error)
      }
    })
  })
}

export function QBUserUpdate(
  userId: QBUser['id'],
  user: Partial<QBUser>,
) {
  return new Promise<QBUser>((resolve, reject) => {
    QB.users.update(userId, user, (error, result) => {
      if (result) {
        resolve(result)
      } else {
        reject(stringifyError(error))
      }
    })
  })
}

export function QBCreateContent(file: {
  name: string
  file: Buffer
  type: string
  size: number
  public?: boolean | undefined
}) {
  return new Promise<QBContentObject>((resolve, reject) => {
    QB.content.createAndUpload(file, (error, result) => {
      if (result) {
        resolve(result)
      } else {
        reject(stringifyError(error))
      }
    })
  })
}

export function QBGetUserAvatar(
  fileId: QBContentObject['id'],
) {
  return new Promise<string>((resolve, reject) => {
    QB.content.getInfo(fileId, (error, result) => {
      if (result?.blob.uid) {
        resolve(QB.content.privateUrl(result.blob.uid))
      } else {
        reject(stringifyError(error) || new Error('No avatar'))
      }
    })
  })
}

export function QBDeleteUserAvatar(fileId: QBContentObject['id']) {
  return new Promise((resolve, reject) => {
    QB.content.delete(fileId, (error, result) => {
      if (result) {
        resolve(result)
      } else {
        reject(stringifyError(error))
      }
    })
  })
}
