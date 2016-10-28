/*
 * Q-municate chat application
 *
 * Message Model
 */
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
    var entities = entities || {};

    /* Message Model */
    entities.MessageModel = Backbone.Model.extend({
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
            Helpers.log('MessageModel created: ', this.toJSON());
            this.saveInDialogModel();
        },

        validate: function(attrs) {

        },

        saveInDialogModel: function() {
            var dialogId = this.get('dialog_id'),
                dialog   = entities.dialogsCollection.get(dialogId),
                messages = dialog.get('messages');

            messages.push(this);
        }
    });

    /* Message Model Collection */
    entities.MessagesCollection = Backbone.Collection.extend({
        model: entities.MessageModel,

        initialize: function() {
            this.listenTo(this, 'add', this.keepCountOfModels);
        },

        keepCountOfModels: function() {
            if (this.length > 20) {
                this.shift();
            }
        }
    });


    /* Dialog Model */
    entities.DialogModel = Backbone.Model.extend({
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
            messages: []
        },

        initialize: function() {
            Helpers.log('DialogModel created: ', this.toJSON());
            entities.dialogsCollection.push(this);
        },

        validate: function(attrs) {

        }
    });

    /* Dialog Model Collection */
    entities.DialogsCollection = Backbone.Collection.extend({
        model: entities.DialogModel
    });

    entities.dialogsCollection = new entities.DialogsCollection();


    return entities;
});
