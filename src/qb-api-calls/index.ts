import QB, { type QBSession, type QBUser } from 'quickblox/quickblox'
import { QBConfig } from '../configs'
import { stringifyError } from '../utils/parse'

export const prepareSDK = () => {
  if ((window as any).QB === undefined) {
    (window as any).QB = QB
  }

  QB.init(
    QBConfig.credentials.appId,
    QBConfig.credentials.authKey,
    QBConfig.credentials.authSecret,
    QBConfig.credentials.accountKey,
    QBConfig.appConfig,
  )
}

export async function QBUserList(params: ListUserParams) {
  return await new Promise<ListUserResponse | undefined>((resolve, reject) => {
    QB.users.listUsers(params, (error, response) => {
      if (error) {
        reject(stringifyError(error))
      } else {
        if (response) resolve(response as ListUserResponse)
        reject(new Error('User not found.'))
      }
    })
  })
}

export async function loginToQuickBlox(params: QBLoginParams) {
  return await new Promise<QBUser>((resolve, reject) => {
    QB.login(params, (loginError, user) => {
      if (loginError) {
        reject(loginError)
      } else {
        if (user) resolve(user)
        reject(new Error('User result is missing or invalid.'))
      }
    })
  })
}

export async function QBStartSessionWithToken(token: string) {
  return await new Promise<QBSession>((resolve, reject) => {
    QB.startSessionWithToken(
      token,
      (
        sessionError: any,
        result: { session: QBSession } | null | undefined,
      ) => {
        if (sessionError) {
          reject(sessionError)
        } else if (result?.session) {
          resolve(result.session)
        } else {
          reject(new Error('Session result is missing or invalid.'))
        }
      },
    )
  })
}

export async function QBLogin(params: QBLoginParams) {
  let session: QBSession

  return await QBCreateSession()
    .then(async (_session) => {
      session = _session

      return await loginToQuickBlox(params)
    })
    .then((user) => ({ user, session }))
}

export async function QBCreateSession() {
  return await new Promise<QBSession>((resolve, reject) => {
    QB.createSession((sessionError, session) => {
      if (sessionError) {
        reject(sessionError)
      } else {
        if (session) resolve(session)
        reject(new Error('Session result is missing or invalid.'))
      }
    })
  })
}

export async function QBChatConnect(params: ChatConnectParams) {
  return await new Promise((resolve, reject) => {
    QB.chat.connect(params, (error, success) => {
      if (error) {
        reject(error)
      } else {
        resolve(success)
      }
    })
  })
}

export async function QBUserUpdate(
  userId: QBUser['id'],
  user: Partial<QBUser>,
) {
  return await new Promise<QBUser>((resolve, reject) => {
    QB.users.update(userId, user, (error, updatedUser) => {
      if (error) {
        reject(stringifyError(error))
      } else {
        resolve(updatedUser as QBUser)
      }
    })
  })
}

export async function QBCreateContent(file: {
  name: string
  file: Buffer
  type: string
  size: number
  public?: boolean | undefined
}) {
  return await new Promise<QBContentObject>((resolve, reject) => {
    QB.content.createAndUpload(file, (error, result) => {
      if (error) {
        reject(stringifyError(error))
      } else {
        resolve(result as QBContentObject)
      }
    })
  })
}

export async function QBGetUserAvatar(
  fileId: QBContentObject['id'],
): Promise<string> {
  return await new Promise((resolve, reject) => {
    QB.content.getInfo(fileId, (error, response) => {
      if (error) {
        reject(stringifyError(error))
      } else {
        if (response) {
          const result = QB.content.privateUrl(response.blob.uid)
          resolve(result)
        }
        reject(new Error('User avatar is missing.'))
      }
    })
  })
}

export async function QBDeleteUserAvatar(fileId: QBContentObject['id']) {
  return await new Promise((resolve, reject) => {
    QB.content.delete(fileId, (error, response) => {
      if (error) {
        reject(stringifyError(error))
      } else {
        resolve(response)
      }
    })
  })
}
