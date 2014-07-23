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

  add: function(callback) {
    var Contact = this.app.models.Contact;

    contact_ids = localStorage['QM.contacts'] && localStorage['QM.contacts'].split(',') || [];
    ids.concat(_.difference(dialog.occupants_ids, contact_ids));
    localStorage.setItem('QM.contacts', contact_ids.concat(ids).join());

    if (ids.length > 0) {
      params = { filter: { field: 'id', param: 'in', value: ids } };
      QBApiCalls.listUsers(params, function(users) {
        users.items.forEach(function(user) {
          ContactList[user.id] = Contact.create(user);
          ContactList[user.id].subscription = contacts[user.id] || 'none';
          localStorage.setItem('QM.contact-' + user.id, JSON.stringify(ContactList[user.id]));
        });
      });

      if (QMCONFIG.debug) console.log('Contact List is updated', this);
      callback();
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
