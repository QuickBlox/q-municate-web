/*
 * Q-municate chat application
 *
 * Contact Model
 *
 */

module.exports = Contact;

function Contact(qbUser) {
  this.id = qbUser.id;
  this.facebook_id = qbUser.facebook_id;
  this.full_name = qbUser.full_name;
  this.email = qbUser.email;
  this.blob_id = qbUser.blob_id;
  
  if (qbUser.blob_id) {
    try {
      this.avatar_url = JSON.parse(qbUser.custom_data).avatar_url;
    } catch(err) {
      // qbUser.website - temporary storage of avatar url for mobile apps (14.07.2014)
      this.avatar_url = qbUser.website || qbUser.avatar_url || QMCONFIG.defAvatar.url;
    }
  } else {
    facebookAvatar(this);
  }

  try {
    this.status = JSON.parse(qbUser.custom_data).status || null;
  } catch(err) {
    // qbUser.custom_data - temporary storage of status message for mobile apps (14.07.2014)
    this.status = qbUser.custom_data || qbUser.status || null;
  }

  this.tag = qbUser.user_tags || qbUser.tag || null;
  this.xmpp_jid = QB.chat.helpers.getUserJid(qbUser.id, QMCONFIG.qbAccount.appId);
}

/* Private
---------------------------------------------------------------------- */
function facebookAvatar(contact) {
  if (contact.facebook_id) {
    // Note! Getting an user's picture faster than in second case below
    contact.avatar_url = 'https://graph.facebook.com/' + contact.facebook_id + '/picture?width=146&height=146';

    // FB.api('/' + contact.facebook_id + '/picture', {redirect: false, width: 146, height: 146},
    //         function (avatar) {
    //           //if (QMCONFIG.debug) console.log('FB user picture', avatar);

    //           // checking if the avatar is a default Facebook avatar
    //           contact.avatar_url = avatar.data.is_silhouette ? QMCONFIG.defAvatar.url : avatar.data.url;
    //         }
    // );
  } else {
    contact.avatar_url = QMCONFIG.defAvatar.url;
  }
}
