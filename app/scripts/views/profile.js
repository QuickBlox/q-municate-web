/*
 * Q-municate chat application
 *
 * Profile View
 *
 */

define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone) {

  var ProfileView = Backbone.View.extend({
    tagName: 'section',
    id: 'popupProfile',
    className: 'popup popup_profile',

    template: _.template( $('#templateProfile').html() ),

    initialize: function() {
      
    },

    events: {
      'click .userProfile-field_phone': 'editPhone'
    },

    render: function() {
      var template = this.$el.html( this.template(this.model.toJSON()) );
      $('.popups').append(template);
      this.delegateEvents(this.events);
      return this;
    },

    openPopup: function() {
      this.$el.add('.popups').addClass('is-overlay');
    },

    editPhone: function() {
      this.$el.find('.userProfile-phone').focus();
    }
  });

  return ProfileView;

});
