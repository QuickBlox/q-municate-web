/*
 * Q-municate chat application
 *
 * Helper Module
 *
 */

define(['jquery', 'config', 'QBNotification'], function($, QMCONFIG, QBNotification) {

  var Helpers = {};

  Helpers.Notifications = {

    show: function(title, options) {
      var notify = new QBNotification(title, options);

      notify.show();
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
      var myUser = params.User,
          dialogs = params.dialogs,
          contacts = params.contacts,
          dialog = dialogs[message.dialog_id],
          contact = contacts[message.sender_id],
          chatType = message.type,
          photo = (chatType === 'chat') ? (contact.avatar_url || QMCONFIG.defAvatar.url_png) : (dialog.room_photo || QMCONFIG.defAvatar.group_url_png),
          type = message.notification_type,
          options, text, occupants_ids, occupantsNames = '',
          selectDialog = $('.dialog-item[data-dialog="'+message.dialog_id+'"] .contact');

      switch (type) {

        // system notifications
        case '1':
          occupants_ids = _.without(message.current_occupant_ids.split(',').map(Number), contact.id);

          occupantsNames = Helpers.Messages.getOccupantsNames(occupants_ids, myUser);
          text = contact.full_name + ' has added ' + occupantsNames + ' to the group chat';
          break;

        // groupchat updated
        case '2':
          break;

        // contacts
        case '4':
          text = contact.full_name + ' has sent a request to you'
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

        // messages
        default:
          text = (chatType === 'groupchat') ? (contact.full_name + ': ' + message.body) : message.body;
          break;
        }

      if (text) {
        options = {
          body: text,
          icon: photo,
          tag: message.dialog_id,
          onClick: function() {
            window.focus();
            selectDialog.click();
          },
          timeout: QMCONFIG.notifyTimeout,
          closeOnClick: true
        };
      }

      return options;
    }

  };

  Helpers.Messages = {

    getOccupantsNames: function(occupants_ids, myUser) {
      var occupants_names = '', i, len, user;

      for (i = 0, len = occupants_ids.length, user; i < len; i++) {
        user = contacts[occupants_ids[i]] && contacts[occupants_ids[i]].full_name;
        if (user) {
          occupants_names = (i + 1) === len ? occupants_names.concat(user) : occupants_names.concat(user).concat(', ');
        } else if (occupants_ids[i] === myUser.contact.id) {
          occupants_names = (i + 1) === len ? occupants_names.concat(myUser.contact.full_name) : occupants_names.concat(myUser.contact.full_name).concat(', ');
        }
      }

      return occupants_names
    }

  };

  return Helpers;
  
});