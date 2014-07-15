/*
 * Q-municate chat application
 *
 * Friendlist Model
 *
 */

var Contact = require('../contacts/ContactModel');

module.exports = Friendlist;

function Friendlist() {
  this.contacts = [];
}

Friendlist.prototype.getContacts = function(items) {
  var contact,
      self = this;
  
  self.contacts = [];
  items.forEach(function(user) {
    contact = new Contact(user.user);
    self.contacts.push(contact);
  });
};
