/* Configuration your application */
define(function() {

  var QMCONFIG = {

    /* Production environment */
    qbAccount: {

      appId: 3,
      authKey: 'MUBuFQN76WTWeWQ',
      authSecret: '7PAaVGa4qaPkusN'

/*
appId: 9,
      authKey: 'g4brVM8XwLCYUEQ',
      authSecret: 'DBCYFrbVFZQHM7G'
*/
  
  },

    // /* Test local environment */
    // qbAccount: {
    //   appId: 36125,
    //   authKey: 'gOGVNO4L9cBwkPE',
    //   authSecret: 'JdqsMHCjHVYkVxV'
    // },

    fbAccount: {
     // by installation appId: '605405446247805',
      
      appId: '607819272715713',
      scope: 'email,user_friends'
    },

    debug: true,

    notification: {
      timeout: 7
    },

    isMac: !!navigator.platform.match(/Mac/) ? 1 : 0,

    defAvatar: {
      url: 'images/ava-single.svg',
      url_png: 'images/ava-single.png',
      group_url: 'images/ava-group.svg',
      group_url_png: 'images/ava-group.png',
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
      invalidEmail: "Please enter a valid Email address",
      invalidPhone: "Phone mustn't contain letters",
      oldPass: "Old password is incorrect",
      invalidPass: "Password mustn't contain non-Latin characters and spaces",
      shortPass: "Password must be more than 7 characters",
      bigPass: "Password mustn't be more than 40 characters",
      avatarType: "Avatar must be image",
      fileName: "File name mustn't be more than 100 characters",
      fileSize: "File mustn't be more than 10 MB",
      emailExists: "The email has already been taken",
      unauthorized: "The email or password is incorrect",
      notFoundEmail: "The email you entered wasn't found",
      crashFBToken: "Sorry, we noticed that you had logged out from Facebook so we need to recreate your FB token now. Please click the Connect with FB button again",
      FBAccountExists: "This FB user already has an account in the Q-municate. You can't combine two Q-municate users"
    },

    QBconf: {
      endpoints: {
        api: "apiqb.medicbleep.co.uk",
        chat:"chatmedicbleep.quickblox.com",
        //chatmedicbleep.quickblox.com:5291 
        //chatqb.medicbleep.co.uk:5291" 

//chat: "chatmedicbleep.quickblox.com"
      },
      chatProtocol: {
        active: 2
      },
      debug: {
        mode: 1,
        file: null
      },
      webrtc: {
        answerTimeInterval: 45,
        statsReportTimeInterval: 5
        

      }
    }

  };

  return QMCONFIG;

});
