/*
 * Q-municate chat application
 *
 * Profile View
 *
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'config',
  'Helpers'
], function($, _, Backbone, QMCONFIG, Helpers) {

  var ProfileView = Backbone.View.extend({
    className: 'profileWrap',

    template: _.template( $('#templateProfile').html() ),

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

    closePopup: function() {
      $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
    },

    editPhone: function() {
      this.$el.find('.userProfile-phone').focus();
    },

    editProfile: function(event) {
      var obj = $(event.target),
          params;
      
      if (obj.is('.' + this.className)) {
        params = {
          full_name: this.$el.find('.userProfile-filename').val().trim(),
          phone: this.$el.find('.userProfile-phone').val().trim(),
          status: this.$el.find('.userProfile-status-field').val().trim(),
          avatar: this.$el.find('.btn_userProfile_file')[0].files[0] || null
        };
        this.model.set(params, {validate: true});
        Helpers.log(this.model);
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
      this.$el.find('.userProfile-success').text('');
    },

    chooseAvatar: function() {
      var URL = window.URL,
          avatar = this.$el.find('.btn_userProfile_file')[0].files[0],
          src = avatar ? URL.createObjectURL(avatar) : (this.model.get('avatar_url') === QMCONFIG.defAvatar.url) ? QMCONFIG.defAvatar.url : this.model.get('avatar_url');
  
      this.$el.find('.userDetails-avatar').css('background-image', "url("+src+")");
    },

    addFBAccount: function(fbId) {
      var self = this;

      this.model.connectFB(fbId, function(err, res) {
        if (err) {
          self.validateError(self.model, QMCONFIG.errors.FBAccountExists);
          self.$el.find('.btn_userProfile_connect').prop('disabled', false);
        } else {
          self.$el.find('.userProfile-field-facebook').html(
            '<span class="userDetails-label">Facebook:</span><span class="userProfile-facebook">Connected</span>'
          );
          self.$el.find('.userProfile-errors, .userProfile-success').text('');
        }
      });
    }
  });

  return ProfileView;

});
