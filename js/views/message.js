/*
 * Q-municate chat application
 *
 * Message View Module
 *
 */

module.exports = MessageView;

var User, Message, ContactList;

function MessageView(app) {
  this.app = app;
  User = this.app.models.User;
  Message = this.app.models.Message;
  ContactList = this.app.models.ContactList;
}

MessageView.prototype = {

  addItem: function(message, isCallback) {
    var contacts = ContactList.contacts,
        contact = contacts[message.sender_id],
        type = message.notification_type || 'message',
        chat = $('.l-chat[data-dialog="'+message.dialog_id+'"]'),
        html;

    switch (type) {
    case '3':
      html = '<article class="message message_service l-flexbox">';
      html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
      html += '<div class="message-container-wrap">';
      html += '<div class="message-container l-flexbox l-flexbox_flexbetween">';
      html += '<div class="message-content">';

      if (message.sender_id === User.contact.id)
        html += '<h4 class="message-author">Your request has been sent</h4>';
      else
        html += '<h4 class="message-author">'+contact.full_name+' has sent a request to you</h4>';

      html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
      html += '</div></div></article>';
      break;

    case '4':
      html = '<article class="message message_service l-flexbox">';
      html += '<span class="message-avatar contact-avatar_message request-button_cancel">&#10005;</span>';
      html += '<div class="message-container-wrap">';
      html += '<div class="message-container l-flexbox l-flexbox_flexbetween">';
      html += '<div class="message-content">';

      if (message.sender_id === User.contact.id)
        html += '<h4 class="message-author">'+User.contact.full_name+' has rejected a request';
      else
        html += '<h4 class="message-author">Your request has been rejected <button class="btn btn_request_again"><img class="btn-icon btn-icon_request" src="images/icon-request.png" alt="request">Send Request Again</button></h4>';
        

      html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
      html += '</div></div></article>';
      break;

    case '5':
      html = '<article class="message message_service l-flexbox">';
      html += '<span class="message-avatar contact-avatar_message request-button_ok">&#10003;</span>';
      html += '<div class="message-container-wrap">';
      html += '<div class="message-container l-flexbox l-flexbox_flexbetween">';
      html += '<div class="message-content">';

      if (message.sender_id === User.contact.id)
        html += '<h4 class="message-author">'+User.contact.full_name+' has accepted a request</h4>';
      else
        html += '<h4 class="message-author">Your request has been accepted</h4>';

      html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
      html += '</div></div></article>';
      break;

    case 'message':
      break;
    }

    if (isCallback)
      chat.find('.l-chat-content .mCSB_container').prepend(html);
    else
      chat.find('.l-chat-content').prepend(html);
    
  }

};

/* Private
---------------------------------------------------------------------- */
function getTime(time) {
  var messageDate = new Date(time * 1000),
      startOfCurrentDay = new Date;

  startOfCurrentDay.setHours(0,0,0,0);

  if (messageDate > startOfCurrentDay) {
    return messageDate.getHours() + ':' + (messageDate.getMinutes().toString().length === 1 ? '0'+messageDate.getMinutes() : messageDate.getMinutes());
  } else if (messageDate.getFullYear() === startOfCurrentDay.getFullYear()) {
    return $.timeago(messageDate);
  } else {
    return messageDate.getDate() + '/' + (messageDate.getMonth() + 1) + '/' + messageDate.getFullYear();
  }
}
