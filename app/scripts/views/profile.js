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
    className: 'profileWrap',

    template: _.template( $('#templateProfile').html() ),

    initialize: function() {
      this.model.on('invalid', this.validateError, this);
    },

    events: {
      'click .userProfile-field_phone': 'editPhone',
      'click': 'editProfile'
    },

    render: function() {
      var template = this.$el.html( this.template(this.model.toJSON()) );
      $('.popups').append(template);
      this.delegateEvents(this.events);
      return this;
    },

    openPopup: function() {
      this.$el.find('.popup').add('.popups').addClass('is-overlay');
    },

    closePopup: function() {
      $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
    },

    editPhone: function() {
      this.$el.find('.userProfile-phone').focus();
    },

    editProfile: function(event) {
      var obj = $(event.target),
          params;
      
      if (obj.is('.profileWrap')) {
        params = {
          full_name: this.$el.find('.userProfile-filename').val(),
          phone: this.$el.find('.userProfile-phone').val(),
          status: this.$el.find('.userProfile-status-field').val()
        };
        this.model.set(params, {validate: true});
        console.log(this.model);
        if (!this.model.validationError) {
          this.model.update();
          this.remove();
          this.closePopup();
        }
      } else {
        return;
      }
    },

    validateError: function(model, error) {
      this.$el.find('.userProfile-errors').text(error);
    }
  });

  return ProfileView;

});
