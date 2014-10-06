/*
 * Q-municate chat application
 *
 * Message View Module
 *
 */

module.exports = MessageView;

var Session, User, Message, ContactList, Dialog;
var self;

function MessageView(app) {
  this.app = app;
  Session = this.app.models.Session;
  User = this.app.models.User;
  Dialog = this.app.models.Dialog;
  Message = this.app.models.Message;
  ContactList = this.app.models.ContactList;
  self = this;
}

MessageView.prototype = {

  // this needs only for group chats: check if user exist in group chat
  checkSenderId: function(senderId, callback) {
    if (senderId !== User.contact.id) {
      ContactList.add([senderId], null, function() {
        callback();
      });
    } else {
      callback();
    }
  },

  addItem: function(message, isCallback, isMessageListener) {
    var DialogView = this.app.views.Dialog,
        ContactListMsg = this.app.models.ContactList,
        chat = $('.l-chat[data-dialog="'+message.dialog_id+'"]');

    if (typeof chat[0] === 'undefined' || (!message.body && !message.notification_type && !message.attachment)) return true;

    this.checkSenderId(message.sender_id, function() {

      var contacts = ContactListMsg.contacts,
          contact = message.sender_id === User.contact.id ? User.contact : contacts[message.sender_id],
          type = message.notification_type || 'message',
          attachType = message.attachment && message.attachment.type,
          html;

      switch (type) {
      case '1':
        html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
        html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
        html += '<div class="message-container-wrap">';
        html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
        html += '<div class="message-content">';
        html += '<h4 class="message-author">'+contact.full_name+' has added '+message.body+' to the group chat</h4>';
        html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
        html += '</div></div></article>';
        break;

      case '2':
        html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
        html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
        html += '<div class="message-container-wrap">';
        html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
        html += '<div class="message-content">';
        html += '<h4 class="message-author">'+contact.full_name+' has added '+message.body+'</h4>';
        html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
        html += '</div></div></article>';
        break;

      case '3':
        html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
        html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
        html += '<div class="message-container-wrap">';
        html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
        html += '<div class="message-content">';

        if (message.sender_id === User.contact.id)
          html += '<h4 class="message-author">Your request has been sent</h4>';
        else
          html += '<h4 class="message-author">'+contact.full_name+' has sent a request to you</h4>';

        html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
        html += '</div></div></article>';
        break;

      case '4':
        html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
        html += '<span class="message-avatar contact-avatar_message request-button_cancel">&#10005;</span>';
        html += '<div class="message-container-wrap">';
        html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
        html += '<div class="message-content">';

        if (message.sender_id === User.contact.id)
          html += '<h4 class="message-author">'+User.contact.full_name+' has rejected a request';
        else
          html += '<h4 class="message-author">Your request has been rejected <button class="btn btn_request_again"><img class="btn-icon btn-icon_request" src="images/icon-request.png" alt="request">Send Request Again</button></h4>';
          

        html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
        html += '</div></div></article>';
        break;

      case '5':
        html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
        html += '<span class="message-avatar contact-avatar_message request-button_ok">&#10003;</span>';
        html += '<div class="message-container-wrap">';
        html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
        html += '<div class="message-content">';

        if (message.sender_id === User.contact.id)
          html += '<h4 class="message-author">'+User.contact.full_name+' has accepted a request</h4>';
        else
          html += '<h4 class="message-author">Your request has been accepted</h4>';

        html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
        html += '</div></div></article>';
        break;

      case '6':
        html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
        html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
        html += '<div class="message-container-wrap">';
        html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
        html += '<div class="message-content">';
        html += '<h4 class="message-author">'+contact.full_name+' has left</h4>';
        html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
        html += '</div></div></article>';
        break;

      default:
        if (message.sender_id === User.contact.id)
          html = '<article class="message is-own l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
        else
          html = '<article class="message l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';

        html += '<img class="message-avatar avatar contact-avatar_message" src="'+contact.avatar_url+'" alt="avatar">';
        html += '<div class="message-container-wrap">';
        html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
        html += '<div class="message-content">';
        html += '<h4 class="message-author">'+contact.full_name+'</h4>';

        if (attachType && attachType.indexOf('image') > -1) {

          html += '<div class="message-body">';
          html += '<div class="preview preview-photo" data-url="'+message.attachment.url+'" data-name="'+message.attachment.name+'" data-uid="'+message.attachment.uid+'">';
          html += '<img src="'+message.attachment.url+'" alt="attach">';
          html += '</div></div>';
          html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';

        } else if (attachType && attachType.indexOf('audio') > -1) {

          html += '<div class="message-body">';
          html += message.attachment.name+'<br><br>';
          html += '<audio src="'+message.attachment.url+'" controls></audio>';
          html += '</div>';
          html += '</div><time class="message-time">'+getTime(message.date_sent)+' ';
          html += '<a href="'+getFileDownloadLink(message.attachment.uid)+'" download>Download</a></time>';

        } else if (attachType && attachType.indexOf('video') > -1) {

          html += '<div class="message-body">';
          html += message.attachment.name+'<br><br>';
          html += '<div class="preview preview-video" data-url="'+message.attachment.url+'" data-name="'+message.attachment.name+'" data-uid="'+message.attachment.uid+'"></div>';
          html += '</div>';
          html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';

        } else if (attachType) {

          html += '<div class="message-body">';
          html += '<a class="attach-file" href="'+getFileDownloadLink(message.attachment.uid)+'" download>'+message.attachment.name+'</a>';
          html += '<span class="attach-size">'+getFileSize(message.attachment.size)+'</span>';
          html += '</div>';
          html += '</div><time class="message-time">'+getTime(message.date_sent)+' ';
          html += '<a href="'+getFileDownloadLink(message.attachment.uid)+'" download>Download</a></time>';

        } else {
          html += '<div class="message-body">'+minEmoji(parser(message.body))+'</div>';
          html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
        }

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

    });
    
  },

  sendMessage: function(form) {
    var jid = form.parents('.l-chat').data('jid'),
        id = form.parents('.l-chat').data('id'),
        dialog_id = form.parents('.l-chat').data('dialog'),
        val = form.find('.textarea').html().trim(),
        time = Math.floor(Date.now() / 1000),
        type = form.parents('.l-chat').is('.is-group') ? 'groupchat' : 'chat',
        dialogItem = type === 'groupchat' ? $('.dialog-item[data-dialog="'+dialog_id+'"]') : $('.dialog-item[data-id="'+id+'"]'),
        copyDialogItem;

    if (val.length > 0) {
      if (form.find('.textarea > span').length > 0) {
        form.find('.textarea > span').each(function() {
          $(this).after($(this).find('span').data('unicode')).remove();
        });
        val = form.find('.textarea').text().trim();
      }
      
      // send message
      QB.chat.send(jid, {type: type, body: val, extension: {
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
      if (type === 'chat') self.addItem(message, true, true);

      if (dialogItem.length > 0) {
        copyDialogItem = dialogItem.clone();
        dialogItem.remove();
        $('#recentList ul').prepend(copyDialogItem);
        if (!$('#searchList').is(':visible')) {
         $('#recentList').removeClass('is-hidden');
         isSectionEmpty($('#recentList ul')); 
        }
      }
    }
  },

  onMessage: function(id, message) {
    if (message.type === 'error') return true;

    var DialogView = self.app.views.Dialog,
        hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
        dialogs = ContactList.dialogs,
        notification_type = message.extension && message.extension.notification_type,
        dialog_id = message.extension && message.extension.dialog_id,
        room_jid = message.extension && message.extension.room_jid,
        room_name = message.extension && message.extension.room_name,
        occupants_ids = message.extension && message.extension.occupants_ids && message.extension.occupants_ids.split(','),
        dialogItem = message.type === 'groupchat' ? $('.dialog-item[data-dialog="'+dialog_id+'"]') : $('.dialog-item[data-id="'+id+'"]'),
        dialogGroupItem = $('.dialog-item[data-dialog="'+dialog_id+'"]'),
        chat = message.type === 'groupchat' ? $('.l-chat[data-dialog="'+dialog_id+'"]') : $('.l-chat[data-id="'+id+'"]'),
        unread = parseInt(dialogItem.length > 0 && dialogItem.find('.unread').text().length > 0 ? dialogItem.find('.unread').text() : 0),
        roster = ContactList.roster,
        msg, copyDialogItem, dialog, occupant, msgArr;

    msg = Message.create(message);
    msg.sender_id = id;

    if ((notification_type !== '6' || msg.sender_id !== User.contact.id) && chat.is(':visible'))
      Message.update(msg.id, dialog_id);
    else if (!chat.is(':visible') && chat.length > 0) {
      msgArr = dialogs[dialog_id].messages || [];
      msgArr.push(msg.id);
      dialogs[dialog_id].messages = msgArr;
      console.log(self.app.models.ContactList.dialogs[dialog_id]);
    }

    if (!chat.is(':visible') && dialogItem.length > 0 && notification_type !== '1') {
      unread++;
      dialogItem.find('.unread').text(unread);
    }

    if (notification_type !== '1' && dialogItem.length > 0) {
      copyDialogItem = dialogItem.clone();
      dialogItem.remove();
      $('#recentList ul').prepend(copyDialogItem);
      $('#recentList').removeClass('is-hidden');
      isSectionEmpty($('#recentList ul'));
    }

    // create new group chat
    if (notification_type === '1' && message.type === 'chat' && dialogGroupItem.length === 0) {
      QB.chat.muc.join(room_jid);

      dialog = Dialog.create({
        _id: dialog_id,
        type: 2,
        occupants_ids: occupants_ids,
        name: room_name,
        xmpp_room_jid: room_jid,
        unread_count: 1
      });
      ContactList.dialogs[dialog.id] = dialog;
      if (QMCONFIG.debug) console.log('Dialog', dialog);
      if (!localStorage['QM.dialog-' + dialog.id]) {
        localStorage.setItem('QM.dialog-' + dialog.id, JSON.stringify({ messages: [] }));
      }

      ContactList.add(dialog.occupants_ids, null, function() {
        DialogView.addDialogItem(dialog);
      });
    }

    // subscribe message
    if (notification_type === '3') {
      // update hidden dialogs
      hiddenDialogs[id] = dialog_id;
      ContactList.saveHiddenDialogs(hiddenDialogs);
    }

    // delete occupant
    if (notification_type === '6') {
      chat.find('.occupant[data-id="'+id+'"]').remove();
    }

    // add new occupants
    if (notification_type === '2') {
      dialog = ContactList.dialogs[dialog_id];
      dialog.occupants_ids = occupants_ids;
      ContactList.dialogs[dialog_id] = dialog;
      
      ContactList.add(dialog.occupants_ids, null, function() {
        var ids = chat.find('.addToGroupChat').data('ids') ? chat.find('.addToGroupChat').data('ids').toString().split(',') : [],
            new_ids = _.difference(dialog.occupants_ids, ids),
            contacts = ContactList.contacts,
            new_id;

        for (var i = 0, len = new_ids.length; i < len; i++) {
          new_id = new_ids[i];
          occupant = '<a class="occupant l-flexbox_inline presence-listener" data-id="'+new_id+'" href="#">';
          occupant = getStatus(roster[new_id], occupant);
          occupant += '<span class="name name_occupant">'+contacts[new_id].full_name+'</span></a>';
          chat.find('.chat-occupants-wrap .mCSB_container').append(occupant);
        }

        chat.find('.addToGroupChat').data('ids', dialog.occupants_ids);
      });
    }

    if (QMCONFIG.debug) console.log(msg);
    self.addItem(msg, true, true);
  }

};

/* Private
---------------------------------------------------------------------- */
function getStatus(status, html) {
  if (!status || status.subscription === 'none')
    html += '<span class="status status_request"></span>';
  else if (status && status.status)
    html += '<span class="status status_online"></span>';
  else
    html += '<span class="status"></span>';

  return html;
}

function getFileSize(size) {
  return size > (1024 * 1024) ? (size / (1024 * 1024)).toFixed(1) + ' Mb' : (size / 1024).toFixed(1) + 'Kb';
}

function getFileDownloadLink(uid) {
  return 'https://api.quickblox.com/blobs/'+uid+'?token='+Session.token;
}

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
  str = str.replace(/\n/g, '<br>');
  
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
  if (list.contents().length === 0)
    list.parent().addClass('is-hidden');

  if ($('#historyList ul').contents().length === 0)
      $('#historyList ul').parent().addClass('is-hidden');

  if ($('#requestsList').is('.is-hidden') &&
      $('#recentList').is('.is-hidden') &&
      $('#historyList').is('.is-hidden')) {
    
    $('#emptyList').removeClass('is-hidden');
  }
}
