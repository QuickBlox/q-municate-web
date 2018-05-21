/******************** Module for dialogs and messages *************************/
'use strict';

define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'quickblox',
    'Helpers'
], function(
    $,
    _,
    Backbone,
    QMCONFIG,
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

    /**
     * [Message model]
     * @type {[Backbone model]}
     */
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
            online: false,
            status: ''
        },

        initialize: function() {
            this.accumulateInDialogModel();
        },

        // accumulate messages in dialogs
        accumulateInDialogModel: function() {
            var dialogId = this.get('dialog_id'),
                dialog = entities.Collections.dialogs.get(dialogId);

            if (!dialog) {
                return true;
            }

            var messageId = this.get('id'),
                type = this.get('type'),
                senderId = this.get('sender_id'),
                readIds = this.get('read_ids'),
                isOpen = dialog.get('opened'),
                myUserId = entities.app.models.User.contact.id,
                isActive = (dialogId === entities.active),
                isHidden = (isActive && !window.isQMAppActive),
                isFromOtherUser = (myUserId !== senderId),
                isUnreadMessage = (readIds.length < 2);

            if (isOpen) {
                // save as uread if dialog isn't active
                if ((!isActive || isHidden) && isFromOtherUser) {
                    new entities.Models.UnreadMessage({
                        'userId': senderId,
                        'dialogId': dialogId,
                        'messageId': messageId
                    });
                } else if (isUnreadMessage && isFromOtherUser) {
                    QB.chat.sendReadStatus({
                        'userId': senderId,
                        'dialogId': dialogId,
                        'messageId': messageId
                    });
                } else if ((type === 'groupchat') && !isFromOtherUser) {
                    QB.chat.sendDeliveredStatus({
                        'userId': senderId,
                        'dialogId': dialogId,
                        'messageId': messageId
                    });
                }
                // collect last messages for opened dialog's
                this.addMessageToCollection(dialog.get('messages'));
            }
        },

        addMessageToCollection: function(collection) {
            var online = this.get('online');

            if (online) {
                collection.unshift(this);
            } else {
                collection.push(this);
            }
        }

    });

    /**
     * [Messages collection]
     * @type {[Backbone collection]}
     */
    entities.Collections.Messages = Backbone.Collection.extend({
        model: entities.Models.Message,

        initialize: function() {
            this.listenTo(this, 'add', this.keepCountOfMessages);
        },

        // keep count for messages collection
        keepCountOfMessages: function() {
            var stack = QMCONFIG.stackMessages,
                dialogId = this.models[0].get('dialog_id'),
                dialog = entities.Collections.dialogs.get(dialogId),
                unreadCount = dialog.get('unread_count');

            if (
                ((this.length > stack) && (unreadCount < stack)) ||
                ((unreadCount >= stack) && (this.length > ++unreadCount))
            ) {
                this.pop();
            }
        }
    });

    /**
     * [Unread message model]
     * @type {[Backbone model]}
     */
    entities.Models.UnreadMessage = Backbone.Model.extend({
        defaults: {
            messageId: '',
            dialogId: '',
            userId: null
        },

        initialize: function() {
            this.accumulateInDialogModel();
        },

        accumulateInDialogModel: function() {
            var dialogId = this.get('dialogId'),
                messageId = this.get('messageId'),
                userId = this.get('userId'),
                dialog = entities.Collections.dialogs.get(dialogId),
                unreadCount = dialog.get('unread_count'),
                unreadMessages = dialog.get('unread_messages');

            dialog.set('unread_count', ++unreadCount);
            unreadMessages.add(this);
        },
    });

    /**
     * [Unread messages collection]
     * @type {[Backbone collection]}
     */
    entities.Collections.UnreadMessages = Backbone.Collection.extend({
        model: entities.Models.UnreadMessage
    });

    /**
     * [Dialog model]
     * @type {[Backbone model]}
     */
    entities.Models.Dialog = Backbone.Model.extend({
        defaults: {
            id: '',
            type: null,
            room_jid: null,
            room_name: null,
            room_photo: '',
            occupants_ids: [],
            room_updated_date: null,
            last_message_date_sent: null,
            last_message: '',
            last_messages: [],
            unread_count: '',
            unread_messages: [],
            messages: [],
            opened: false,
            joined: false,
            draft: ''
        },

        // add dialog to collection after initialize
        initialize: function() {
            entities.Collections.dialogs.push(this);

            this.listenTo(this, 'change:unread_count', this.cutMessages);
            this.listenTo(this, 'remove', this.setActiveDialog);
        },

        cutMessages: function() {
            var messages = this.get('messages'),
                curCount = this.get('unread_count'),
                stack = QMCONFIG.stackMessages,
                msgCount = messages.length;

            if (+curCount === 0) {
                for (var i = 0; i < (msgCount - stack); i++) {
                    messages.pop();
                }
            }
        },

        setActiveDialog: function() {
            if (this.get('id') === entities.active) {
                entities.active = '';
            }
        }
    });

    /**
     * [Dialog models collection]
     * @type {[Backbone collection]}
     */
    entities.Collections.Dialogs = Backbone.Collection.extend({
        model: entities.Models.Dialog,

        initialize: function functionName() {
            this.listenTo(this, 'reset', function() {
                entities.active = '';
                $('.chatView').remove();
            });
        },

        readAll: function(dialogId) {
            var dialog = this.get(dialogId),
                unreadCount = dialog.get('unread_count'),
                unreadMeassages = dialog.get('unread_messages'),
                unreadMeassagesIds = [];

            if (unreadMeassages.length > 0) {
                // send read status for online messages
                unreadMeassages.each(function(params) {
                    QB.chat.sendReadStatus(params.toJSON());
                    unreadMeassagesIds.push(params.get('messageId'));
                });

                unreadMeassages.reset();
            }
            // read all dialog's messages on REST
            if (+unreadCount > 0) {
                QB.chat.message.update(null, {
                    chat_dialog_id: dialogId,
                    read: 1
                }, function() {
                    dialog.set('unread_count', '');
                });
            }
        },

        saveDraft: function() {
            var dialogId = entities.active;

            if (dialogId) {
                var dialog = this.get(dialogId),
                    text = $('#textarea_' + dialogId).text();

                dialog.set('draft', text);
            }
        },

        selectDialog: function(dialogId) {
            var MessageView = entities.app.views.Message,
                DialogView = entities.app.views.Dialog,
                Cursor = entities.app.models.Cursor,
                dialog = this.get(dialogId);

            if (dialog.get('opened')) {
                DialogView.htmlBuild(dialogId, dialog.get('messages').toJSON());
            } else {
                dialog.set('opened', true);
                DialogView.htmlBuild(dialogId);
            }

            MessageView.clearTheListTyping();
            Cursor.setCursorToEnd($('.l-chat:visible .textarea')[0]);
            // send read status
            this.readAll(dialogId);
        }
    });

    /**
     * [Chat model]
     * @type {[Backbone model]}
     */
    entities.Models.Chat = Backbone.Model.extend({
        defaults: {
            draft: '',
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
            this.buildChatView();
        },

        buildChatView: function() {
            entities.Views.chat = new entities.Views.Chat({model: this});
        }
    });

    /**
     * [Chat view]
     * @type {[Backbone view]}
     */
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

            $('#chatWrap').removeClass('is-hidden').append(chatElem);
        }
    });

    /**
     * Events
     */

	// select and open dialog
	$('.list_contextmenu').on('click', '.contact', function() {
        var dialogId = $(this).parent().data('dialog');

        if (entities.active !== dialogId) {
            entities.Collections.dialogs.selectDialog(dialogId);
        }
	});

    // read all unread messages
    $(window).focus(function() {
        Helpers.Dialogs.setScrollToNewMessages();

        var dialogId = entities.active;

        if (dialogId) {
            entities.Collections.dialogs.readAll(dialogId);
        }
    });

    // unselect all dialogs
    $('.j-home').on('click', function() {
        // clear active dialog id
        entities.Collections.dialogs.saveDraft();
        entities.active = '';
    });

    return entities;
});
