/*
 * Q-municate chat application
 *
 * VideoChat Module
 *
 */

define(['jquery', 'quickblox'], function($, QB) {

  function VideoChat(app) {
    this.app = app;
  }

  VideoChat.prototype.getUserMedia = function(options, className, callback) {
    var User = this.app.models.User;
    var callType = (typeof className === 'string' && !!className.match(/videoCall/)) || (className === 1) ? 'video' : 'audio';
    var params = {
      audio: true,
      video: callType === 'video' ? true : false,
      elemId: 'localStream',
      options: {
        muted: true,
        mirror: true
      }
    };

    QB.webrtc.getUserMedia(params, function(err, stream) {
      if (err) {
        console.log(err);
      } else {
        console.log(stream);

        if (!$('.l-chat[data-dialog="'+options.dialogId+'"]').find('.mediacall')[0]) {
          stream.stop();
          return true;
        }

        if (options.isCallee) {
          QB.webrtc.createPeer({
            sessionID: options.sessionId,
            description: options.sdp
          });
          QB.webrtc.accept(options.opponentId, {
            dialog_id: options.dialogId
          });
        } else {
          QB.webrtc.createPeer();
          QB.webrtc.call(options.opponentId, callType, {
            dialog_id: options.dialogId,
            avatar: User.contact.avatar_url,
            full_name: User.contact.full_name
          });
        }
        callback();
      }
    });
  };

  return VideoChat;

});
