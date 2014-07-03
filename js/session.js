/*
 * Q-municate chat application
 *
 * Session Module
 *
 */

module.exports = Session;

function Session(token, params) {
  this.storage = {
    token: token,
    expirationTime: null,
    authParams: params
  };
}

Session.prototype.setExpirationTime = function() {
  var limitHours = 2,
      d = new Date;

  d.setHours(d.getHours() + limitHours);
  this.storage.expirationTime = d.toISOString();

  localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.setAuthParams = function(params) {
  this.storage.authParams = params;
  localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.destroy = function() {
  this.storage = {};
  localStorage.removeItem('QM.session');
};
