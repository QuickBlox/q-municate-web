/*
 * Q-municate chat application
 *
 * Local Notifications Module
 *
 */

define(['config'], function(QMCONFIG) {

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
    			chatType = params.type,
    			dialogId = params.dialog_id,
    			userId = params.sender_id,
    			dialog = ContactList.dialogs[dialogId],
    			contacts = ContactList.contacts,
    			contact = contacts[userId],
		  		photo = (chatType === 'groupchat' || 'headline') ? (dialog.room_photo || QMCONFIG.defAvatar.group_url_png) : (contact.avatar_url || QMCONFIG.defAvatar.url_png),
		  		name = dialog.room_name || contact.full_name || null,
    			type = params.notification_type,
    			occupants_names = '', occupants_ids,
    			i, len, user, options, text;

		  switch (type) {

		  	// system notifications
        case '1':
        	occupants_ids = _.without(params.current_occupant_ids.split(',').map(Number), contact.id);

          for (i = 0, len = occupants_ids.length, user; i < len; i++) {
            user = contacts[occupants_ids[i]] && contacts[occupants_ids[i]].full_name;
            if (user)
              occupants_names = (i + 1) === len ? occupants_names.concat(user) : occupants_names.concat(user).concat(', ');
            else if (occupants_ids[i] === User.contact.id)
              occupants_names = (i + 1) === len ? occupants_names.concat(User.contact.full_name) : occupants_names.concat(User.contact.full_name).concat(', ');
          }

        	text = contact.full_name + ' has added ' + occupants_names + ' to the group chat';
        	break;

        case '2':
        	// groupchat updated
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
        	if (params.caller === User.contact.id) {
            text = 'Call to ' + contacts[params.callee].full_name+', duration ' + params.duration;
        	} else {
            text = 'Call from ' + contacts[params.caller].full_name+', duration ' + params.duration;
        	}
        	break;

        case '9':
        	if (params.caller === User.contact.id) {
            text = 'Call to ' + contacts[params.callee].full_name + ', no answer';
        	} else {
            text = 'Missed call from ' + contacts[params.caller].full_name;
        	}
        	break;

        case '10':
        	if (params.caller === User.contact.id) {
            text = 'Call to ' + contacts[params.callee].full_name + ', busy';
        	} else {
            text = 'Call from ' + contacts[params.caller].full_name + ', busy';
        	}
        	break;

        case '11':
        	if (params.caller === User.contact.id) {
            text = contacts[params.callee].full_name+' doesn\'t have camera and/or microphone.';
        	} else {
            text = 'Camera and/or microphone wasn\'t found.';
        	}
        	break;

        // messages
        default:
        	text = (chatType === 'groupchat') ? (contact.full_name + ': ' + params.body) : params.body;
        	break;
	    }

			if (text) {
				options = {
					body: text,
					icon: photo
				};

			  if (Notification.permission === "granted") {
			    var notification = new Notification(name, options);
			    setTimeout(notification.close.bind(notification), 4000);
			  } else if (Notification.permission !== 'denied') {
			    Notification.requestPermission(function (permission) {
			      if (permission === "granted") {
			        var notification = new Notification(name, options);
			        setTimeout(notification.close.bind(notification), 4000);
			      }
			    });
			  }
			}
		}

  };

  return QMNotifications;

});