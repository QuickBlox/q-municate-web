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
        Helpers: {},
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
            read: null,
            online: false
        },

        initialize: function() {
            this.accumulateInDialogModel();
        },

        // accumulate messages in dialogs
        accumulateInDialogModel: function() {
            var dialogId = this.get('dialog_id'),
                messageId = this.get('id'),
                senderId = this.get('sender_id'),
                readIds = this.get('read_ids'),
                dialog = entities.Collections.dialogs.get(dialogId),
                isOpen = dialog.get('opened'),
                unreadCount = dialog.get('unread_count'),
                unreadMessages = dialog.get('unread_messages'),
                myUserId = entities.app.models.User.contact.id,
                isActive = (dialogId === entities.active),
                isHidden = (isActive && !window.isQMAppActive),
                isFromOtherUser = (myUserId !== senderId),
                isUnreadMessage = (readIds.length < 2);

            if (isOpen) {
                // collect last messages for opened dialog's
                this.addMessageToCollection(dialog.get('messages'));
                // save as uread if dialog isn't active
                if ((!isActive || isHidden) && isFromOtherUser) {
                    dialog.set('unread_count', ++unreadCount);
                    unreadMessages.push({
                        userId: senderId,
                        dialogId: dialogId,
                        messageId: messageId
                    });
                } else if ((readIds.length < 2) && isFromOtherUser) {
                    QB.chat.sendReadStatus({
                        userId: senderId,
                        dialogId: dialogId,
                        messageId: messageId
                    });
                }
            }
        },

        addMessageToCollection: function(collection) {
            var online = this.get('online')

            if (online) {
                collection.unshift(this);
            } else {
                collection.push(this);
            }
        }

    });

    /* Message Models Collection */
    entities.Collections.Messages = Backbone.Collection.extend({
        model: entities.Models.Message,

        initialize: function() {
            this.listenTo(this, 'add', this.updateCollection);
        },

        // keep count for messages collection
        updateCollection: function() {
            var dialogId = this.models[0].get('dialog_id'),
                dialog = entities.Collections.dialogs.get(dialogId),
                unreadCount = dialog.get('unread_count');

            if ((this.length > 20) && (unreadCount < 20)) {
                this.pop();
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

        // add dialog to collection after initialize
        initialize: function() {
            entities.Collections.dialogs.push(this);
            this.listenTo(this, 'change:unread_count', this.cutMessages);
        },

        cutMessages: function() {
            var curCount = this.get('unread_count'),
                preCount = this.previous('unread_count'),
                msgCount = this.collection.length,
                msgs = this.collection;

            if (curCount === '') {
console.info(curCount);
                _.difference(msgs, msgs.slice(0, (msgCount - 20)));
            }
        }
    });

    /* Dialog Models Collection */
    entities.Collections.Dialogs = Backbone.Collection.extend({
        model: entities.Models.Dialog,
    });

    // init dialog's collection with starting app
    entities.Collections.dialogs = new entities.Collections.Dialogs();

    /* Chat Model */
    entities.Models.Chat = Backbone.Model.extend({
        defaults: {
            occupantsIds: '',
            status: '',
            dialog_id: '',
            location: '',
            type: null,
            user_id: null,
            name: '',
            icon: '',
            jid: ''
        },

        initialize: function() {
            entities.Views.chat = new entities.Views.Chat({model: this});
        }
    });

    /* Chat View */
    entities.Views.Chat = Backbone.View.extend({
        tagName: 'div',
        className: 'chatView',
        template: _.template($('#chatTpl').html()),

        initialize: function() {
            this.render();
        },

        render: function() {
            var chatTpl = this.template(this.model.toJSON()),
                chatElem = this.$el.html(chatTpl);

            $('#chatWrap').removeClass('is-hidden').html(chatElem);
        }
    });


//******************************************************************************
//******************************************************************************

	// do something after selected dialog
	$('.list_contextmenu').on('click', 'li.dialog-item', function() {
        var MessageView = entities.app.views.Message,
            DialogView = entities.app.views.Dialog,
            Cursor = entities.app.models.Cursor,
            dialogId = $(this).data('dialog'),
            dialogs = entities.Collections.dialogs,
            dialog = dialogs.get(dialogId),
            $dialog = $(this).find('.contact');

        // set up this dialog_id as active
        entities.active = dialogId;

        if (dialog.get('opened')) {
            DialogView.htmlBuild($dialog, dialog.get('messages').toJSON());
        } else {
            // set as opened after took history from REST
            dialog.set('opened', true);
            DialogView.htmlBuild($dialog, null);
        }

        MessageView.clearTheListTyping();
        Cursor.setCursorToEnd($('.l-chat:visible .textarea')[0]);
        // send read status
        readAll(dialogId);
	});

    // when app is getting focus
    $(window).focus(function() {
        if (entities.active) {
            var dialogs = entities.Collections.dialogs,
                dialog = dialogs.get(entities.active);

            // send read status
            readAll(dialog.get('id'));
        }
    });

    $('.j-home').on('click', function() {
        // clear active dialog id
        entities.active = '';
        $('.chatView').remove();
    });

    function readAll(dialogId) {
        var dialogs = entities.Collections.dialogs,
            dialog = dialogs.get(dialogId),
            unreadMeassages = dialog.get('unread_messages'),
            unreadMeassagesIds = [];

        if (unreadMeassages.length > 0) {
            // send read status for online messages
            _.each(unreadMeassages, function(params) {
                QB.chat.sendReadStatus(params);
                unreadMeassagesIds.push(params.messageId);
            });

            // read all dialog's messages on REST
            QB.chat.message.update(unreadMeassagesIds, {
                chat_dialog_id: dialogId,
                read: 1
            }, function() {});

            dialog.set({
                'unread_count': '',
                'unread_messages': []
            });
        }
    }

    return entities;
});
