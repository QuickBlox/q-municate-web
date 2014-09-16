/* Configuration your application */
var QMCONFIG = {
  
  // QB account
  qbAccount: {
    appId: 14303,
    authKey: 'gj5Vps4QB-HKJgt',
    authSecret: 'AHpJ6T4L9cVrMxc'
  },

  // FB app
  fbAccount: {
    appId: '623755094412840',
    scope: 'email,user_friends'
  },

  debug: true,

  defAvatar: {
    url: 'images/ava-single.png',
    group_url: 'images/ava-group.png',
    caption: 'Choose user picture'
  },

  maxLimitFile: 10,

  patterns: {
    name: "[^><;]{3,50}",
    password: "[A-Za-z0-9`~!@#%&=_<>;:,'" + '\\"' + "\\.\\$\\^\\*\\-\\+\\\\\/\\|\\(\\)\\[\\]\\{\\}\\?]{8,40}"
  },

  errors: {
    session: "The QB application credentials you entered are incorrect",
    invalidName: "Name mustn't contain '<', '>' and ';' characters",
    shortName: "Name must be more than 2 characters",
    bigName: "Name mustn't be more than 50 characters",
    invalidEmail: "E-mail must look like an email address",
    invalidPass: "Password mustn't contain non-Latin characters and spaces",
    shortPass: "Password must be more than 7 characters",
    bigPass: "Password mustn't be more than 40 characters",
    avatarType: "Avatar must be image",
    fileName: "File name mustn't be more than 100 characters",
    fileSize: "File mustn't be more than 10 MB",
    emailExists: "The email has already been taken",
    unauthorized: "The email and password you entered are incorrect",
    notFoundEmail: "The email you entered wasn't found",
    crashFBToken: "Sorry, we noticed that you had logged out from Facebook so we need to recreate your FB token now. Please click the Connect with FB button again"
  }

};
