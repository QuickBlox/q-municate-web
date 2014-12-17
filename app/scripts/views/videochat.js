/*
 * Q-municate chat application
 *
 * VideoChat View Module
 *
 */

define(['jquery', 'quickblox'], function($, QB) {

  function VideoChatView(app) {
    this.app = app;
  }

  VideoChatView.prototype.init = function() {
    $('.l-content').on('click', '.videoCall', function() {
      console.log(111);
    });

    $('.l-content').on('click', '.audioCall', function() {
      console.log(222);
    });
  };

  return VideoChatView;

});


// var params = {
//   audio: true,
//   video: true,
//   elemId: 'localStream',
//   options: {
//     muted: true,
//     mirror: true
//   }
// };

// webrtc.getUserMedia(params, function(stream, err) {
//   if (stream) {
//     console.log(stream);
//     webrtc.attachMediaStream('remoteStream', stream, {muted:true});
//   } else {
//     console.log(err);
//   }
// });

// var video = document.getElementById('localStream');
// if (video) {
//   video.addEventListener('timeupdate', function() {
//     var time = Math.floor(video.currentTime),
//         h, min, sec;

//     h = Math.floor( time / 3600 );
//     h = h >= 10 ? h : '0' + h;
//     min = Math.floor( time / 60 );
//     min = min >= 10 ? min : '0' + min;
//     sec = Math.floor( time % 60 );
//     sec = sec >= 10 ? sec : '0' + sec;

//     $('.mediacall-info-duration, .mediacall-remote-duration').text(h + ':' + min + ':' + sec);
//   });
// }