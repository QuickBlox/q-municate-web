/**
 * Helper Module
 */

define(['jquery', 'config', 'QBNotification'], function($, QMCONFIG, QBNotification) {
  var Helpers = {};

  Helpers.Notifications = {
    
    show: function(title, options) {
      // show notification if all parametters are is
      if (title && options) {
        var notify = new QBNotification(title, options);
        notify.show();
      }
    },

    getTitle: function(message, params) {
      var dialogs = params.dialogs,
          contacts = params.contacts,
          dialog = dialogs[message.dialog_id],
          contact = contacts[message.sender_id],
          title;

      title = (dialog && dialog.room_name) || contact.full_name;

      return title;
    },

    getOptions: function(message, params) {
      var myUser = params.user,
          dialogs = params.dialogs,
          contacts = params.contacts,
          dialog = dialogs[message.dialog_id],
          contact = contacts[message.sender_id],
          chatType = message.type,
          photo = (chatType === 'chat') ? (contact.avatar_url || QMCONFIG.defAvatar.url_png) : (dialog.room_photo || QMCONFIG.defAvatar.group_url_png),
          type = message.notification_type || (message.callState && (parseInt(message.callState) + 7).toString()) || 'message',
          selectDialog = $('.dialog-item[data-dialog="'+message.dialog_id+'"] .contact'),
          occupants_ids,
          occupantsNames = '',
          options,
          text;

      // hot fix
      if (photo === 'images/ava-single.svg') {
        photo = QMCONFIG.defAvatar.url_png;
      }

      /**
       * [to prepare the text in the notification]
       * @param  {[type]} type [system notification type]
       * @return {[text]}      [notification description text]
       * 1 - groupchat created
       * 2 - about any changes in groupchat
       * 3 - not use yet
       * 4 - incomming contact request
       * 5 - contact request accepted
       * 6 - contact request rejected
       * 7 - about deleting from contact list
       * 8 - incomming call
       * 9 - about missed call
       * 10 - no answer
       * 11 - сamera and/or microphone wasn't found
       * 12 - incoming call
       * 13 - call accepted
       * default - message
       */
      switch (type) {
        // system notifications
        case '1':
          occupants_ids = _.without(message.current_occupant_ids.split(',').map(Number), contact.id);
          occupantsNames = Helpers.Messages.getOccupantsNames(occupants_ids, myUser, contacts);
          text = contact.full_name + ' has added ' + occupantsNames + ' to the group chat';
          break;

        // groupchat updated
        case '2':
          // for future cases
          break;

        // contacts
        case '4':
          text = contact.full_name + ' has sent a request to you';
          break;

        case '5':
          text = 'Your request has been accepted by ' + contact.full_name;
          break;

        case '6':
          text = 'Your request has been rejected by ' + contact.full_name;
          break;

        case '7':
          text = 'You have been deleted from the contact list by ' + contact.full_name;
          break;

        // calls
        case '8':
          if (message.caller === myUser.contact.id) {
          text = 'Call to ' + contacts[message.callee].full_name+', duration ' + message.duration;
          } else {
          text = 'Call from ' + contacts[message.caller].full_name+', duration ' + message.duration;
          }
          break;

        case '9':
          if (message.caller === myUser.contact.id) {
          text = 'Call to ' + contacts[message.callee].full_name + ', no answer';
          } else {
          text = 'Missed call from ' + contacts[message.caller].full_name;
          }
          break;

        case '10':
          if (message.caller === myUser.contact.id) {
          text = 'Call to ' + contacts[message.callee].full_name + ', busy';
          } else {
          text = 'Call from ' + contacts[message.caller].full_name + ', busy';
          }
          break;

        case '11':
          if (message.caller === myUser.contact.id) {
          text = contacts[message.callee].full_name+' doesn\'t have camera and/or microphone.';
          } else {
          text = 'Camera and/or microphone wasn\'t found.';
          }
          break;

        case '12':
          text = 'Incomming '+message.callType+' Call from '+contact.full_name;
          break;

        case '13':
          text = 'The '+message.callType+' Call accepted by '+contact.full_name;
          break;

        // messages
        default:
          text = (chatType === 'groupchat') ? (contact.full_name + ': ' + message.body) : message.body;
          break;
      }

      if (text) {
        text = text.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&");
        options = {
          body: text,
          icon: photo,
          tag: message.dialog_id,
          onClick: function() {
            window.focus();
            selectDialog.click();
          },
          timeout: QMCONFIG.notification.timeout,
          closeOnClick: true
        };
      }

      return options;
    }
  };

  Helpers.Messages = {
    getOccupantsNames: function(occupants_ids, myUser, contacts) {
      var occupants_names = '',
          myContact = myUser.contact;

      for (var i = 0, len = occupants_ids.length, user; i < len; i++) {
        user = contacts[occupants_ids[i]] && contacts[occupants_ids[i]].full_name;
        if (user) {
          occupants_names = (i + 1) === len ? occupants_names.concat(user) : occupants_names.concat(user).concat(', ');
        } else if (occupants_ids[i] === myContact.id) {
          occupants_names = (i + 1) === len ? occupants_names.concat(myContact.full_name) : occupants_names.concat(myContact.full_name).concat(', ');
        }
      }

      return occupants_names;
    }
  };

  // smart console (beta)
  Helpers.log = function() {
    if (QMCONFIG.debug) {
      if (arguments.length <= 1) {
        console.group("[Q-MUNICATE debug mode]:");
        console.log(arguments[0]);
        console.groupEnd();
      } else {
        console.group("[Q-MUNICATE debug mode]:");
        for (var i = 0; i < arguments.length; i++) {
          if ((typeof arguments[i] === "string") && (typeof arguments[i+1] !== "string")) {
            console.log(arguments[i], arguments[i+1]);
            i = i + 1;
          } else {
            console.log(arguments[i]);
          }
        }
        console.groupEnd();
      }
    }
  };

  Helpers.isBeginOfChat = function() {
    var $viewPort = $('.l-chat:visible .scrollbar_message .mCustomScrollBox'),
        $msgList = $viewPort.find('.mCSB_container');

    if ($msgList.offset()) {
      var viewPortPosition = $viewPort.offset().top,
          viewPortHeight = $viewPort.outerHeight(),
          msgListPosition = $msgList.offset().top,
          msgListHeight = $msgList.outerHeight(),
          viewPortBottom = viewPortPosition + viewPortHeight,
          msgListBottom = msgListPosition + msgListHeight,
          bottom = false;

      if ((viewPortBottom + viewPortHeight / 2) >= msgListBottom) {
        bottom = true;
      }

      return bottom;
    }
  };

  return Helpers;
});
