/*
 * Q-municate chat application
 *
 * Session Module
 *
 */

module.exports = Session;

function Session(app) {
  this.app = app;
}

Session.prototype = {

  create: function(token, params, isRemember) {
    this.storage = {
      token: token || null,
      expirationTime: null,
      authParams: this.encrypt(params) || null
    };

    this._remember = isRemember || false;
  },

  setExpirationTime: function() {
    var limitHours = 2,
        d = new Date;

    d.setHours(d.getHours() + limitHours);
    this.storage.expirationTime = d.toISOString();

    if (this._remember)
      localStorage.setItem('QM.session', JSON.stringify(this.storage));
  },

  setAuthParams: function(params) {
    this.storage.authParams = this.encrypt(params);

    if (this._remember)
      localStorage.setItem('QM.session', JSON.stringify(this.storage));
  },

  getStorage: function() {
    this.storage = JSON.parse(localStorage.getItem('QM.session'));
    this._remember = true;
  },

  update: function(token) {
    this.storage.token = token;
    this.storage.expirationTime = null;
  },

  destroy: function() {
    this.storage = {};
    this._remember = false;
    localStorage.removeItem('QM.session');
    localStorage.removeItem('QM.user');
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
