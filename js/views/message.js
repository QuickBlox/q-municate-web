/*
 * Q-municate chat application
 *
 * Message View Module
 *
 */

module.exports = MessageView;

var User, Message, ContactList;
var self;

function MessageView(app) {
  this.app = app;
  User = this.app.models.User;
  Message = this.app.models.Message;
  ContactList = this.app.models.ContactList;
  self = this;
}

MessageView.prototype = {

  addItem: function(message, isCallback, isMessageListener) {
    var DialogView = this.app.views.Dialog,
        contacts = ContactList.contacts,
        contact = message.sender_id === User.contact.id ? User.contact : contacts[message.sender_id],
        type = message.notification_type || 'message',
        chat = $('.l-chat[data-dialog="'+message.dialog_id+'"]'),
        html;

    switch (type) {
    case '3':
      html = '<article class="message message_service l-flexbox" data-id="'+message.sender_id+'" data-type="'+type+'">';
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
      html = '<article class="message message_service l-flexbox" data-id="'+message.sender_id+'" data-type="'+type+'">';
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
      html = '<article class="message message_service l-flexbox" data-id="'+message.sender_id+'" data-type="'+type+'">';
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
      if (message.sender_id === User.contact.id)
        html = '<article class="message is-own l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
      else
        html = '<article class="message l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';

      html += '<img class="message-avatar avatar contact-avatar_message" src="'+contact.avatar_url+'" alt="avatar">';
      html += '<div class="message-container-wrap">';
      html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
      html += '<div class="message-content">';
      html += '<h4 class="message-author">'+contact.full_name+'</h4>';
      html += '<div class="message-body">'+parser(message.body)+'</div>';
      html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
      html += '</div></div></article>';
      break;
    }

    // <div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">
    //                   <div class="message-content">
    //                     <div class="message-body">
    //                       <div class="preview preview-photo"><img src="images/test.jpg" alt="attach"></div>
    //                     </div>
    //                   </div>
    //                   <time class="message-time">30/05/2014</time>
    //                 </div>

    if (isCallback) {
      if (isMessageListener) {
        chat.find('.l-chat-content .mCSB_container').append(html);
        
        // fix for custom scroll
        fixScroll(chat);
      } else {
        chat.find('.l-chat-content .mCSB_container').prepend(html);
      }
    } else {
      chat.find('.l-chat-content').prepend(html);
    }
    
  },

  sendMessage: function(form) {
    var jid = form.parents('.l-chat').data('jid'),
        id = form.parents('.l-chat').data('id'),
        dialog_id = form.parents('.l-chat').data('dialog'),
        val = form.find('textarea').val().trim(),
        time = Math.floor(Date.now() / 1000),
        dialogItem = $('.dialog-item[data-id="'+id+'"]'),
        copyDialogItem;

    if (val.length > 0) {
      form[0].reset();
      // form.find('textarea').blur();
      
      // send message
      QB.chat.send(jid, {type: 'chat', body: val, extension: {
        save_to_history: 1,
        dialog_id: dialog_id,
        date_sent: time,

        full_name: User.contact.full_name,
        avatar_url: User.contact.avatar_url
      }});

      message = Message.create({
        chat_dialog_id: dialog_id,
        body: val,
        date_sent: time,
        sender_id: User.contact.id
      });
      if (QMCONFIG.debug) console.log(message);
      self.addItem(message, true, true);


      if (dialogItem.length > 0) {
        copyDialogItem = dialogItem.clone();
        dialogItem.remove();
        $('#recentList ul').prepend(copyDialogItem);
        isSectionEmpty($('#recentList ul'));
      }
    }
  },

  onMessage: function(id, message) {
    var hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
        notification_type = message.extension && message.extension.notification_type,
        dialog_id = message.extension && message.extension.dialog_id,
        dialogItem = $('.dialog-item[data-id="'+id+'"]'),
        unread = parseInt(dialogItem.find('.unread').text().length > 0 ? dialogItem.find('.unread').text() : 0),
        msg, copyDialogItem;

    msg = Message.create(message);
    Message.update(msg.id, dialog_id);
    msg.sender_id = id;
    if (QMCONFIG.debug) console.log(msg);
    self.addItem(msg, true, true);
    
    if (!$('.l-chat[data-id="'+id+'"]').is(':visible')) {
      unread++;
      dialogItem.find('.unread').text(unread);
    }

    if (dialogItem.length > 0) {
      copyDialogItem = dialogItem.clone();
      dialogItem.remove();
      $('#recentList ul').prepend(copyDialogItem);
      isSectionEmpty($('#recentList ul'));
    }

    // subscribe message
    if (notification_type === '3') {
      // update hidden dialogs
      hiddenDialogs[id] = dialog_id;
      ContactList.saveHiddenDialogs(hiddenDialogs);
    }
  }

};

/* Private
---------------------------------------------------------------------- */
function fixScroll(chat) {
  var containerHeight = chat.find('.l-chat-content .mCSB_container').height(),
      chatContentHeight = chat.find('.l-chat-content').height(),
      draggerContainerHeight = chat.find('.l-chat-content .mCSB_draggerContainer').height(),
      draggerHeight = chat.find('.l-chat-content .mCSB_dragger').height();

  chat.find('.l-chat-content .mCSB_container').css({top: chatContentHeight - containerHeight + 'px'});
  chat.find('.l-chat-content .mCSB_dragger').css({top: draggerContainerHeight - draggerHeight + 'px'});
}

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

function parser(str) {
  var url, url_text;
  var URL_REGEXP = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
  
  str = escapeHTML(str);
  
  // parser of paragraphs
  str = ('<p>' + str).replace(/\n\n/g, '<p>').replace(/\n/g, '<br>');
  
  // parser of links
  str = str.replace(URL_REGEXP, function(match) {
    url = (/^[a-z]+:/i).test(match) ? match : 'http://' + match;
    url_text = match;
    return '<a href="' + escapeHTML(url) + '" target="_blank">' + escapeHTML(url_text) + '</a>';
  });
  
  return str;
  
  function escapeHTML(s) {
    return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

function isSectionEmpty(list) {
  if (list.contents().length === 0) {
    list.parent().addClass('is-hidden');
    if ($('#historyList ul').contents().length === 0)
      $('#historyList ul').parent().addClass('is-hidden');

    if ($('#requestsList').is('.is-hidden') &&
        $('#recentList').is('.is-hidden') &&
        $('#historyList').is('.is-hidden')) {
      
      $('#emptyList').removeClass('is-hidden');
    }
  }
}
