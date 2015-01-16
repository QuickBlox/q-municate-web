/*
 * Q-municate chat application
 *
 * Change Password View
 *
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'config'
], function($, _, Backbone, QMCONFIG) {

  var ChangePassView = Backbone.View.extend({
    className: 'passWrap',

    template: _.template( $('#templateChangePass').html() ),

    initialize: function() {
      this.model.on('invalid', this.validateError, this);
    },

    events: {
      'click .userProfile-field_phone': 'editPhone',
      'click': 'editProfile',
      'change .btn_userProfile_file': 'chooseAvatar'
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

    validateError: function(model, error) {
      this.$el.find('.changePass-errors').text(error);
    }
  });

  return ChangePassView;

});
