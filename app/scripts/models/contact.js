/*
 * Q-municate chat application
 *
 * Contact Module
 *
 */
define([
    'config',
    'quickblox'
], function(
    QMCONFIG,
    QB
) {

    function Contact(app) {
        this.app = app;
    }

    Contact.prototype = {

        create: function(qbUser) {
            return {
                id: qbUser.id,
                full_name: qbUser.full_name || 'Unknown user',
                email: qbUser.email || '',
                phone: qbUser.phone || '',
                facebook_id: qbUser.facebook_id || null,
                is_provider: !!qbUser.facebook_id || !!qbUser.phone || false,
                blob_id: qbUser.blob_id || null,
                user_tags: qbUser.tag || qbUser.user_tags || null,
                avatar_url: getAvatar(qbUser),
                status: qbUser.status || getStatus(qbUser) || '',
                user_jid: qbUser.user_jid || QB.chat.helpers.getUserJid(qbUser.id, QMCONFIG.qbAccount.appId),
                custom_data: qbUser.custom_data || null
            };
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function getAvatar(contact) {
        var avatar;

        if (contact.custom_data) {
            contact.avatar_url = JSON.parse(contact.custom_data).avatar_url;
        }

        if (contact.avatar_url) {
            avatar = contact.avatar_url;
        } else if (contact.facebook_id) {
            avatar = 'https://graph.facebook.com/v2.9/' + contact.facebook_id + '/picture?width=240&height=240';
        } else {
            avatar = QMCONFIG.defAvatar.url;
        }

        avatar.replace('http://', 'https://');

        return avatar;
    }

    function getStatus(contact) {
        return contact.custom_data && JSON.parse(contact.custom_data).status || '';
    }

    return Contact;

});
