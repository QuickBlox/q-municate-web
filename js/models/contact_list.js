/*
 * Q-municate chat application
 *
 * Contact List Module
 *
 */

module.exports = ContactList;

function ContactList(app) {
  this.app = app;
  this.contacts = getContacts();
}

ContactList.prototype = {

  saveRoster: function(roster) {
    sessionStorage.setItem('QM.roster', JSON.stringify(roster));
  },

  saveNotConfirmed: function(notConfirmed) {
    localStorage.setItem('QM.notConfirmed', JSON.stringify(notConfirmed));
  },

  saveHiddenDialogs: function(hiddenDialogs) {
    sessionStorage.setItem('QM.hiddenDialogs', JSON.stringify(hiddenDialogs));
  },

  add: function(occupants_ids, callback) {
    var QBApiCalls = this.app.service,
        Contact = this.app.models.Contact,
        contact_ids = Object.keys(this.contacts).map(Number),
        self = this,
        params;

    // TODO: need to make optimization here
    // (for new device the user will be waiting very long time if he has a lot of private dialogs)
    new_ids = [].concat(_.difference(occupants_ids, contact_ids));
    localStorage.setItem('QM.contacts', contact_ids.concat(new_ids).join());

    if (new_ids.length > 0) {
      params = { filter: { field: 'id', param: 'in', value: new_ids } };

      QBApiCalls.listUsers(params, function(users) {
        users.items.forEach(function(qbUser) {
          var user = qbUser.user;
          var contact = Contact.create(user);
          self.contacts[user.id] = contact;
          localStorage.setItem('QM.contact-' + user.id, JSON.stringify(contact));
        });

        if (QMCONFIG.debug) console.log('Contact List is updated', self);
        callback();
      });
      
    } else {
      callback();
    }
  },

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
      contacts.push(contact);
    });
    return contacts;
  }

};

/* Private
---------------------------------------------------------------------- */
// Creation of Contact List from cache
function getContacts() {
  var contacts = {},
      ids = localStorage['QM.contacts'] ? localStorage['QM.contacts'].split(',') : [];

  if (ids.length > 0) {
    for (var i = 0, len = ids.length; i < len; i++) {
      contacts[ids[i]] = JSON.parse(localStorage['QM.contact-' + ids[i]]);
    }
  }

  return contacts;
}
