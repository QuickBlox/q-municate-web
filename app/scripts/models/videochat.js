/*
 * Q-municate chat application
 *
 * VideoChat Module
 *
 */

define(['quickblox'], function(QB) {

  function VideoChat(app) {
    this.app = app;
  }

  VideoChat.prototype.getUserMedia = function(options, className, callback) {
    var User = this.app.models.User;
    var callType = className && !!className.match(/videoCall/) ? 'video' : 'audio';
    var params = {
      audio: true,
      video: true,
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
