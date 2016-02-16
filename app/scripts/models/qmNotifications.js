/*
 * Q-municate chat application
 *
 * Local Notifications Module
 *
 */

define(['jquery', 'config', 'quickblox'], function($, QMCONFIG, QB) {

	function QMNotifications(app) {
    this.app = app;
  }

  QMNotifications.prototype =  {
  	
  	askForPermission: function() {
  		if (Notification.permission === "default") {
  			Notification.requestPermission();
  		}
  	},

  	call: function(params) {
		  if (!("Notification" in window)) {
		    console.error('Notification API not supported.');
		    return;
		  }

		  var ContactList = this.app.models.ContactList,
    			DialogView = this.app.views.Dialog,
    			User = this.app.models.User,
    			dialogId = params.dialog_id,
    			userId = params.sender_id,
    			dialog = ContactList.dialogs[dialogId],
    			contacts = ContactList.contacts,
    			contact = contacts[userId],
		  		photo = dialog.room_photo || contact.avatar_url || null,
		  		name = dialog.room_name || contact.full_name || null,
    			chatType = params.type,
    			type = params.notification_type,
    			occupants_names = '', occupants_ids,
    			i, len, user, options, text;


		  switch (type) {

        case '1':
        	occupants_ids = _.without(params.current_occupant_ids.split(',').map(Number), contact.id);

          for (i = 0, len = occupants_ids.length, user; i < len; i++) {
            user = contacts[occupants_ids[i]] && contacts[occupants_ids[i]].full_name;
            console.log(user);
            if (user)
              occupants_names = (i + 1) === len ? occupants_names.concat(user) : occupants_names.concat(user).concat(', ');
            else if (occupants_ids[i] === User.contact.id)
              occupants_names = (i + 1) === len ? occupants_names.concat(User.contact.full_name) : occupants_names.concat(User.contact.full_name).concat(', ');
          }

        	text = contact.full_name + ' has added ' + occupants_names + ' to the group chat';
        	break;

        case '2':
        	break;

        case '4':
        	text = contact.full_name + ' has sent a request to you'
        	break;

        case '5':

        	break;

        case '6':

        	break;

        case '7':

        	break;
        case '8':

        	break;

        case '9':

        	break;

        case '10':

        	break;

        case '11':

        	break;

        default:
        	text = (chatType === 'groupchat') ? (contact.full_name + ': ' + params.body) : params.body;
        	break;
	    }

			if (text) {
				options = {body: text, icon: photo};

			  // Let's check whether notification permissions have already been granted
			  if (Notification.permission === "granted") {
			    // If it's okay let's create a notification
			    var notification = new Notification(name, options);
			  }

			  // Otherwise, we need to ask the user for permission
			  else if (Notification.permission !== 'denied') {
			    Notification.requestPermission(function (permission) {
			      // If the user accepts, let's create a notification
			      if (permission === "granted") {
			        var notification = new Notification(name, options);
			      }
			    });
			  }
			}
		}

  };

  return QMNotifications;

});