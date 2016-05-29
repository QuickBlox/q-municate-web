/**
 * 
 * htmlQM Module
 * 
 */

define(['jquery', 'underscore', 'MainModule', 'Helpers'], function($, _, QM, Helpers) {
  var QMHtml = {};

  QMHtml.VideoChat = {

    onCallTpl: function(params) {
      var htmlTemplate = _.template('<div class="incoming-call l-flexbox l-flexbox_column l-flexbox_flexbetween">'+
          '<div class="incoming-call-info l-flexbox l-flexbox_column">'+
          '<div class="message-avatar avatar info-avatar" style="background-image:url(<%= userAvatar %>)"></div>'+
          '<span class="info-notice"><%= callTypeUС %> Call from <%= userName %></span></div>'+
          '<div class="incoming-call-controls l-flexbox l-flexbox_flexcenter">'+
          '<button class="btn_decline" data-callType="<%= callType %>" data-dialog="<%= dialogId %>"'+
          ' data-id="<%= userId %>">Decline</button>'+
          '<button class="btn_accept" data-callType="<%= callType %>" data-session="<%= sessionId %>"'+
          ' data-dialog="<%= dialogId %>" data-id="<%= userId %>">Accept</button>'+
          '</div></div>')(params);

      return htmlTemplate;
    },

    buildTpl: function(params) {
      var htmlTemplate = _.template('<div class="mediacall l-flexbox">'+
          '<video id="remoteStream" class="mediacall-remote-stream is-hidden"></video>'+
          '<video id="localStream" class="mediacall-local mediacall-local-stream is-hidden"></video>'+
          '<img id="localUser" class="mediacall-local mediacall-local-avatar" src="<%=userAvatar%>" alt="avatar">'+
          '<div id="remoteUser" class="mediacall-remote-user l-flexbox l-flexbox_column">'+
          '<img class="mediacall-remote-avatar" src="<%=contactAvatar%>" alt="avatar">'+
          '<span class="mediacall-remote-name"><%=contactName%></span></div>'+
          '<div class="mediacall-info l-flexbox l-flexbox_column l-flexbox_flexcenter">'+
          '<img class="mediacall-info-logo" src="images/logo-qmunicate-transparent.svg" alt="Q-municate">'+
          '<span class="mediacall-info-duration">connect...</span></div>'+
          '<div class="mediacall-controls l-flexbox l-flexbox_flexcenter">'+
          '<button class="btn_mediacall btn_full-mode" data-id="<%=userId%>" data-dialog="<%=dialogId%>" disabled>'+
          '<div id="fullModeOn" class="btn-icon_mediacall"></div>'+
          '<div id="fullModeOff" class="btn-icon_mediacall"></div></button>'+
          '<button class="btn_mediacall btn_camera_off" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'+
          '<img class="btn-icon_mediacall" src="images/icon-camera-off.svg" alt="camera"></button>'+
          '<button class="btn_mediacall btn_mic_off" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'+
          '<img class="btn-icon_mediacall" src="images/icon-mic-off.svg" alt="mic"></button>'+
          '<button class="btn_mediacall btn_hangup" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'+
          '<img class="btn-icon_mediacall" src="images/icon-hangup.svg" alt="hangup"></button>'+
          '</div></div>')(params);

      return htmlTemplate;
    },

    showError: function() {
      var isBottom = Helpers.isBeginOfChat(),
          $chat = $('.l-chat:visible'),
          $html = $('<article class="message message_service l-flexbox l-flexbox_alignstretch">'+
                    '<span class="message-avatar request-button_pending"></span>'+
                    '<div class="message-container-wrap">'+
                    '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">'+
                    '<div class="message-content"><h4 class="message-author message-error">Camera and/or microphone wasn\'t found.'+
                    '</h4></div></div></div></article>');

      $chat.find('.mCSB_container').append($html);

      if (isBottom) {
        $chat.find('.scrollbar_message').mCustomScrollbar('scrollTo', 'bottom');
      }
    },

    noWebRTC: function() {
      var isBottom = Helpers.isBeginOfChat(),
          $chat = $('.l-chat:visible'),
          $html = $('<article class="message message_service l-flexbox l-flexbox_alignstretch">'+
                    '<span class="message-avatar request-button_pending"></span>'+
                    '<div class="message-container-wrap">'+
                    '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">'+
                    '<div class="message-content"><h4 class="message-author message-error">'+
                    'Audio and Video calls aren\'t supported by your browser. Please use Google Chrome, Opera or Firefox.'+
                    '</h4></div></div></div></article>');

      $chat.find('.mCSB_container').append($html);

      if (isBottom) {
        $chat.find('.scrollbar_message').mCustomScrollbar('scrollTo', 'bottom');
      }
    }

  };

  QMHtml.User = {

    contactPopover: function(params, roster) {
      var $html = $('<ul class="list-actions list-actions_contacts popover"></ul>'),
          htmlStr = '';

      if (params.dialogType === 3 && roster && roster.subscription !== 'none') {
        htmlStr = '<li class="list-item"><a class="videoCall list-actions-action writeMessage" data-id="<%=ids%>" href="#">Video call</a></li>'+
                  '<li class="list-item"><a class="audioCall list-actions-action writeMessage" data-id="<%=ids%>" href="#">Audio call</a></li>'+
                  '<li class="list-item"><a class="list-actions-action createGroupChat" data-ids="<%=ids%>" data-private="1" href="#">Add people</a></li>';
      } else if (params.dialogType !== 3) {
        htmlStr = '<li class="list-item"><a class="list-actions-action addToGroupChat" data-group="true" data-ids="<%=occupantsIds%>" '+
                  'data-dialog="<%=dialogId%>" href="#">Add people</a></li>';
      }

      if (params.dialogType === 3) {
        htmlStr += '<li class="list-item"><a class="list-actions-action userDetails" data-id="<%=ids%>" href="#">Profile</a></li>'+
                   '<li class="list-item"><a class="deleteContact list-actions-action" href="#">Delete contact</a></li>';
      } else {
        htmlStr += '<li class="list-item"><a class="leaveChat list-actions-action" data-group="true" href="#">Leave chat</a></li>';
      }

      return $html.append(_.template(htmlStr)(params));
    },

    occupantPopover: function(params, roster) {
      var $html = $('<ul class="list-actions list-actions_occupants popover"></ul>'),
          htmlStr = '';

      if (!roster || (roster.subscription === 'none' && !roster.ask)) {
        htmlStr = '<li class="list-item" data-jid="<%=jid%>"><a class="list-actions-action requestAction" data-id="<%=id%>" href="#">Send request</a></li>';
      } else if (roster.ask === 'subscribe' && !roster.status) {
        htmlStr = '<li class="list-item"><a class="list-actions-action userDetails" data-id="<%=id%>" href="#">Profile</a></li>'+
                  '<li class="list-item"><a class="deleteContact list-actions-action" data-id="<%=id%>" href="#">Delete contact</a></li>';
      } else {
        htmlStr = '<li class="list-item"><a class="videoCall list-actions-action writeMessage" data-id="<%=id%>" href="#">Video call</a></li>'+
                  '<li class="list-item"><a class="audioCall list-actions-action writeMessage" data-id="<%=id%>" href="#">Audio call</a></li>'+
                  '<li class="list-item"><a class="list-actions-action writeMessage" data-id="<%=id%>" href="#">Write message</a></li>'+
                  '<li class="list-item"><a class="list-actions-action userDetails" data-id="<%=id%>" href="#">Profile</a></li>';
      }

      return $html.append(_.template(htmlStr)(params));
    },

    getControlButtonsForPopupDetails: function(roster) {
      var $html = $('#popupDetails').find('.userDetails-controls'),
          htmlStr = '',
          params = {
            roster: 'ask_subscription'
          };

      if (roster.subscription !== 'none' && roster.ask === null) {
        params.roster = '';
        htmlStr = '<button class="btn_userDetails writeMessage videoCall"><img src="images/icon-videocall.svg" alt="videocall">Video Call</button>'+
                  '<button class="btn_userDetails writeMessage audioCall"><img src="images/icon-audiocall.svg" alt="videocall">Call</button>';
      }

      htmlStr += '<button class="btn_userDetails <%=roster%> writeMessage"><img src="images/icon-message.png" alt="videocall">Message</button>'+
                 '<button class="btn_userDetails <%=roster%> deleteContact"><img src="images/icon-delete.svg" alt="videocall">Delete</button>';

      $html.empty();
      $html.append(_.template(htmlStr)(params));
    } 

  };

  QMHtml.message = {

    setMap: function(params) {
      var htmlTemplate = _.template('<div class="popover_map"><a class="open_map" href="<%=mapLink%>" target="_blank">'+
                                    '<image class="static_map" src="<%=imgUrl%>"></a><div class="coner"><i class="icon_coner">'+
                                    '</i></div></div>')(params);
                                    
      $('article#'+params.id).find('.message-geo')
       .addClass('with-geo')
       .append(htmlTemplate);
    }

  };

  return QMHtml;
});
