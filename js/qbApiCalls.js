/*
 * Q-municate chat application
 *
 * QuickBlox JS SDK Wrapper
 *
 */

module.exports = QBApiCalls;

var session;

function QBApiCalls(app) {
  this.app = app;
  session = this.app.models.Session;
}

QBApiCalls.prototype = {

  init: function(token) {
    var UserView = this.app.views.User;

    if (typeof token === 'undefined') {
      QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
    } else {
      QB.init(token);

      session.create(JSON.parse(localStorage['QM.session']), true);
      UserView.autologin(session);
    }
  },

  checkSession: function(callback) {
    var UserView = this.app.views.User,
        self = this;

    if ((new Date).toISOString() > session.expirationTime) {
      self.init(); // reset QuickBlox JS SDK after autologin via an existing token

      // recovery session
      if (session.authParams.provider) {
        UserView.getFBStatus(function(token) {
          session.authParams.keys.token = token;
          self.createSession(session.authParams, callback, session._remember);
        });
      } else {
        self.createSession(session.decrypt(session.authParams), callback, session._remember);
      }
      
    } else {
      callback();
    }
  },

  createSession: function(params, callback, isRemember) {
    var UserView = this.app.views.User;

    QB.createSession(params, function(err, res) {
      if (err) {
        if (QMCONFIG.debug) console.log(err.detail);

        var errMsg,
            parseErr = JSON.parse(err.detail);

        if (err.code === 401) {
          errMsg = QMCONFIG.errors.unauthorized;
          $('section:visible input:not(:checkbox)').addClass('is-error');
        } else {
          errMsg = parseErr.errors.email ? parseErr.errors.email[0] :
                   parseErr.errors.base ? parseErr.errors.base[0] : parseErr.errors[0];

          // This checking is needed when your user has exited from Facebook
          // and you try to relogin on a project via FB without reload the page.
          // All you need it is to get the new FB user status and show specific error message
          if (errMsg.indexOf('Authentication') >= 0) {
            errMsg = QMCONFIG.errors.crashFBToken;
            UserView.getFBStatus();
          
          // This checking is needed when you trying to connect via FB
          // and your primary email has already been taken on the project 
          } else if (errMsg.indexOf('already') >= 0) {
            errMsg = QMCONFIG.errors.emailExists;
            UserView.getFBStatus();
          } else {
            errMsg = QMCONFIG.errors.session;
          }
        }

        fail(errMsg);
      } else {
        if (QMCONFIG.debug) console.log('QB SDK: Session is created', res);

        if (session.token) {
          session.update({ token: res.token });
        } else {
          session.create({ token: res.token, authParams: session.encrypt(params) }, isRemember);
        }

        session.update({ date: new Date });

        callback(res, session);
      }
    });
  },

  loginUser: function(params, callback) {
    this.checkSession(function(res) {
      QB.login(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

        } else {
          if (QMCONFIG.debug) console.log('QB SDK: User has logged', res);

          session.update({ date: new Date, authParams: session.encrypt(params) });

          callback(res);
        }
      });
    });
  },

  logoutUser: function(callback) {
    if (QMCONFIG.debug) console.log('QB SDK: User has exited');
    this.init(); // reset QuickBlox JS SDK after autologin via an existing token
    session.destroy();
    callback();
  },

  forgotPassword: function(email, callback) {
    this.checkSession(function(res) {
      QB.users.resetPassword(email, function(response) {
        if (response.code === 404) {
          if (QMCONFIG.debug) console.log(response.message);

          failForgot();
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Instructions have been sent');

          session.destroy();
          callback();
        }
      });
    });
  },

  listUsers: function(params, callback) {
    this.checkSession(function(res) {
      QB.users.listUsers(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Users is found', res);

          session.update({ date: new Date });
          callback(res);
        }
      });
    });
  },

  getUser: function(params, callback) {
    this.checkSession(function(res) {
      QB.users.get(params, function(err, res) {
        if (err && err.code === 404) {
          if (QMCONFIG.debug) console.log(err.message);

          failSearch();
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Users is found', res);

          session.update({ date: new Date });
          callback(res);
        }
      });
    });
  },

  createUser: function(params, callback) {
    this.checkSession(function(res) {
      QB.users.create(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

          failUser();
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: User is created', res);

          session.update({ date: new Date });
          callback(res);
        }
      });
    });
  },

  updateUser: function(id, params, callback) {
    this.checkSession(function(res) {
      QB.users.update(id, params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

          failUser();
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: User is updated', res);

          session.update({ date: new Date });
          callback(res);
        }
      });
    });
  },

  createBlob: function(params, callback) {
    this.checkSession(function(res) {
      QB.content.createAndUpload(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Blob is uploaded', res);

          session.update({ date: new Date });
          callback(res);
        }
      });
    });
  },

  chatConnect: function(jid, callback) {
    this.checkSession(function(res) {
      var password = session.authParams.provider ? session.token :
                     session.decrypt(session.authParams).password;

      QB.chat.connect({jid: jid, password: password}, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

        } else {
          callback();
        }
      });
    });
  },

  chatDisconnect: function() {
    QB.chat.disconnect();
  },

  subscriptionPresence: function(params) {
    QB.chat.sendSubscriptionPresence(params);
  }

};

/* Private
---------------------------------------------------------------------- */
var fail = function(errMsg) {
  var UserView = QBApiCalls.app.views.User;
  UserView.removeSpinner();
  $('section:visible').find('.text_error').addClass('is-error').text(errMsg);
};

var failUser = function() {
  var errMsg = QMCONFIG.errors.emailExists;
  $('section:visible input[type="email"]').addClass('is-error');
  fail(errMsg);
};

var failForgot = function() {
  var errMsg = QMCONFIG.errors.notFoundEmail;
  $('section:visible input[type="email"]').addClass('is-error');
  fail(errMsg);
};

var failSearch = function() {
  var FriendListView = QBApiCalls.app.views.FriendList;
  $('.popup:visible .note').removeClass('is-hidden').siblings('.popup-elem').addClass('is-hidden');
  FriendListView.removeDataSpinner();
};
