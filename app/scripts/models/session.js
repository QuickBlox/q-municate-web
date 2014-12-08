/*
 * Q-municate chat application
 *
 * Session Module
 *
 */

define(['config', 'cryptojs'], function(QMCONFIG, CryptoJS) {

  function Session(app) {
    this.app = app;
    this._remember = false;
  }

  Session.prototype = {

    create: function(params, isRemember) {
      this.token = params.token;
      this.expirationTime = params.expirationTime || null;
      this.authParams = params.authParams;
      this._remember = isRemember || false;
    },

    update: function(params) {
      var storage, date;

      if (params.token) {
        this.token = params.token;
      } else {
        
        if (params.authParams) {
          this.authParams = params.authParams;
        }
        if (params.date) {
          // set QB session expiration through 2 hours
          date = params.date;
          date.setHours(date.getHours() + 2);
          this.expirationTime = date.toISOString();
        }
        if (this._remember) {
          storage = {
            token: this.token,
            expirationTime: this.expirationTime,
            authParams: this.authParams
          };
          localStorage.setItem('QM.session', JSON.stringify(storage));
        }

      }
    },

    destroy: function() {
      localStorage.removeItem('QM.session');
      this.token = null;
      this.expirationTime = null;
      this.authParams = null;
      this._remember = false;
    },

    // crypto methods for password
    encrypt: function(params) {
      if (params && params.password) {
        params.password = CryptoJS.AES.encrypt(params.password, QMCONFIG.qbAccount.authSecret).toString();
      }
      return params;
    },

    decrypt: function(params) {
      if (params && params.password) {
        params.password = CryptoJS.AES.decrypt(params.password, QMCONFIG.qbAccount.authSecret).toString(CryptoJS.enc.Utf8);
      }
      return params;
    }

  };

  return Session;

});
