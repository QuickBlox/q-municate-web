/* Module for dialogs and messages */
'use strict';

define([
    'jquery',
    'underscore',
    'backbone',
    'quickblox',
    'Helpers'
], function(
    $,
    _,
    Backbone,
    QB,
    Helpers
) {

    var entities = {
		Models: {},
		Views: {},
		Collections: {},
        active: ''
	};

    /* Message Model */
    entities.Models.Message = Backbone.Model.extend({
        defaults: {
            id: '',
            body: '',
            type: '',
            dialog_id: '',
            date_sent: null,
            notification_type: null,
            delivered_ids: [],
            read_ids: [],
            read: null
        },

        initialize: function() {
            this.accumulateInDialogModel();
        },

        validate: function(attrs) {

        },

        accumulateInDialogModel: function() {
            var dialogId = this.get('dialog_id'),
                dialog = entities.Collections.dialogs.get(dialogId),
                isOpen = dialog.get('opened'),
                isActive = (dialogId === entities.active),
                isHidden = (isActive && !window.isQMAppActive),
                unreadCount = dialog.get('unread_count'),
                unreadMessages = dialog.get('unread_messages'),
                myUserId = entities.app.models.User.contact.id,
                senderId = this.get('sender_id'),
                isFromOtherUser = (myUserId !== senderId);

            if (isOpen) {
                dialog.get('messages').push(this);
            }

            if ((!isActive || isHidden) && isFromOtherUser) {
                unreadMessages.push({
                    userId: senderId,
                    dialogId: dialogId,
                    messageId: this.get('id')
                });
                dialog.set('unread_count', ++unreadCount);
                console.info(unreadCount + ' unread messages:', unreadMessages);
            }
        }
    });

    /* Message Models Collection */
    entities.Collections.Messages = Backbone.Collection.extend({
        model: entities.Models.Message,

        initialize: function() {
            this.listenTo(this, 'add', this.update);
        },

        update: function() {
            if (this.length > 20) {
                this.shift();
            }
        }
    });


    /* Dialog Model */
    entities.Models.Dialog = Backbone.Model.extend({
        defaults: {
            id: '',
            type: null,
            room_jid: null,
            room_name: null,
            room_photo: '',
            occupants_ids: null,
            room_updated_date: null,
            last_message_date_sent: null,
            last_message: '',
            last_messages: [],
            unread_messages: [],
            unread_count: '',
            messages: [],
            opened: false
        },

        initialize: function() {
            entities.Collections.dialogs.push(this);
        },

        validate: function(attrs) {

        }
    });

    /* Dialog Models Collection */
    entities.Collections.Dialogs = Backbone.Collection.extend({
        model: entities.Models.Dialog,

        sendReadStatus: function(id) {
            var dialog = this.get(id),
                unreadMeassages = dialog.get('unread_messages');

            if (unreadMeassages.length > 0) {
                _.each(unreadMeassages, function(params) {
                    QB.chat.sendReadStatus(params);
                });

                dialog.set({
                    'unread_count': '',
                    'unread_messages': []
                });
            }
        }
    });

    entities.Collections.dialogs = new entities.Collections.Dialogs();

	// 123
	$('.list_contextmenu').on('click', 'li.dialog-item', function() {
		entities.active = $(this).data('dialog');

		var dialogId = entities.active,
            dialogs = entities.Collections.dialogs,
            actived = dialogs.get(dialogId);

        if (!(actived.get('opened'))) {
            // read all messages
            QB.chat.message.update(null, {
                chat_dialog_id: dialogId,
                read: 1
            }, function() {
                actived.set('opened', true);
            });
        }

        dialogs.sendReadStatus(dialogId);
	});

    // 123
    $(window).focus(function() {
        if (entities.active) {
            var dialogs = entities.Collections.dialogs,
                dialog = dialogs.get(entities.active);

            dialogs.sendReadStatus(dialog.get('id'));
        }
    });

    return entities;
});
