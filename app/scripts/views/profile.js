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

    render: function() {
      var isFacebookUser = this.model.get('facebook_id');
      var template = this.$el.html( this.template(this.model.toJSON()) );
      if (isFacebookUser) {
        template.find('.userProfile-field-facebook').html(
          '<span class="userDetails-label">Facebook:</span><span class="userProfile-facebook">Connected</span>'
        );
      } else {
        template.find('.userProfile-field-facebook').html(
          '<span class="userDetails-label">Facebook:</span><span class="userProfile-facebook">Not connected</span><button class="btn_userProfile btn_userProfile_connect">Connect</button>'
        );
      }
      $('.popups').append(template);
      return this;
    },

    openPopup: function() {
      this.$el.add('.popups').addClass('is-overlay');
    }
  });

  return ProfileView;

});
