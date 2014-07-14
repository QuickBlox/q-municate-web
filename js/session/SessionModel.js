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
    remember: isRemember || false,
    authParams: params || null
  };
}

Session.prototype.setExpirationTime = function() {
  var limitHours = 2,
      d = new Date;

  d.setHours(d.getHours() + limitHours);
  this.storage.expirationTime = d.toISOString();

  if (this.storage.remember)
    localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.setAuthParams = function(params) {
  this.storage.authParams = params;
  if (this.storage.remember)
    localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.getStorage = function() {
  this.storage = JSON.parse(localStorage.getItem('QM.session'));
};

Session.prototype.destroy = function() {
  this.storage = {};
  localStorage.removeItem('QM.session');
  localStorage.removeItem('QM.user');
};
