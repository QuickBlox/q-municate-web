/*
 * Q-municate chat application
 *
 * Message View Module
 *
 */

define(['jquery', 'config', 'quickblox', 'underscore', 'minEmoji', 'Helpers', 'timeago', 'QBNotification', 'LocationView', 'QMHtml'],
        function($, QMCONFIG, QB, _, minEmoji, Helpers, timeago, QBNotification, Location, QMHtml) {

  var User, Message, ContactList, Dialog;
  var clearTyping, typingList = []; // for typing statuses
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
          $chat = $('.l-chat[data-dialog="'+message.dialog_id+'"]'),
          isBottom = Helpers.isBeginOfChat();

      if (typeof $chat[0] === 'undefined' || (!message.notification_type && !message.callType && !message.attachment && !message.body)) return true;

      if (message.sessionID && $('.message[data-session="'+message.sessionID+'"]')[0]) return true;

      this.checkSenderId(message.sender_id, function() {

        var contacts = ContactListMsg.contacts,
            contact = message.sender_id === User.contact.id ? User.contact : contacts[message.sender_id],
            type = message.notification_type || (message.callState && (parseInt(message.callState) + 7).toString()) || 'message',
            attachType = message.attachment && message.attachment['content-type'] || message.attachment && message.attachment.type || null,
            attachUrl = message.attachment && (QB.content.privateUrl(message.attachment.id) || message.attachment.url || null),
            geolocation = (message.latitude && message.longitude) ? {'latitude': message.latitude, 'longitude': message.longitude} : null,
            geoCoords = (message.attachment && message.attachment.type === 'location') ? {'latitude': message.attachment.lat, 'longitude': message.attachment.lng} : null,
            mapAttachImage = geoCoords ? Location.getStaticMapUrl(geoCoords, {'size': [380, 200]}) : null,
            mapAttachLink = geoCoords ? Location.getMapUrl(geoCoords) : null,
            recipient = contacts[recipientId] || null,
            occupants_names = '',
            occupants_ids,
            html;

        switch (type) {
        case '1':
          occupants_ids = _.without(message.current_occupant_ids.split(',').map(Number), contact.id);
          occupants_names = Helpers.Messages.getOccupantsNames(occupants_ids, User, contacts);

          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';
          html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has added '+occupants_names+' to the group chat</h4>';
          html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '<div class="info_indent"></div></div></div></div></article>';
          break;

        case '2':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';

          if (message.added_occupant_ids) {
            occupants_ids = message.added_occupant_ids.split(',').map(Number);
            occupants_names = Helpers.Messages.getOccupantsNames(occupants_ids, User, contacts);

            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has added '+occupants_names+'</h4>';
          }

          if (message.deleted_occupant_ids) {
            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has left</h4>';
          }

          if (message.room_name) {
            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has changed the chat name to "'+message.room_name+'"</h4>';
          }

          if (message.room_photo) {
            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has changed the chat picture</h4>';
          }

          html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '<div class="info_indent"></div></div></div></div></article>';
          break;

        case '4':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';

          if (message.sender_id === User.contact.id) {
            html += '<h4 class="message-author">Your request has been sent</h4>';
          } else {
            html += '<h4 class="message-author"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span> has sent a request to you</h4>';
          }

          html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '<div class="info_indent"></div></div></div></div></article>';
          break;

        case '5':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar request-button_ok">&#10003;</span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';

          if (message.sender_id === User.contact.id) {
            html += '<h4 class="message-author">You have accepted a request</h4>';
          } else {
            html += '<h4 class="message-author">Your request has been accepted</h4>';
          }

          html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '<div class="info_indent"></div></div></div></div></article>';
          break;

        case '6':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar request-button_cancel">&#10005;</span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';

          if (message.sender_id === User.contact.id) {
            html += '<h4 class="message-author">You have rejected a request';
          } else {
            html += '<h4 class="message-author">Your request has been rejected <button class="btn btn_request_again"><img class="btn-icon btn-icon_request" src="images/icon-request.svg" alt="request">Send Request Again</button></h4>';
          }

          html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '<div class="info_indent"></div></div></div></div></article>';
          break;

        case '7':
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          html += '<span class="message-avatar request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';

          if (message.sender_id === User.contact.id) {
            html += '<h4 class="message-author">You have deleted '+recipient.full_name+' from your contact list';
          } else {
            html += '<h4 class="message-author">You have been deleted from the contact list <button class="btn btn_request_again btn_request_again_delete"><img class="btn-icon btn-icon_request" src="images/icon-request.svg" alt="request">Send Request Again</button></h4>';
          }

          html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
          html += '<div class="info_indent"></div></div></div></div></article>';
          break;

        // calls messages
        case '8':
          if (message.caller) {
            html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'" data-session="'+message.sessionID+'">';

            if (message.caller === User.contact.id) {
              html += '<span class="message-avatar request-call '+(message.callType === '1' ? 'request-video_outgoing' : 'request-audio_outgoing')+'"></span>';
            } else {
              html += '<span class="message-avatar request-call '+(message.callType === '1' ? 'request-video_incoming' : 'request-audio_incoming')+'"></span>';
            }

            html += '<div class="message-container-wrap">';
            html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
            html += '<div class="message-content">';

            if (message.caller === User.contact.id) {
              html += '<h4 class="message-author">Call to '+contacts[message.callee].full_name+', duration '+message.duration;
            } else {
              html += '<h4 class="message-author">Call from '+contacts[message.caller].full_name+', duration '+message.duration;
            }

            html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
            html += '<div class="info_indent"></div></div></div></div></article>';
          }
          break;

        case '9':
          if (message.caller) {
            html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';

            if (message.caller === User.contact.id) {
              html += '<span class="message-avatar request-call '+(message.callType === '1' ? 'request-video_ended' : 'request-audio_ended')+'"></span>';
            } else {
              html += '<span class="message-avatar request-call '+(message.callType === '1' ? 'request-video_missed' : 'request-audio_missed')+'"></span>';
            }

            html += '<div class="message-container-wrap">';
            html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
            html += '<div class="message-content">';

            if (message.caller === User.contact.id) {
              html += '<h4 class="message-author">Call to '+contacts[message.callee].full_name+', no answer';
            } else {
              html += '<h4 class="message-author">Missed call from '+contacts[message.caller].full_name;
            }

            html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
            html += '<div class="info_indent"></div></div></div></div></article>';
          }
          break;

        case '10':
          if (message.caller) {
            html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
            html += '<span class="message-avatar request-call '+(message.callType === '1' ? 'request-video_ended' : 'request-audio_ended')+'"></span>';
            html += '<div class="message-container-wrap">';
            html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
            html += '<div class="message-content">';

            if (message.caller === User.contact.id) {
              html += '<h4 class="message-author">Call to '+contacts[message.callee].full_name+', busy';
            } else {
              html += '<h4 class="message-author">Call from '+contacts[message.caller].full_name+', busy';
            }

            html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
            html += '<div class="info_indent"></div></div></div></div></article>';
          }
          break;

        case '11':
          if (message.caller) {
            html = '<article class="message message_service l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
            html += '<span class="message-avatar request-call '+(message.callType === '1' ? 'request-video_ended' : 'request-audio_ended')+'"></span>';
            html += '<div class="message-container-wrap">';
            html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
            html += '<div class="message-content">';

            if (message.caller === User.contact.id) {
              html += '<h4 class="message-author">'+contacts[message.callee].full_name+' doesn\'t have camera and/or microphone.';
            } else {
              html += '<h4 class="message-author">Camera and/or microphone wasn\'t found.';
            }

            html += '</div><div class="message-info"><time class="message-time">'+getTime(message.date_sent)+'</time>';
            html += '<div class="info_indent"></div></div></div></div></article>';
          }
          break;

        default:
          if (message.sender_id === User.contact.id) {
            html = '<article id="'+message.id+'" class="message is-own l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          } else {
            html = '<article id="'+message.id+'" class="message l-flexbox l-flexbox_alignstretch" data-id="'+message.sender_id+'" data-type="'+type+'">';
          }

          html += '<div class="message-avatar avatar profileUserAvatar'+(message.stack ? ' is-hidden' : '')+
                  '" style="background-image:url('+contact.avatar_url+')" data-id="'+message.sender_id+'"></div>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content'+(message.stack ? ' indent' : '')+'">';
          html += '<h4 class="message-author'+(message.stack ? ' is-hidden' : '')+'"><span class="profileUserName" data-id="'+message.sender_id+'">'+contact.full_name+'</span></h4>';

          if (attachType && attachType.indexOf('image') > -1) {
            html += '<div class="message-body">';
            html += '<div class="preview preview-photo" data-url="'+attachUrl+'" data-name="'+message.attachment.name+'">';
            html += '<img id="attach_'+message.id+'" src="'+attachUrl+'" alt="attach">';
            html += '</div></div>';
            html += '</div><div class="message-info"><time class="message-time" data-time="'+message.date_sent+'">'+getTime(message.date_sent)+'</time>';
            html += '<div class="message-status is-hidden">Not delivered yet</div>';
            html += '<div class="message-geo j-showlocation"></div></div>';
          } else if (attachType && attachType.indexOf('audio') > -1) {
            html += '<div class="message-body">';
            html += message.attachment.name+'<br><br>';
            html += '<audio id="'+message.id+'" src="'+attachUrl+'" controls></audio>';
            html += '</div>';
            html += '</div><time class="message-time" data-time="'+message.date_sent+'">'+getTime(message.date_sent)+' ';
            html += '<a href="'+attachUrl+'" download="'+message.attachment.name+'">Download</a></time>';
          } else if (attachType && attachType.indexOf('video') > -1) {
            html += '<div class="message-body">';
            html += message.attachment.name+'<br><br>';
            html += '<div id="'+message.id+'" class="preview preview-video" data-url="'+attachUrl+'" data-name="'+message.attachment.name+'"></div>';
            html += '</div>';
            html += '</div><div class="message-info"><time class="message-time" data-time="'+message.date_sent+'">'+getTime(message.date_sent)+'</time>';
            html += '<div class="message-status is-hidden">Not delivered yet</div>';
            html += '<div class="message-geo j-showlocation"></div></div>';
          } else if (attachType && attachType.indexOf('location') > -1) {
            html += '<div class="message-body">';
            html += '<a class="open_googlemaps" href="'+mapAttachLink+'" target="_blank">';
            html += '<img id="attach_'+message.id+'" src="'+mapAttachImage+'" alt="attach" class="attach_map">';
            html += '</a></div>';
            html += '</div><div class="message-info"><time class="message-time" data-time="'+message.date_sent+'">'+getTime(message.date_sent)+'</time>';
            html += '<div class="message-status is-hidden">Not delivered yet</div>';
            html += '<div class="message-geo j-showlocation"></div></div>';
          } else if (attachType) {
            html += '<div class="message-body">';
            html += '<a id="'+message.id+'" class="attach-file" href="'+attachUrl+'" download="'+message.attachment.name+'">'+message.attachment.name+'</a>';
            html += '<span class="attach-size">'+getFileSize(message.attachment.size)+'</span>';
            html += '</div>';
            html += '</div><time class="message-time" data-time="'+message.date_sent+'">'+getTime(message.date_sent)+' ';
            html += '<a href="'+attachUrl+'" download="'+message.attachment.name+'">Download</a></time>';
          } else {
            html += '<div class="message-body">'+minEmoji(parser(message.body))+'</div>';
            html += '</div><div class="message-info"><time class="message-time" data-time="'+message.date_sent+'">'+getTime(message.date_sent)+'</time>';
            html += '<div class="message-status is-hidden">Not delivered yet</div>';
            html += '<div class="message-geo j-showlocation"></div></div>';
          }

          html += '</div></div></article>';
          break;
        }

        if (isCallback) {
          if (isMessageListener) {
            $chat.find('.l-chat-content .mCSB_container').append(html);
            if (isBottom) {
              smartScroll(message.id, attachType);
            }
          } else {
            $chat.find('.l-chat-content .mCSB_container').prepend(html);
          }
        } else {
          if ($chat.find('.l-chat-content .mCSB_container')[0]) {
            $chat.find('.l-chat-content .mCSB_container').prepend(html);
          } else {
            $chat.find('.l-chat-content').prepend(html);
          }
          smartScroll(message.id, attachType);
        }

        if (geolocation) {
          var mapLink = Location.getMapUrl(geolocation),
              imgUrl = Location.getStaticMapUrl(geolocation);

          QMHtml.message.setMap({
            id: message.id,
            mapLink: mapLink,
            imgUrl: imgUrl
          });
        }

        if (message.sender_id == User.contact.id && message.delivered_ids.length > 0) {
          self.addStatusMessages(message.id, message.dialog_id, 'delivered', false);
        }
        if (message.sender_id == User.contact.id && message.read_ids.length > 1) {
          self.addStatusMessages(message.id, message.dialog_id, 'displayed', false);
        }

      });

    },

    addStatusMessages: function(messageId, dialogId, messageStatus, isListener) {
      var DialogView = this.app.views.Dialog,
          ContactListMsg = this.app.models.ContactList,
          $chat = $('.l-chat[data-dialog="'+dialogId+'"]'),
          time = $chat.find('article#'+messageId+' .message-container-wrap .message-container .message-time'),
          statusHtml = $chat.find('article#'+messageId+' .message-container-wrap .message-container .message-status');

      if (messageStatus === 'displayed') {
        statusHtml.hasClass('delivered') ? statusHtml.removeClass('delivered').addClass('displayed').html('Seen') : statusHtml.addClass('displayed').html('Seen');
      } else if (statusHtml.hasClass('displayed') && messageStatus === 'delivered') {
        return true;
      } else {
        statusHtml.hasClass('delivered') ? statusHtml.html('Delivered') : statusHtml.addClass('delivered').html('Delivered');
      }

      if (isListener) {
        setTimeout(function() {
          time.removeClass('is-hidden');
          statusHtml.addClass('is-hidden');
        }, 1000);
        time.addClass('is-hidden');

        statusHtml.removeClass('is-hidden');
      }
    },

    sendMessage: function(form) {
      var jid = form.parents('.l-chat').data('jid'),
          id = form.parents('.l-chat').data('id'),
          dialog_id = form.parents('.l-chat').data('dialog'),
          val = form.find('.textarea').html().trim(),
          time = Math.floor(Date.now() / 1000),
          type = form.parents('.l-chat').is('.is-group') ? 'groupchat' : 'chat',
          $chat = $('.l-chat[data-dialog="'+dialog_id+'"]'),
          dialogItem = (type === 'groupchat') ? $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]') : $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="'+id+'"]'),
          locationIsActive = ($('.j-send_location').hasClass('btn_active') && localStorage['QM.latitude'] && localStorage['QM.longitude']),
          copyDialogItem,
          lastMessage,
          message,
          msg;

      if (val.length > 0) {
        if (form.find('.textarea > span').length > 0) {
          form.find('.textarea > span').each(function() {
            $(this).after($(this).find('span').data('unicode')).remove();
          });
          val = form.find('.textarea').html().trim();
        }
        if (form.find('.textarea > div').length > 0) {
          val = form.find('.textarea').text().trim();
        }
        val = val.replace(/<br>/gi, '\n');

        // send message
        msg = {
          'type': type,
          'body': val,
          'extension': {
            'save_to_history': 1,
            'dialog_id': dialog_id,
            'date_sent': time
          },
          'markable': 1
        };

        if(locationIsActive) {
          msg.extension.latitude = localStorage['QM.latitude'];
          msg.extension.longitude = localStorage['QM.longitude'];
        }

        QB.chat.send(jid, msg);

        message = Message.create({
          'chat_dialog_id': dialog_id,
          'body': val,
          'date_sent': time,
          'sender_id': User.contact.id,
          'latitude': localStorage['QM.latitude'] || null,
          'longitude': localStorage['QM.longitude'] || null,
          '_id': msg.id
        });

        Helpers.log('Message send:', message);

        if (type === 'chat') {
          lastMessage = $chat.find('article[data-type="message"]').last();
          message.stack = Message.isStack(true, message, lastMessage);
          self.addItem(message, true, true);
        }

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

    // send start or stop typing status to chat or groupchat
    sendTypingStatus: function(jid, start) {
      var roomJid = QB.chat.helpers.getRoomJid(jid),
          xmppRoomJid = roomJid.split('/')[0];

      start ? QB.chat.sendIsTypingStatus(xmppRoomJid) : QB.chat.sendIsStopTypingStatus(xmppRoomJid);
    },

    // claer the list typing when switch to another chat
    clearTheListTyping: function() {
      $('.j-typing').empty();
      typingList = [];
    },

    onMessage: function(id, message) {
      if (message.type === 'error') return true;
      var DialogView = self.app.views.Dialog,
          hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
          dialogs = ContactList.dialogs,
          contacts = ContactList.contacts,
          notification_type = message.extension && message.extension.notification_type,
          dialog_id = message.extension && message.extension.dialog_id,
          room_jid = roomJidVerification(dialog_id),
          room_name = message.extension && message.extension.room_name,
          room_photo = message.extension && message.extension.room_photo,
          deleted_id = message.extension && message.extension.deleted_occupant_ids,
          new_ids = message.extension && message.extension.added_occupant_ids,
          occupants_ids = message.extension && message.extension.current_occupant_ids,
          dialogItem = message.type === 'groupchat' ? $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]') : $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="'+id+'"]'),
          dialogGroupItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]'),
          $chat = message.type === 'groupchat' ? $('.l-chat[data-dialog="'+dialog_id+'"]') : $('.l-chat[data-id="'+id+'"]'),
          isHiddenChat = $chat.is(':hidden'),
          unread = parseInt(dialogItem.length > 0 && dialogItem.find('.unread').text().length > 0 ? dialogItem.find('.unread').text() : 0),
          roster = ContactList.roster,
          audioSignal = $('#newMessageSignal')[0],
          isOfflineStorage = message.delay,
          selected = $('[data-dialog = '+dialog_id+']').is('.is-selected'),
          isBottom = Helpers.isBeginOfChat(),
          otherChat = !selected && isHiddenChat && dialogItem.length > 0 && notification_type !== '1' && (!isOfflineStorage || message.type === 'groupchat'),
          isNotMyUser = id !== User.contact.id,
          copyDialogItem,
          lastMessage,
          dialog,
          occupant,
          msgArr,
          blobObj,
          msg;

      typeof new_ids === "string" ? new_ids = new_ids.split(',').map(Number) : null;
      typeof deleted_id === "string" ? deleted_id = deleted_id.split(',').map(Number) : null;
      typeof occupants_ids === "string" ? occupants_ids = occupants_ids.split(',').map(Number) : null;

      msg = Message.create(message);
      msg.sender_id = id;

      if (message.markable === 1 && !isHiddenChat && window.isQMAppActive && msg.sender_id !== User.contact.id) {
        // send read status if message displayed in chat
        Message.update(msg.id, dialog_id, id);
      } else if ((isHiddenChat || !window.isQMAppActive) && $chat.length > 0 && message.markable == 1) {
        msgArr = dialogs[dialog_id].messages || [];
        msgArr.push(msg.id);
        dialogs[dialog_id].messages = msgArr;
      }

      if (otherChat || (!otherChat && !isBottom && isNotMyUser)) {
        unread++;
        dialogItem.find('.unread').text(unread);
        DialogView.getUnreadCounter(dialog_id);
      }

      // add new occupants
      if (notification_type === '2') {
        dialog = ContactList.dialogs[dialog_id];

        if (occupants_ids && msg.sender_id !== User.contact.id) {
          dialog.occupants_ids = dialog.occupants_ids.concat(new_ids);
        }
        if (dialog && deleted_id) {
          dialog.occupants_ids = _.without(_.compact(dialog.occupants_ids), deleted_id[0]);
        }
        if (room_name) {
          dialog.room_name = room_name;
        }
        if (room_photo) {
          dialog.room_photo = room_photo;
        }
        if (dialog) {
          ContactList.dialogs[dialog_id] = dialog;
        }

        // add new people
        if (new_ids) {
          ContactList.add(dialog.occupants_ids, null, function() {
            var dataIds = $chat.find('.addToGroupChat').data('ids'),
                ids = dataIds ? dataIds.toString().split(',').map(Number) : [];

            for (var i = 0, len = new_ids.length; i < len; i++) {
              new_id = new_ids[i].toString();

              if (new_id !== User.contact.id.toString()) {
                occupant = '<a class="occupant l-flexbox_inline presence-listener" data-id="'+new_id+'" href="#">';
                occupant = getStatus(roster[new_id], occupant);
                occupant += '<span class="name name_occupant">'+contacts[new_id].full_name+'</span></a>';
                $chat.find('.chat-occupants-wrap .mCSB_container').append(occupant);
              }
            }

            $chat.find('.addToGroupChat').data('ids', dialog.occupants_ids);
          });
        }

        // delete occupant
        if (deleted_id && msg.sender_id !== User.contact.id) {
          $chat.find('.occupant[data-id="'+id+'"]').remove();
          $chat.find('.addToGroupChat').data('ids', dialog.occupants_ids);
        }

        // change name
        if (room_name) {
          $chat.find('.name_chat').text(room_name).attr('title', room_name);
          dialogItem.find('.name').text(room_name);
        }

        // change photo
        if (room_photo) {
          $chat.find('.avatar_chat').css('background-image', 'url('+room_photo+')');
          dialogItem.find('.avatar').css('background-image', 'url('+room_photo+')');
        }
      }

      if (notification_type !== '1' && dialogItem.length > 0 /* && !isOfflineStorage*/) {
        copyDialogItem = dialogItem.clone();
        dialogItem.remove();
        $('#recentList ul').prepend(copyDialogItem);
        if (!$('#searchList').is(':visible')) {
          $('#recentList').removeClass('is-hidden');
          isSectionEmpty($('#recentList ul'));
        }
      }

      lastMessage = $chat.find('article[data-type="message"]').last();
      msg.stack = Message.isStack(true, msg, lastMessage);
      Helpers.log('Message object created:', msg);
      self.addItem(msg, true, true, id);

      // subscribe message
      if (notification_type === '4') {
        var QBApiCalls = self.app.service,
            Contact = self.app.models.Contact;
        // update hidden dialogs
        hiddenDialogs[id] = dialog_id;
        ContactList.saveHiddenDialogs(hiddenDialogs);
        // update contact list
        QBApiCalls.getUser(id, function(user) {
          contacts[id] = Contact.create(user);
          createAndShowNotification(msg, isHiddenChat);
        });
      } else {
        createAndShowNotification(msg, isHiddenChat);
      }

      if ((isHiddenChat || !window.isQMAppActive) && (message.type !== 'groupchat' || msg.sender_id !== User.contact.id)) {
        audioSignal.play();
      }

    },

    onSystemMessage: function(message) {
      var DialogView = self.app.views.Dialog,
          dialogs = ContactList.dialogs,
          notification_type = message.extension && message.extension.notification_type,
          dialog_id = message.extension && message.extension.dialog_id,
          room_jid = roomJidVerification(dialog_id),
          room_name = message.extension && message.extension.room_name,
          room_photo = message.extension && message.extension.room_photo,
          room_updated_at = message.extension && message.extension.room_updated_date,
          occupants_ids = message.extension && message.extension.current_occupant_ids ? message.extension.current_occupant_ids.split(',').map(Number) : null,
          dialogItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]'),
          dialogGroupItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]'),
          unread = parseInt(dialogItem.length > 0 && dialogItem.find('.unread').text().length > 0 ? dialogItem.find('.unread').text() : 0),
          audioSignal = $('#newMessageSignal')[0],
          msg, dialog;

      msg = Message.create(message);
      msg.sender_id = message.userId;
      msg.type = 'headline';

      // create new group chat
      if (notification_type === '1' && dialogGroupItem.length === 0) {
        dialog = Dialog.create({
          _id: dialog_id,
          type: 2,
          occupants_ids: occupants_ids,
          name: room_name,
          photo: room_photo,
          room_updated_date: room_updated_at,
          xmpp_room_jid: room_jid,
          unread_count: 1
        });

        ContactList.dialogs[dialog.id] = dialog;
        Helpers.log('Dialog', dialog);

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

      self.addItem(msg, true, true, true);

      createAndShowNotification(msg, true);

    },

    onMessageTyping: function(isTyping, userId, dialogId) {
      var ContactListMsg = self.app.models.ContactList,
          contacts = ContactListMsg.contacts,
          contact = contacts[userId],
          $chat = dialogId === null ? $('.l-chat[data-id="'+userId+'"]') : $('.l-chat[data-dialog="'+dialogId+'"]'),
          recipient = userId !== User.contact.id ? true : false,
          visible = $chat.is(':visible') ? true : false;

      if (recipient && visible) {

        // stop displays the status if they do not come
        if (clearTyping === undefined) {
          clearTyping = setTimeout(function(){
            typingList = [];
            stopShowTyping($chat, contact.full_name);
          }, 6000);
        } else {
          clearTimeout(clearTyping);
          clearTyping = setTimeout(function(){
            typingList = [];
            stopShowTyping($chat, contact.full_name);
          }, 6000);
        }

        if (isTyping) {
          // display start typing status
          startShowTyping($chat, contact.full_name);
        } else {
          // stop display typing status
          stopShowTyping($chat, contact.full_name);
        }
      }
    },

    onDeliveredStatus: function(messageId, dialogId, userId) {
      self.addStatusMessages(messageId, dialogId, 'delivered', true);
    },

    onReadStatus: function(messageId, dialogId, userId) {
      self.addStatusMessages(messageId, dialogId, 'displayed', true);
    }

  };

  /* Private
  ---------------------------------------------------------------------- */
  function getStatus(status, html) {
    if (!status || status.subscription === 'none') {
      html += '<span class="status status_request"></span>';
    } else if (status && status.status) {
      html += '<span class="status status_online"></span>';
    } else {
      html += '<span class="status"></span>';
    }

    return html;
  }

  function getFileSize(size) {
    return size > (1024 * 1024) ? (size / (1024 * 1024)).toFixed(1) + ' MB' : (size / 1024).toFixed(1) + 'KB';
  }

  function smartScroll(messageId, attachType) {
    var $objDom = $('.l-chat:visible .scrollbar_message');

    if (attachType) {
      $('#attach_'+messageId).load(function() {
        $objDom.mCustomScrollbar('scrollTo', 'bottom');
      });
    } else {
      $objDom.mCustomScrollbar('scrollTo', 'bottom');
    }
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
    if (list.contents().length === 0) {
      list.parent().addClass('is-hidden');
    }

    if ($('#historyList ul').contents().length === 0) {
      $('#historyList ul').parent().addClass('is-hidden');
    }

    if ($('#requestsList').is('.is-hidden') && $('#recentList').is('.is-hidden') && $('#historyList').is('.is-hidden')) {
      $('#emptyList').removeClass('is-hidden');
    }
  }

  function stopShowTyping(chat, user) {
    var index = typingList.indexOf(user);

    typingList.splice(index, 1); // removing current user from typing list

    // remove typing html or that user from this html
    if (typingList.length < 1) {
      $('article.message[data-status="typing"]').remove();
    } else {
      $('article.message[data-status="typing"] .message_typing').text(typingList.join(', '));
    }

    isTypingOrAreTyping(chat);
  }

  function startShowTyping(chat, user) {
    var form = $('article.message[data-status="typing"]').length > 0 ? true : false,
        html;

    // build html for typing statuses
    html =  '<article class="message typing l-flexbox l-flexbox_alignstretch" data-status="typing">';
    html += '<div class="message_typing"></div>';
    html += '<div class="is_or_are"> is typing</div>';
    html += '<div class="popup-elem spinner_bounce is-typing">';
    html += '<div class="spinner_bounce-bounce1"></div>';
    html += '<div class="spinner_bounce-bounce2"></div>';
    html += '<div class="spinner_bounce-bounce3"></div>';
    html += '</div></article>';

    typingList.unshift(user); // add user's name in begining of typing list
    $.unique(typingList); // remove duplicates
    typingList.splice(3, Number.MAX_VALUE); // leave the last three users which are typing

    // add a new typing html or use existing for display users which are typing
    if (form) {
      $('article.message[data-status="typing"] .message_typing').text(typingList.join(', '));
    } else {
      $('.j-typing').append(html);
      $('article.message[data-status="typing"] .message_typing').text(typingList.join(', '));
    }

    isTypingOrAreTyping(chat);
  }

  function isTypingOrAreTyping(chat) {
    if (typingList.length > 1) {
      $('div.is_or_are').text(' are typing');
    } else {
      $('div.is_or_are').text(' is typing');
    }
  }

  function roomJidVerification(dialog_id) {
    var roomJid = QB.chat.helpers.getRoomJidFromDialogId(dialog_id);

    arrayString = roomJid.split('');

    if (arrayString[0] == '_') {
      roomJid = QMCONFIG.qbAccount.appId + roomJid.toString();
    }
    return roomJid;
  }

  function createAndShowNotification(msg, isHiddenChat) {
    var params = {
      'user': User,
      'dialogs': ContactList.dialogs,
      'contacts': ContactList.contacts
    };

    var title = Helpers.Notifications.getTitle(msg, params),
        options = Helpers.Notifications.getOptions(msg, params);

    if (QMCONFIG.notification && QBNotification.isSupported() && (isHiddenChat || !window.isQMAppActive)) {
      if(!QBNotification.needsPermission()) {
        Helpers.Notifications.show(title, options);
      } else {
        QBNotification.requestPermission(function(state) {
          if (state === "granted") {
            Helpers.Notifications.show(title, options);
          }
        });
      }
    }
  }

  return MessageView;

});
