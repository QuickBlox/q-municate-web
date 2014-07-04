/* Configuration your application */
var QMCONFIG = {
  
  // Local account
  qbAccount: {
    appId: 11629,
    authKey: 'uzVTTDQWQ8Deapf',
    authSecret: 'fyMjkBgMDrOUUPB'
  },

  debug: true,

  defAvatar: {
    url: 'images/ava-single.png',
    caption: 'Choose user picture'
  },

  maxLimitFile: 10,

  errors: {
    session: 'Please check QB application credentials',
    invalidName: 'Name has a bad format. Length must be in the diapason [3-50]',
    invalidEmail: 'Email should look like an email address',
    invalidPass: 'Password should contain alphanumeric and punctuation characters only. Length must be in the diapason [8-40]',
    avatarType: 'User picture can be image only',
    fileName: 'File name should be less 100 characters',
    fileSize: 'File size should not be bigger than 10 MB'
  }

};
