/*
 * Q-municate chat application
 *
 * Message View Module
 *
 */

define(['jquery', 'config', 'quickblox', 'underscore', 'minEmoji', 'timeago'],
        function($, QMCONFIG, QB, _, minEmoji) {

  var User, Message, ContactList, Dialog;
  var self;

  function MessageView(app) {
    this.app = app;
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

    addItem: function(message, isCallback, isMessageListener, recipientId) {
      var DialogView = this.app.views.Dialog,
          ContactListMsg = this.app.models.ContactList,
          chat = $('.l-chat[data-dialog="'+message.dialog_id+'"]'),
          i, len, user;

      if (typeof chat[0] === 'undefined' || (!message.notification_type && !message.callType && !message.attachment && !message.body)) return true;

      if (message.sessionID && $('.message[data-session="'+message.sessionID+'"]')[0]) return true;

      this.checkSenderId(message.sender_id, function() {

        var contacts = ContactListMsg.contacts,
            contact = message.sender_id === User.contact.id ? User.contact : contacts[message.sender_id],
            type = message.notification_type || (message.callState && (parseInt(message.callState) + 7).toString()) || 'message',
            attachType = message.attachment && message.attachment['content-type'],
            recipient = contacts[recipientId] || null,
            occupants_names = '',
            occupants_ids,
            html;

        switch (type) {
        case '1':
          occupants_ids = _.without(message.occupants_ids.split(',').map(Number), contact.id);

          for (i = 0, len = occupants_ids.length, user; i < len; i++) {
            user = contacts[occupants_ids[i]] && contacts[occupants_ids[i]].full_name;
            if (user)
              occupants_names = (i + 1) === len ? occupants_names.concat(user) : occupants_names.concat(user).concat(', ');
            else if (occupants_ids[i] === User.contact.id)
              occupants_names = (i + 1) === len ? occupants_names.concat(User.contact.full_name) : occupants_names.concat(User.contact.full_name).concat(', ');
          }

          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';
          html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has added '+occupants_names+' to the group chat</h4>';
          html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '</div></div></article>';
          break;

        case '2':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';
          if (message.occupants_ids) {
            occupants_ids = message.occupants_ids.split(',').map(Number);

            for (i = 0, len = occupants_ids.length, user; i < len; i++) {
              user = contacts[occupants_ids[i]] && contacts[occupants_ids[i]].full_name;
              if (user)
                occupants_names = (i + 1) === len ? occupants_names.concat(user) : occupants_names.concat(user).concat(', ');
              else if (occupants_ids[i] === User.contact.id)
                occupants_names = (i + 1) === len ? occupants_names.concat(User.contact.full_name) : occupants_names.concat(User.contact.full_name).concat(', ');
            }

            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has added '+occupants_names+'</h4>';
          }
          if (message.deleted_id) {
            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has left</h4>';
          }
          if (message.room_name) {
            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has changed the chat name to "'+message.room_name+'"</h4>';
          }
          if (message.room_photo) {
            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has changed the chat picture</h4>';
          }
          html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '</div></div></article>';
          break;

        case '4':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';

          if (message.sender_id === User.contact.id)
            html += '<h4 class="message-author">Your request has been sent</h4>';
          else
            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has sent a request to you</h4>';

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
            html += '<h4 class="message-author">You have accepted a request</h4>';
          else
            html += '<h4 class="message-author">Your request has been accepted</h4>';

          html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '</div></div></article>';
          break;

        case '6':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar contact-avatar_message request-button_cancel">&#10005;</span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';

          if (message.sender_id === User.contact.id)
            html += '<h4 class="message-author">You have rejected a request';
          else
            html += '<h4 class="message-author">Your request has been rejected <button class="btn btn_request_again"><img class="btn-icon btn-icon_request" src="images/icon-request.svg" alt="request">Send Request Again</button></h4>';

          html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '</div></div></article>';
          break;

        case '7':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';

          if (message.sender_id === User.contact.id)
            html += '<h4 class="message-author">You have deleted '+recipient.full_name+' from your contact list';
          else
            html += '<h4 class="message-author">You have been deleted from the contact list <button class="btn btn_request_again btn_request_again_delete"><img class="btn-icon btn-icon_request" src="images/icon-request.svg" alt="request">Send Request Again</button></h4>';
            
          html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '</div></div></article>';
          break;

        // calls messages
        case '8':
          if (message.caller) {
            html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'" data-session="'+message.sessionID+'">';
            if (message.caller === User.contact.id)
              html += '<span class="message-avatar contact-avatar_message request-call '+(message.callType === '1' ? 'request-video_outgoing' : 'request-audio_outgoing')+'"></span>';
            else
              html += '<span class="message-avatar contact-avatar_message request-call '+(message.callType === '1' ? 'request-video_incoming' : 'request-audio_incoming')+'"></span>';
            html += '<div class="message-container-wrap">';
            html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
            html += '<div class="message-content">';

            if (message.caller === User.contact.id)
              html += '<h4 class="message-author">Call to '+contacts[message.callee].full_name+', duration '+message.duration;
            else
              html += '<h4 class="message-author">Call from '+contacts[message.caller].full_name+', duration '+message.duration;
              
            html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
            html += '</div></div></article>';
          }
          break;

        case '9':
          if (message.caller) {
            html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
            if (message.caller === User.contact.id)
              html += '<span class="message-avatar contact-avatar_message request-call '+(message.callType === '1' ? 'request-video_ended' : 'request-audio_ended')+'"></span>';
            else
              html += '<span class="message-avatar contact-avatar_message request-call '+(message.callType === '1' ? 'request-video_missed' : 'request-audio_missed')+'"></span>';
            html += '<div class="message-container-wrap">';
            html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
            html += '<div class="message-content">';

            if (message.caller === User.contact.id)
              html += '<h4 class="message-author">Call to '+contacts[message.callee].full_name+', no answer';
            else
              html += '<h4 class="message-author">Missed call from '+contacts[message.caller].full_name;
              
            html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
            html += '</div></div></article>';
          }
          break;

        case '10':
          if (message.caller) {
            html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
            html += '<span class="message-avatar contact-avatar_message request-call '+(message.callType === '1' ? 'request-video_ended' : 'request-audio_ended')+'"></span>';
            html += '<div class="message-container-wrap">';
            html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
            html += '<div class="message-content">';

            if (message.caller === User.contact.id)
              html += '<h4 class="message-author">Call to '+contacts[message.callee].full_name+', busy';
            else
              html += '<h4 class="message-author">Call from '+contacts[message.caller].full_name+', busy';
              
            html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
            html += '</div></div></article>';
          }
          break;

        case '11':
          if (message.caller) {
            html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
            html += '<span class="message-avatar contact-avatar_message request-call '+(message.callType === '1' ? 'request-video_ended' : 'request-audio_ended')+'"></span>';
            html += '<div class="message-container-wrap">';
            html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
            html += '<div class="message-content">';

            if (message.caller === User.contact.id)
              html += '<h4 class="message-author">'+contacts[message.callee].full_name+' doesn\'t have camera and/or microphone.';
            else
              html += '<h4 class="message-author">Camera and/or microphone wasn\'t found.';
              
            html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';
            html += '</div></div></article>';
          }
          break;

        default:
          if (message.sender_id === User.contact.id)
            html = '<article class="message is-own l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          else
            html = '<article class="message l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';

          // html += '<img class="message-avatar avatar contact-avatar_message" src="'+contact.avatar_url+'" alt="avatar">';
          html += '<div class="message-avatar avatar contact-avatar_message profileUserAvatar" style="background-image:url('+contact.avatar_url+')" data-id="'+message.sender_id+'"></div>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';
          html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span></h4>';

          if (attachType && attachType.indexOf('image') > -1) {

            html += '<div class="message-body">';
            html += '<div class="preview preview-photo" data-url="'+message.attachment.url+'" data-name="'+message.attachment.name+'">';
            html += '<img src="'+message.attachment.url+'" alt="attach">';
            html += '</div></div>';
            html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';

          } else if (attachType && attachType.indexOf('audio') > -1) {

            html += '<div class="message-body">';
            html += message.attachment.name+'<br><br>';
            html += '<audio src="'+message.attachment.url+'" controls></audio>';
            html += '</div>';
            html += '</div><time class="message-time">'+getTime(message.date_sent)+' ';
            html += '<a href="'+message.attachment.url+'" download="'+message.attachment.name+'">Download</a></time>';

          } else if (attachType && attachType.indexOf('video') > -1) {

            html += '<div class="message-body">';
            html += message.attachment.name+'<br><br>';
            html += '<div class="preview preview-video" data-url="'+message.attachment.url+'" data-name="'+message.attachment.name+'"></div>';
            html += '</div>';
            html += '</div><time class="message-time">'+getTime(message.date_sent)+'</time>';

          } else if (attachType) {

            html += '<div class="message-body">';
            html += '<a class="attach-file" href="'+message.attachment.url+'" download="'+message.attachment.name+'">'+message.attachment.name+'</a>';
            html += '<span class="attach-size">'+getFileSize(message.attachment.size)+'</span>';
            html += '</div>';
            html += '</div><time class="message-time">'+getTime(message.date_sent)+' ';
            html += '<a href="'+message.attachment.url+'" download="'+message.attachment.name+'">Download</a></time>';

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
          if (chat.find('.l-chat-content .mCSB_container')[0])
            chat.find('.l-chat-content .mCSB_container').prepend(html);
          else
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
          dialogItem = type === 'groupchat' ? $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]') : $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="'+id+'"]'),
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
          // dialog_id: dialog_id,
          date_sent: time
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

    onMessage: function(id, message, recipientJid, isOfflineStorage) {
      if (message.type === 'error') return true;

      var DialogView = self.app.views.Dialog,
          hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
          dialogs = ContactList.dialogs,
          notification_type = message.extension && message.extension.notification_type,
          dialog_id = message.extension && message.extension.dialog_id,
          room_jid = message.extension && message.extension.room_jid,
          room_name = message.extension && message.extension.room_name,
          room_photo = message.extension && message.extension.room_photo,
          deleted_id = message.extension && message.extension.deleted_id,
          occupants_ids = message.extension && message.extension.occupants_ids && message.extension.occupants_ids.split(',').map(Number),
          dialogItem = message.type === 'groupchat' ? $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]') : $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="'+id+'"]'),
          dialogGroupItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]'),
          chat = message.type === 'groupchat' ? $('.l-chat[data-dialog="'+dialog_id+'"]') : $('.l-chat[data-id="'+id+'"]'),
          unread = parseInt(dialogItem.length > 0 && dialogItem.find('.unread').text().length > 0 ? dialogItem.find('.unread').text() : 0),
          roster = ContactList.roster,
          audioSignal = $('#newMessageSignal')[0],
          recipientId = QB.chat.helpers.getIdFromNode(recipientJid),
          msg, copyDialogItem, dialog, occupant, msgArr;

      msg = Message.create(message);
      msg.sender_id = id;

      if ((!deleted_id || msg.sender_id !== User.contact.id) && chat.is(':visible')) {
        Message.update(msg.id, dialog_id);
      } else if (!chat.is(':visible') && chat.length > 0) {
        msgArr = dialogs[dialog_id].messages || [];
        msgArr.push(msg.id);
        dialogs[dialog_id].messages = msgArr;
      }

      if ((!chat.is(':visible') || !window.isQMAppActive) && dialogItem.length > 0 && notification_type !== '1' && !isOfflineStorage) {
        unread++;
        dialogItem.find('.unread').text(unread);
        DialogView.getUnreadCounter(dialog_id);
      }

      // create new group chat
      if (notification_type === '1' && message.type === 'chat' && dialogGroupItem.length === 0) {
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
          // don't create a duplicate dialog in contact list
          dialogItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog.id+'"]')[0];
          if (dialogItem) return true;

          QB.chat.muc.join(room_jid);

          DialogView.addDialogItem(dialog);
          unread++;
          dialogGroupItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]');
          dialogGroupItem.find('.unread').text(unread);
          DialogView.getUnreadCounter(dialog_id);
        });
      }

      // subscribe message
      if (notification_type === '4') {
        // update hidden dialogs
        hiddenDialogs[id] = dialog_id;
        ContactList.saveHiddenDialogs(hiddenDialogs);
      }

      // add new occupants
      if (notification_type === '2') {
        dialog = ContactList.dialogs[dialog_id];
        if (occupants_ids && msg.sender_id !== User.contact.id) dialog.occupants_ids = dialog.occupants_ids.concat(occupants_ids);
        if (dialog && deleted_id) dialog.occupants_ids = _.compact(dialog.occupants_ids.join().replace(deleted_id, '').split(',')).map(Number);
        if (room_name) dialog.room_name = room_name;
        if (room_photo) dialog.room_photo = room_photo;
        if (dialog) ContactList.dialogs[dialog_id] = dialog;
        
        // add new people
        if (occupants_ids) {
          ContactList.add(dialog.occupants_ids, null, function() {
            var ids = chat.find('.addToGroupChat').data('ids') ? chat.find('.addToGroupChat').data('ids').toString().split(',').map(Number) : [],
                new_ids = _.difference(dialog.occupants_ids, ids),
                contacts = ContactList.contacts,
                new_id;
            
            for (var i = 0, len = new_ids.length; i < len; i++) {
              new_id = new_ids[i];
              if (new_id !== User.contact.id.toString()) {
                occupant = '<a class="occupant l-flexbox_inline presence-listener" data-id="'+new_id+'" href="#">';
                occupant = getStatus(roster[new_id], occupant);
                occupant += '<span class="name name_occupant">'+contacts[new_id].full_name+'</span></a>';
                chat.find('.chat-occupants-wrap .mCSB_container').append(occupant);
              }
            }

            chat.find('.addToGroupChat').data('ids', dialog.occupants_ids);
          });
        }

        // delete occupant
        if (deleted_id && msg.sender_id !== User.contact.id) {
          chat.find('.occupant[data-id="'+id+'"]').remove();
          chat.find('.addToGroupChat').data('ids', dialog.occupants_ids);
        }

        // change name
        if (room_name) {
          chat.find('.name_chat').text(room_name).attr('title', room_name);
          dialogItem.find('.name').text(room_name);
        }

        // change photo
        if (room_photo) {
          chat.find('.avatar_chat').css('background-image', 'url('+room_photo+')');
          dialogItem.find('.avatar').css('background-image', 'url('+room_photo+')');
        }
      }

      if (notification_type !== '1' && dialogItem.length > 0 && !isOfflineStorage) {
        copyDialogItem = dialogItem.clone();
        dialogItem.remove();
        $('#recentList ul').prepend(copyDialogItem);
        if (!$('#searchList').is(':visible')) {
         $('#recentList').removeClass('is-hidden');
         isSectionEmpty($('#recentList ul'));
        }
      }

      // if (QMCONFIG.debug) console.log(msg);
      self.addItem(msg, true, true, recipientId);
      if ((!chat.is(':visible') || !window.isQMAppActive) && (message.type !== 'groupchat' || msg.sender_id !== User.contact.id))
        audioSignal.play();
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
    return size > (1024 * 1024) ? (size / (1024 * 1024)).toFixed(1) + ' MB' : (size / 1024).toFixed(1) + 'KB';
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
        startOfCurrentDay = new Date();

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

  return MessageView;

});
