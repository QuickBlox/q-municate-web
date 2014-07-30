/*
 * Q-municate chat application
 *
 * Message View Module
 *
 */

module.exports = MessageView;

var Message, ContactList;

function MessageView(app) {
  this.app = app;
  Message = this.app.models.Message;
  ContactList = this.app.models.ContactList;
}

MessageView.prototype = {



};
