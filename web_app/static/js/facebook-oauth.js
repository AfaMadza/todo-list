const localhost = "http://localhost:5001/api";
const remotehost = "https://cecinestpasun.site/api";
const domain = localhost;

var rJSON = {
  "allTasks": undefined,
  "userInfo": {
    "name": undefined,
    "fbid": undefined,
    "email": undefined
  }
}

// FB API initializer
window.fbAsyncInit = function () {
  FB.init({
    appId: '131891487494882',
    channelUrl: 'https://www.cecinestpasun.site/',
    status: true,
    cookie: true,
    xfbml: true
  });

  $(document).trigger('fbload');
};

// Load the SDK asynchronously
(function (d) {
  var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
  if (d.getElementById(id)) { return; }
  js = d.createElement('script'); js.id = id; js.async = true;
  js.src = '//connect.facebook.net/en_US/all.js';
  ref.parentNode.insertBefore(js, ref);
}(document));

function Login () {
  FB.login(function (response) {
    if (response.authResponse) {
      getUserInfo();
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
  }, {scope: 'email,user_likes,user_videos'});
}

function buildFBHTML (userName, userId, userEmail, imgHTML) {
  let userBar = [
    '<b>id:</b> ' + userId + '<br><b>email:</b> ' + userEmail,
    '<br><input class="btn blue darken-1" type="button" value="Logout" onclick="Logout();"/>'
  ];
  let headerTheme = [
    imgHTML, '<h4 id="header-theme"><i>' + userName + '</i></h4>'
  ]
  $('header').text((''));
  $('#status').text((''));
  $('header').append(headerTheme.join(''));
  $('#status').append(userBar.join(''));
}

function buildFBError(cod, message) {
  let userBar = [
    '<strong>ERROR login failure</strong><br>',
    '<strong>' + code + '</strong><br>',
    '<p>' + message + '</p>'
  ];
  document.getElementById('status').innerHTML = userBar.join('');
}

function getRequestLoadTodoList () {
  $.ajax({
    url: domain + '/' + rJSON['userInfo']['fbid'],
    type: 'GET',
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function (data) {
      if (data != "Unknown id") {
	for (let key in data) {
	  if (!data.hasOwnProperty(key)) { continue; }
	  allTasks[key] = data[key];
	}
	todoApp.renderAllTasks();
      }
    },
    error: function (data) {
    }
  });
}

function getUserInfo () {
  FB.api('/me?fields=name,email,id', function (response) {
    if (response.error == undefined) {
      let userName = response.name;
      let userId = response.id;
      let userEmail = response.email
      rJSON['userInfo']['name'] = userName;
      rJSON['userInfo']['fbid'] = userId;
      rJSON['userInfo']['email'] = userEmail;
      FB.api('/me/picture?type=normal', function (response2) {
	let userPhoto = response2.data.url;
	rJSON['userInfo']['photo'] = userPhoto;
	let imgHTML =
	    '<img id="header-image" class="left" src="' + userPhoto + '"/>';
	buildFBHTML(userName, userId, userEmail, imgHTML);
	getRequestLoadTodoList();
      });
    } else {
      buildFBError(response.code, response.error.message);
    }
  });
}

function Logout () {
  FB.logout(function () { document.location.reload(); });
}

function checkFacebookStatus () {
  $('#save-message').text('');

  FB.getLoginStatus(function(res){
    if ( res.status == "unknown" ){
      $('#fb-status-message').text('Logged Out');
    } else if ( res.status === 'connected' ) {
      getUserInfo()
      $('#fb-status-message').text('');
      let fbConnect =
	  '<i class="fa fa-facebook-square"></i> Connected to Facebook';
      $('#fb-status-message').append(fbConnect);
    }
  });
  FB.Event.subscribe('auth.authResponseChange', function (response) {
    if (response.status === 'connected') {
      $('#fb-status-message').text('Connected to Facebook');
    } else if (response.status === 'not_authorized') {
      $('#fb-status-message').text('Failed to Connect');
    } else {
      $('#fb-status-message').text('Logged Out');
    }
  });
}

function postRequestSaveTodoList () {
  if (typeof rJSON['userInfo']['name'] == 'undefined' ||
      typeof rJSON['userInfo']['fbid'] == 'undefined' ||
      typeof rJSON['userInfo'] ['email'] == 'undefined') {
    $('#save-message').text('');
    let newData = [
      '<div class="left">',
      '<i class="fa fa-exclamation-triangle left" aria-hidden="true"></i>',
      ' you must authenticate to save!</div>'
    ]
    $('#save-message').append(newData.join(''))
  } else {
    rJSON['allTasks'] = allTasks;
    $.ajax({
      url: domain,
      type: 'POST',
      data: JSON.stringify(rJSON),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      success: function (data) {
	$('#save-message').text('');
	let newData = [
	  '<div class="left">',
	  '<i class="fa fa-telegram" aria-hidden="true"></i>',
	  ' ' + JSON.stringify(data) + '</div>'
	]
	$('#save-message').append(newData.join(''))
      },
      error: function (data) {
	$('#save-message').text('');
	let newData = [
	  '<div class="left">',
	  '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>',
	  ' error saving! <br>',
	  JSON.stringify(data),
	  '</div>'
	]
	$('#save-message').append(newData.join(''))
      }
    });
  }
}

$(document).ready(function () {
  $(document).on('fbload', checkFacebookStatus);
  $('#saveTodoList').on('click', postRequestSaveTodoList );
});
