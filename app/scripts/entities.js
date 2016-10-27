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
            this.addToDialogModel();
        },

        validate: function(attrs) {

        },

        addToDialogModel: function() {
            var m_id = this.get('id');
            console.info(m_id);

            console.info(entities.DialogsCollection.toJSON());
            var d_id = entities.DialogsCollection.get(m_id);
            console.info(d_id);

            var m_cl = d_id.get('messages');
            console.info(m_cl);

            m_cl.push(this);

        }
    });

    /* Message Model Collection */
    entities.MessagesCollection = Backbone.Collection.extend({
        model: entities.MessageModel,

        initialize: function() {
            this.listenTo(this, 'add', this.keepCountOfModels);
        },

        keepCountOfModels: function() {
            if (this.length > 25) {
                this.shift();
            }
        },

        updateLocalDialog: function() {
            // body...
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
            entities.DialogsCollection.push(this);
        },

        validate: function(attrs) {

        }
    });

    /* Dialog Model Collection */
    entities.DialogsCollection = Backbone.Collection.extend({
        model: entities.DialogModel
    });

    entities.DialogsCollection = new entities.DialogsCollection();

    return entities;
});
