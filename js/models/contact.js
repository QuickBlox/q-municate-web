/*
 * Q-municate chat application
 *
 * Contact Module
 *
 */

module.exports = Contact;

function Contact(app) {
  this.app = app;
}

Contact.prototype = {

  create: function(qbUser) {
    return {
      id: qbUser.id,
      facebook_id: qbUser.facebook_id,
      full_name: qbUser.full_name,
      email: qbUser.email,
      blob_id: qbUser.blob_id,
      avatar_url: (qbUser.avatar_url || getAvatar(qbUser)).replace('http://', 'https://'),
      status: qbUser.status || getStatus(qbUser),
      tag: qbUser.tag || qbUser.user_tags || null,
      user_jid: qbUser.user_jid || QB.chat.helpers.getUserJid(qbUser.id, QMCONFIG.qbAccount.appId)
    };
  }

};

/* Private
---------------------------------------------------------------------- */
function getAvatar(contact) {
  var avatar;

  if (contact.blob_id) {
    try {
      avatar = JSON.parse(contact.custom_data).avatar_url;
    } catch(err) {
      // contact.website - temporary storage of avatar url for mobile apps (14.07.2014)
      avatar = contact.website;
    }
  } else {
    if (contact.facebook_id) {
      avatar = 'https://graph.facebook.com/' + contact.facebook_id + '/picture?width=146&height=146';
    } else {
      avatar = QMCONFIG.defAvatar.url;
    }
  }

  return avatar;
}

function getStatus(contact) {
  var status;
  
  try {
    status = JSON.parse(contact.custom_data).status || null;
  } catch(err) {
    // contact.custom_data - temporary storage of status message for mobile apps (14.07.2014)
    status = contact.custom_data || null;
  }

  return status;
}
