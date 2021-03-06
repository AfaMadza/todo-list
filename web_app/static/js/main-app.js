const localhost = 'http://localhost:5001/api';
const remotehost = 'https://cecinestpasun.site/todo/api';
const domain = localhost;
const rJSON = {
  'allTasks': undefined,
  'userInfo': {
    'name': undefined,
    'fbid': undefined,
    'email': undefined
  }
};

/**
 * buildFBHTML
 * creates the Facebook header and login sections with custom data
 * @userName {String} the users name
 * @userId {String} the users facebook ID
 * @userEmail {String} the users email from FB
 * @imgHTML {String} the users image link
 */
function buildFBHTML (userName, userId, userEmail, imgHTML) {
  let userBar = [
    '<br><input class="btn waves-effect waves-light btn-large blue darken-1" ',
    'type="button" value="Logout" onclick="Logout();"/>'
  ];
  let headerImgName = [
    imgHTML, '<h4 id="header-theme"><i>' + userName + '</i></h4>'
  ];
  let headerIdEmail = [
    '<b>id:</b> ' + userId + '<br><b>email:</b> ' + userEmail
  ];
  let imgName = $('#header-img-name');
  let idEmail = $('#header-id-email');
  let status = $('#status');
  imgName.text('');
  idEmail.text('');
  status.text('');
  imgName.append(headerImgName.join(''));
  idEmail.append(headerIdEmail.join(''));
  status.append(userBar.join(''));
}

/**
 * buildFBError
 * renders error if there is one
 * @code {Int} the error code
 * @message {String} the error message
 */
function buildFBError (code, message) {
  $('#status').text('');
  let userBar = [
    '<strong>ERROR login failure</strong><br>',
    '<strong>' + code + '</strong><br>',
    '<p>' + message + '</p>'
  ];
  $('#status').append(userBar.join(''));
}

/**
 * getRequestLoadTodoList
 * makes get request to backend to check for user data
 */
function getRequestLoadTodoList () {
  let token = $('.todo-bearer-token').attr('id');
  $.ajax({
    url: domain + '/' + rJSON['userInfo']['fbid'] + '/' + token,
    type: 'GET',
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function (data) {
      let newData;
      if (data['error'] === undefined) {
        for (let key in data) {
          if (!data.hasOwnProperty(key)) { continue; }
          allTasks[key] = data[key];
        }
        $('#save-message').text('');
        newData = [
          '<i class="fa fa-tasks" aria-hidden="true"></i>',
          '  Tasks Loaded!</div>'
        ];
        $('#save-message').append(newData.join(''));
        todoListApp.renderAllTasks();
      } else {
        $('#save-message').text('');
        let message = data['error'];
        newData = [
          '<div class="center">',
          '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>',
          message + '</div>'
        ];
        $('#save-message').append(newData.join(''));
      }
    },
    error: function (data) {
      console.log(data);
    }
  });
}

/**
 * getUserInfo
 * makes Facebook API request to get all user information
 */
function getUserInfo () {
  FB.api('/me?fields=name,email,id', function (response) {
    if (response.error === undefined) {
      let userName = response.name;
      let userId = response.id;
      let userEmail = response.email;
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

/**
 * updateFBStatusBox
 * updates the HTML in the status section for FB status
 */
function updateFBStatusBox (message) {
  $('#fb-status-message').text('');
  let fbConnect =
      '<i class="fa fa-facebook-square"></i> ' + message;
  $('#fb-status-message').append(fbConnect);
}

/**
 * handleDevelopmentAccount
 * populates data with development account info when unable to connect to FB
 */
function handleDevelopmentAccount () {
  rJSON['userInfo']['name'] = DEVELOPMENT_FB_NAME;
  rJSON['userInfo']['fbid'] = DEVELOPMENT_FB_ID;
  rJSON['userInfo']['email'] = DEVELOPMENT_FB_EMAIL;
  rJSON['userInfo']['photo'] = DEVELOPMENT_FB_PHOTO;
  let imgHTML =
      '<img id="header-image" class="left" src="' + DEVELOPMENT_FB_PHOTO + '"/>';
  buildFBHTML(
    DEVELOPMENT_FB_NAME, DEVELOPMENT_FB_ID, DEVELOPMENT_FB_EMAIL, imgHTML
  );
  updateFBStatusBox('Not Connected to Facebook');
  getRequestLoadTodoList();
}

/**
 * checkFacebookStatus
 * checks user Facebook login/ authentication status
 */
function checkFacebookStatus () {
  $('#save-message').text('');

  /**
   * Enable this for Development
   * Need to ping this to automate this service:
   * https://www.facebook.com/connect/ping?client_id=131891487494882&
   * domain=localhost&origin=1&redirect_uri=http%3A%2F%2Fstaticxx.facebook.com
   * %2Fconnect%2Fxd_arbiter%2Fr%2FlY4eZXm_YWu.js%3Fversion%3D42%23cb%3Df18520
   * 5a172cd8%26domain%3Dlocalhost%26origin%3Dhttp%253A%252F%252Flocalhost%253
   * A5001%252Ff1ffe8d880867e8%26relation%3Dparent&response_type=token%2Csigne
   * d_request%2Ccode&sdk=joey
   */
  handleDevelopmentAccount();
  return;
  FB.getLoginStatus(function (res) {
    if (res.status === 'unknown') {
      updateFBStatusBox('Logged Out');
    } else if (res.status === 'connected') {
      getUserInfo();
      updateFBStatusBox('Connected to Facebook');
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

/**
 * postRequestSaveTodoList
 * saves Todo list on backend if authenticated
 */
function postRequestSaveTodoList () {
  let newData;
  if (typeof rJSON['userInfo']['name'] === 'undefined' ||
      typeof rJSON['userInfo']['fbid'] === 'undefined' ||
      typeof rJSON['userInfo']['email'] === 'undefined') {
    $('#save-message').text('');
    newData = [
      '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>',
      ' you must authenticate to save!</div>'
    ];
    $('#save-message').append(newData.join(''));
  } else {
    rJSON['allTasks'] = allTasks;
    rJSON['token'] = $('.todo-bearer-token').attr('id');
    $.ajax({
      url: domain,
      type: 'POST',
      data: JSON.stringify(rJSON),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      success: function (data) {
        let message;
        if (data['error'] === undefined) {
          message = data['success'];
          $('#save-message').text('');
          newData = [
            '<i class="fa fa-telegram" aria-hidden="true"></i>',
            ' ' + message + '</div>'
          ];
          $('#save-message').append(newData.join(''));
        } else {
          message = data['error'];
          $('#save-message').text('');
          newData = [
            '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>',
            message + '</div>'
          ];
          $('#save-message').append(newData.join(''));
        }
      },
      error: function (data) {
        console.log(data);
      }
    });
  }
}

$(document).ready(function () {
  $(function () {
    $('ul.collection').sortable({
      handle: 'i.icon-move'
    });
  });
  const todoApp = new todoListApp();
  setDateTimes();
  $('select').material_select();
  $(document).on('fbload', checkFacebookStatus);
  $('#saveTodoList').on('click', postRequestSaveTodoList);
});
