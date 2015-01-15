/*
 * Q-municate chat application
 *
 * Person Model
 *
 */

define([  
  'underscore',
  'backbone',
  'config'
], function(_, Backbone, QMCONFIG) {

  var App, avatar;

  var Person = Backbone.Model.extend({
    defaults: {
      full_name: null,
      email: null,
      phone: null,
      avatar_url: QMCONFIG.defAvatar.url,
      status: null,
      facebook_id: null
    },

    validate: function(attrs) {
      var MAX_SIZE = QMCONFIG.maxLimitFile * 1024 * 1024;

      // Field: full_name
      // mandatory; 3-50 characters; could contain everything except '<', '>' and ';'
      if (!attr.full_name) {
        return 'Name is required';
      }
      if (attr.full_name.length < 3) {
        return QMCONFIG.errors.shortName;
      }
      if (/^[^><;]{0,}$/.test(attr.full_name)) {
        return QMCONFIG.errors.invalidName;
      }

      // Field: phone
      // only valid phone number; 0-20 characters
      if (attr.phone) {
        if (!/^[-0-9()+*#]{0,}$/.test(attr.phone)) {
          return QMCONFIG.errors.invalidPhone;
        }
      }

      // Field: avatar
      // only image file; not more than 10 MB; filename not more than 100 characters
      if (avatar) {
        if (/^image.{0,}$/.test(avatar.type)) {
          return QMCONFIG.errors.avatarType;
        }
        if (avatar.size > MAX_SIZE) {
          return QMCONFIG.errors.fileSize;
        }
        if (avatar.name.length > 100) {
          return QMCONFIG.errors.fileName;
        }
      }
      
    },

    parse: function(data, options) {
      if (typeof options === 'object') {
        App = options.app;
      }

      if (data.avatar) {
        avatar = data.avatar;
      }

      _.each(data, function(val, key) {
        var isHasKey = _.has(this.defaults, key);
        if (key !== 'id' && !isHasKey) {
          delete data[key];
        } else if (typeof val === 'string') {
          data[key] = val.trim();
        }
      }, this);

      return data;
    },

    initialize: function() {
      avatar = null;
    }

  });

  return Person;

});
