/*
 * Q-municate chat application
 *
 * Contact Module
 *
 */

define(['config', 'quickblox'], function(QMCONFIG, QB) {

  function Contact(app) {
    this.app = app;
  }

  Contact.prototype = {

    create: function(qbUser) {
      return {
        id: qbUser.id,
        full_name: qbUser.full_name,
        email: qbUser.email,
        phone: qbUser.phone || '',
        facebook_id: qbUser.facebook_id || null,
        blob_id: qbUser.blob_id || null,
        user_tags: qbUser.tag || qbUser.user_tags || null,
        avatar_url: (qbUser.avatar_url || getAvatar(qbUser)).replace('http://', 'https://') || QMCONFIG.defAvatar.url,
        status: qbUser.status || getStatus(qbUser),
        user_jid: qbUser.user_jid || QB.chat.helpers.getUserJid(qbUser.id, QMCONFIG.qbAccount.appId),
        custom_data: qbUser.custom_data || null
      };
    }

  };

  /* Private
  ---------------------------------------------------------------------- */
  function getAvatar(contact) {
    var avatar;

    avatar = contact.custom_data && JSON.parse(contact.custom_data).avatar_url;
    if (!avatar) {
      if (contact.facebook_id) {
        avatar = 'https://graph.facebook.com/v2.2/' + contact.facebook_id + '/picture?width=146&height=146';
      } else {
        avatar = QMCONFIG.defAvatar.url;
      }
    }

    return avatar;
  }

  function getStatus(contact) {
    return contact.custom_data && JSON.parse(contact.custom_data).status || '';
  }

  return Contact;

});
