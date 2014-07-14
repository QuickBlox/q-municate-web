/*
 * Q-municate chat application
 *
 * Contact Model
 *
 */

module.exports = Contact;

function Contact() {
  this.id = null;
  this.facebook_id = null;
  this.full_name = null;
  this.email = null;
  this.blob_id = null;
  this.avatar = QMCONFIG.defAvatar.url;
  this._tag = null;
}
