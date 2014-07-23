/*
 * Q-municate chat application
 *
 * Friend List Module
 *
 */

module.exports = FriendList;

function FriendList(app) {
  this.app = app;
  this.contacts = getContacts();
}

FriendList.prototype = {

  globalSearch: function(callback) {
    var QBApiCalls = this.app.service,
        val = sessionStorage['QM.search.value'],
        page = sessionStorage['QM.search.page'],
        self = this,
        contacts;
    
    QBApiCalls.getUser({full_name: val, page: page}, function(data) {
      sessionStorage.setItem('QM.search.allPages', Math.ceil(data.total_entries / data.per_page));
      sessionStorage.setItem('QM.search.page', ++page);
      
      contacts = self.getResults(data.items);
      if (QMCONFIG.debug) console.log('Search results', contacts);

      callback(contacts);
    });
  },

  getResults: function(data) {
    var Contact = this.app.models.Contact,
        self = this,
        contacts = [],
        contact;
    
    data.forEach(function(item) {
      contact = Contact.create(item.user);
      contact.subscription = 'none';
      sessionStorage.setItem('QM.contact-' + contact.id, JSON.stringify(contact));
      contacts.push(contact);
    });
    return contacts;
  }

};

/* Private
---------------------------------------------------------------------- */
function getContacts() {
  var contacts = {},
      ids = localStorage['QM.contacts'] && localStorage['QM.contacts'].split(',') || [];

  if (ids.length > 0) {
    for (var i = 0, len = ids.length; i < len; i++) {
      contacts[ids[i]] = JSON.parse(localStorage['QM.contact-' + ids[i]]);
    }
  }

  return contacts;
}
