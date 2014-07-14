/*
 * Q-municate chat application
 *
 * Session Model
 *
 */

module.exports = Session;

function Session(token, params, isRemember) {
  this.storage = {
    token: token || null,
    expirationTime: null,
    authParams: params || null
  };

  this._remember = isRemember || false;
}

Session.prototype.setExpirationTime = function() {
  var limitHours = 2,
      d = new Date;

  d.setHours(d.getHours() + limitHours);
  this.storage.expirationTime = d.toISOString();

  if (this._remember)
    localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.setAuthParams = function(params) {
  this.storage.authParams = params;
  if (this._remember)
    localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.getStorage = function() {
  this.storage = JSON.parse(localStorage.getItem('QM.session'));
  this._remember = true;
};

Session.prototype.update = function(token) {
  this.storage.token = token;
  this.storage.expirationTime = null;
};

Session.prototype.destroy = function() {
  this.storage = {};
  this._remember = false;
  localStorage.removeItem('QM.session');
  localStorage.removeItem('QM.user');
};
