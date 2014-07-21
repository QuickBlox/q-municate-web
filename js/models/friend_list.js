/*
 * Q-municate chat application
 *
 * Friend List Module
 *
 */

module.exports = FriendList;

function FriendList(app) {
  this.app = app;
}

FriendList.prototype = {
  
  globalSearch: function(callback) {
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
  },

  getContacts: function(data) {
    var self = this,
        contact;
    
    self.contacts = [];
    data.forEach(function(item) {
      contact = new Contact(item.user);
      self.contacts.push(contact);
    });
  },

  sendSubscribe: function(jid) {
    var user = JSON.parse(localStorage['QM.user']).contact;
    var extension = {
      full_name: user.full_name,
      avatar_url: user.avatar_url
    };
    QBApiCalls.subscriptionPresence({jid: jid, type: 'subscribe', extension: extension});
  },

  sendReject: function(jid) {
    QBApiCalls.subscriptionPresence({jid: jid, type: 'unsubscribed'});
  }

};
