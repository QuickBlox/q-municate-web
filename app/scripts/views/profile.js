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

  var App;

  var ProfileView = Backbone.View.extend({
    tagName: 'section',
    id: 'popupProfile',
    className: 'popup popup_profile',

    initialize: function(params) {
      if (typeof params === 'object') {
        App = params.app;
      }
    },

    render: function() {
      var html = '<div class="userDetails-preview"><div class="userDetails-avatar"></div><div class="userDetails-info"><h3 class="userProfile-filename-wrap"><span class="userProfile-filename editable-profile" contenteditable="true"></span><span class="userProfile-header-pencil"></span></h3><div style="clear:both"></div><button class="btn_userProfile btn_userProfile_photo">Set Profile Photo</button><button class="btn_userProfile btn_changePassword">Change password</button><input class="btn_userProfile_file" type="file" accept="image/*"></div></div><div class="userProfile-chatStatus">Status</div><div class="userProfile-status-field userProfile-edit"><span class="userProfile-status-val editable-profile" contenteditable="true"></span></div><div class="userProfile-field"><span class="userDetails-label">Email:</span><span class="userProfile-email"></span></div><div class="userProfile-field userProfile-edit"><span class="userDetails-label">Phone:</span><span class="userProfile-phone editable-profile" contenteditable="true"></span></div><div class="userProfile-field userProfile-field-facebook"></div><div class="userProfile-errors"></div>';
      $('.popups').append( this.$el.html(html) );
      return this;
    },

    openPopup: function() {
      this.$el.add('.popups').addClass('is-overlay');
    }
  });

  return ProfileView;

});
