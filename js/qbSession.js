/*
 * Q-municate chat application
 *
 * QuickBlox Session Module
 *
 */

module.exports = Session;

function Session() {
  this.token = null;
  this.expirationTime = null;
  this.isUserLevel = null;
}

Session.prototype.setSession = function(res) {
  this.token = res.token;
  this.expirationTime = this.setExpirationTime(res.updated_at);
  this.isUserLevel = !!res.user_id;
};

Session.prototype.setExpirationTime = function(date) {
  var d = new Date(date);
  d.setHours(d.getHours() + 2);
  return d.toISOString();
};
