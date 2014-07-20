/* Configuration your application */
var QMCONFIG = {
  
  // Local account
  qbAccount: {
    appId: 12496,
    authKey: 'DxGShn2UtN5TUfd',
    authSecret: 'gypfTzd3VbqYxsK'
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
    session: "The QB application credentials you entered are incorrect",
    invalidName: "Name shouldn't contain '<', '>' and ';' characters",
    shortName: "Name shouldn't be less than 3 characters",
    bigName: "Name shouldn't be more than 50 characters",
    invalidEmail: "E-mail should look like an email address",
    invalidPass: "Password shouldn't contain non-Latin characters and spaces",
    shortPass: "Password shouldn't be less than 8 characters",
    bigPass: "Password shouldn't be more than 40 characters",
    avatarType: "Avatar should be image",
    fileName: "File name shouldn't be more than 100 characters",
    fileSize: "File should be less than 10 MB",
    emailExists: "The email has already been taken",
    unauthorized: "The email and password you entered are incorrect",
    notFoundEmail: "The email you entered wasn't found",
    crashFBToken: "Sorry, we noticed that you had logged out from Facebook so we need to recreate your FB token now. Please click the Connect with FB button again"
  }

};
