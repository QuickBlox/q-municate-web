/*
 * Q-municate chat application
 *
 * Friend List Module
 *
 */

var Contact = require('../contacts/ContactModel'),
    QBApiCalls = require('../qbApiCalls');

module.exports = Friendlist;

function Friendlist() {
  this.contacts = [];
}

Friendlist.prototype.globalSearch = function(callback) {
  var val = sessionStorage['QM.search.value'],
      page = sessionStorage['QM.search.page'],
      self = this;
  
  QBApiCalls.getUser({full_name: val, page: page}, function(data) {
    sessionStorage.setItem('QM.search.allPages', Math.ceil(data.total_entries / data.per_page));
    sessionStorage.setItem('QM.search.page', ++page);
    
    self.getContacts(data.items);
    if (QMCONFIG.debug) console.log('Search results', self);

    callback();
  });
};

Friendlist.prototype.getContacts = function(data) {
  var self = this,
      contact;
  
  self.contacts = [];
  data.forEach(function(item) {
    contact = new Contact(item.user);
    self.contacts.push(contact);
  });
};

Friendlist.prototype.sendSubscribe = function(jid) {
  var user = JSON.parse(localStorage['QM.user']).contact;
  var extension = {
    full_name: user.full_name,
    avatar_url: user.avatar_url
  };
  QBApiCalls.subscriptionPresence({jid: jid, type: 'subscribe', extension: extension});
};

Friendlist.prototype.sendReject = function(jid) {
  QBApiCalls.subscriptionPresence({jid: jid, type: 'unsubscribed'});
};
