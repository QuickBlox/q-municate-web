/* Module for dialogs and messages */
'use strict';

define([
    'jquery',
    'underscore',
    'backbone',
    'quickblox',
    'config',
    'MainModule',
    'Helpers'
], function(
    $,
    _,
    Backbone,
    QB,
    QMCONFIG,
    QM,
    Helpers
) {

    var entities = {
		Models: {},
		Views: {},
		Collections: {}
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
			this.validate(this.attributes);
            Helpers.log('MessageModel created: ', this.toJSON());
            this.saveInDialogModel();
        },

        validate: function(attrs) {
			_.each(attrs, function(value, key) {
				if (value === null) {
					this.unset(key);
				}
			}, this);
        },

        saveInDialogModel: function() {
            var dialogId = this.get('dialog_id'),
                dialog   = entities.Collections.dialogs.get(dialogId),
                messages = dialog.get('messages');

            messages.push(this);
        }
    });

    /* Message Models Collection */
    entities.Collections.Messages = Backbone.Collection.extend({
        model: entities.Models.Message,

        initialize: function() {
            this.listenTo(this, 'add', this.update);
        },

        update: function() {
			var isActive = this.getDialogProp('active'),
				unreadCount = this.getDialogProp('unread_count');

			if (isActive) {
				if (this.length > (20 + unreadCount)) {
					this.shift();
				}
			} else {
				this.setDialogProp('unread_count', ++unreadCount);
				this.getDialogProp('unread_messages').push()
				console.info(this.getDialogProp('unread_count'));

				if (this.length > 100) {
					this.shift();
				}
			}
        },

		getDialogProp: function(prop) {
			var property;

			if (this.models.length > 0) {
				var dialogId = this.models[0].get('dialog_id'),
					dialog = entities.Collections.dialogs.get(dialogId);

				property = dialog.get(prop);
			}

			return property;
		},

		setDialogProp: function(prop, val) {
			var dialogId = this.models[0].get('dialog_id'),
				dialog = entities.Collections.dialogs.get(dialogId);

			dialog.set(prop, val);
			console.info(prop, val, dialog.toJSON());
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
			active: false
        },

        initialize: function() {
            Helpers.log('DialogModel created: ', this.toJSON());
            entities.Collections.dialogs.push(this);
        },

        validate: function(attrs) {

        }
    });

    /* Dialog Models Collection */
    entities.Collections.Dialogs = Backbone.Collection.extend({
        model: entities.Models.Dialog
    });

    entities.Collections.dialogs = new entities.Collections.Dialogs();

	// set selected as active
	$('.list_contextmenu').on('click', 'li.dialog-item', function() {
		var dialogId = $(this).data('dialog'),
			dialogs = entities.Collections.dialogs,
			actived = dialogs.get(dialogId);

		dialogs.each(function(item) {
			if (item.get('id') === dialogId) {
				item.set({
					'active': true,
					'unread_count': ''
				});
			} else {
				item.set({'active': false});
			}
		});
	});

    return entities;
});
