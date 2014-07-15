/* Configuration your application */
var QMCONFIG = {
  
  // Local account
  qbAccount: {
    appId: 11629,
    authKey: 'uzVTTDQWQ8Deapf',
    authSecret: 'fyMjkBgMDrOUUPB'
  },

  // Local FB app
  fbAccount: {
    appId: '1445555125707161',
    scope: 'email,user_friends'
  },

  debug: true,

  defAvatar: {
    url: 'images/ava-single.png',
    caption: 'Choose user picture'
  },

  maxLimitFile: 10,

  patterns: {
    name: "[^><;]{3,50}",
    password: "[A-Za-z0-9`~!@#%&=_<>;:,'" + '\\"' + "\\.\\$\\^\\*\\-\\+\\\\\/\\|\\(\\)\\[\\]\\{\\}\\?]{8,40}"
  },

  errors: {
    session: 'The QB application credentials you entered are incorrect',
    invalidName: 'Name has a bad format. Length must be in the diapason [3-50]',
    invalidEmail: 'Email should look like an email address',
    invalidPass: 'Password should contain alphanumeric and punctuation characters only. Length must be in the diapason [8-40]',
    avatarType: 'User picture can be image only',
    fileName: 'File name should be less 100 characters',
    fileSize: 'File size should not be bigger than 10 MB',
    notFoundEmail: 'Sorry, but this email address wasn\'t found',
    crashFBToken: 'Sorry, we notice that you has actually exited from Facebook so we need to recreate your FB token now. Please just click on the button again'
  }

};
