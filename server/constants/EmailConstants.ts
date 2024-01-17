import settings from '../../variableSettings';

export default class EmailConstants {
  static WELCOME_SUBJECT = 'Welcome to BoardX';
  static EMAIL = 'boardx team<noreply@www.boardx.us>';
  static USER_SUBJECT = 'New member registered BoardX through your Invitation';
  static INVITE_USER_TO_ROOM_SUBJECT = 'You are invited to BoardX room: {0}';
  static INVITE_USER_TO_ORGANIZATION_REGISTER_SUBJECT =
    'You are invited to organization in BoardX: {0}';
  static INVITE_TO_ORGANIZATION_SUBJECT = 'You are invited to {0} in BoardX';
  static INVITE_TO_ROOM_SUBJECT = 'You are invited to room in BoardX: {0}';
  static MENTION_SUBJECT = 'You have recive a reply';
  static REGISTRATION_EMAIL_INVITATION = `<html><head>
  <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
  <style>
  body {font-family: 'sans-serif';font-size: 22px;}
  </style>
  </head>
  <body style="margin:20px">
    <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
    <p style="font-family:sans-serif, sans serif;font-size:16px">
      Hi {0},
    </p>
    <p style="font-family:sans-serif;font-size:36px"> <b>{1} </b> has accepted your invitation to BoardX  </p>
    <p style="font-family:sans-serif;font-size:16px">
      Click the button below to visit BoardX.
    </p>
    <p style="font-family:sans-serif ;font-size:16px">  
      <a href="https://app.boardx.us/recent">
        <button  style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px ">Go to BoardX</button>
      </a>
    </p>
  </body>
  </html>
  `;
  static REGISTRATION_EMAIL_ORGANIZATION = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body style="margin:20px">
      <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
      <p style="font-family:sans-serif, sans serif;font-size:16px">
        Hi {0},
      </p>
      <p style="font-family:sans-serif;font-size:36px"> <b>{1} </b> has accepted your invitation to BoardX organization:  <b>{2} </p>
      <p style="font-family:sans-serif;font-size:16px">
        Click the button below to visit BoardX.
      </p>
      <p style="font-family:sans-serif ;font-size:16px">  
        <a href="https://app.boardx.us/recent">
          <button  style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px ">Go to BoardX</button>
        </a>
      </p>
    </body>
    </html>
    `;

  static REGISTRATION_EMAIL_ROOM = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body style="margin:20px, color: #000">
      <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
      <p style="font-family:sans-serif, sans serif;font-size:16px">
        Hi {0},
      </p>
      <p style="font-family:sans-serif;font-size:36px"> <b>{1} </b> has accepted your invitation to BoardX Room:  <b>{2} </p>
      <p style="font-family:sans-serif, sans serif;font-size:16px">
        Click the button below to visit BoardX.
      </p>
      <p style="font-family:sans-serif, sans serif;font-size:16px">
        <a href="https://app.boardx.us/room/{3}">
          <button style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px ">Go to BoardX</button>
        </a>
      </p>
    </body>
    </html>
    `;

  static INVITE_USER_TO_ROOM_EMAIL = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
    <div style="width: 100%;height: 100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
        <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
          <img src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
          <p style="font-family:sans-serif;font-size:36px;margin-bottom: 24px;line-height: 50px;"> <b>{0} </b> has added you to<br /> <b>{1} </b> room</p>
          <p style="font-family:sans-serif;font-size:16px;line-height: 24px;margin-bottom: 0;">{2} has added you to the {3} room in the Acme <br />Inc. Click below to start collaborating with {4}.</p>
          <br />
          <a href="{5}">
            <button style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top: -8px;">Visit Room</button>
          </a>
        </div>
    </div>
    </body>
    </html>
    `;
  static INVITE_USER_TO_ROOM_EMAIL_ZH_CN = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
    <div style="width: 100%;height: 100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
        <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
          <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
          <p style="font-family:sans-serif;font-size:36px;margin-bottom: 24px;line-height: 50px;"> <b>{0} </b> 已邀请你加入<br /> <b>{1} </b> 房间</p>
          <p style="font-family:sans-serif;font-size:16px;line-height: 24px;margin-bottom: 0;">{2} 已邀请你加入 {3} 房间，点击下方 <br />按键查看房间，并开始与 {4} 协作。</p>
          <br />
          <a href="{5}">
            <button style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top: -8px;">查看房间</button>
          </a>
        </div>
    </div>
    </body>
    </html>
    `;
  static INVITE_NON_EXISTING_USER_TO_ORGANIZATION_REGISTER_EMAIL = `<html><head>
      <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
      <style>
      body {font-family: 'sans-serif';font-size: 22px;}
      </style>
      </head>
      <body>
        <div style="width: 100%;height: 100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
          <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
            <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
            <p style="font-family:sans-serif;font-size:36px;margin-bottom:24px;line-height:50px;"> <b>{0} </b> has invited you to BoardX Organization:  <b>{1} </b> </p>
            <p style="font-family:sans-serif;font-size:16px;line-height:24px;margin-bottom:0;">
              Click the button below to register an account and start the collaboration.
            </p>
            <p style="font-family:sans-serif, sans serif;font-size:16px">
              <a href="{2}">
                <button  style="padding:16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top:-8px;">Join Now</button>
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  static INVITE_NON_EXISTING_USER_TO_ORGANIZATION_REGISTER_EMAIL_ZH_CN = `<html><head>
      <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
      <style>
      body {font-family: 'sans-serif';font-size: 22px;}
      </style>
      </head>
      <body>
        <div style="width: 100%;height: 100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
          <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
            <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
            <p style="font-family:sans-serif;font-size:36px;margin-bottom: 24px;line-height: 50px;"> <b>{0} </b> 邀请你加入BoardX团队:  <b>{1} </b> </p>
            <p style="font-family:sans-serif, sans serif;font-size:16px">
              单击下面的按钮注册一个帐户并开始协作。
            </p>
            <p style="font-family:sans-serif;font-size:16px;line-height:24px;margin-bottom:0;">
              <a href="{2}">
                <button style="padding:16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top:-8px;">现在加入</button>
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  static INVITE_EXISTING_USER_TO_ORGANIZATION_EMAIL = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
     <div style="width: 100%;height: 100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
        <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
          <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
          <p style="font-family:sans-serif;font-size:36px;margin-bottom: 24px;line-height: 50px;">
            <b>{0} </b> has invited you to <b><br />{1} </b> on BoardX
          </p>
          <p style="font-family:sans-serif;font-size:16px;line-height: 24px;margin-bottom: 0;">
            BoardX is a digital workspace that empowers people to<br /> collaborate and create. Click below to join the team {2}.
          </p>
          <br />
          <a href={4}>
            <button style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top: -8px;">Get Started</button>
          </a>
        </div>
    </div>
    </body>
    </html>
    `;
  static INVITE_EXISTING_USER_TO_ORGANIZATION_EMAIL_ZH_CN = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
     <div style="width: 100%;height: 100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
        <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
          <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
          <p style="font-family:sans-serif;font-size:36px;margin-bottom:24px;line-height:50px;">
            <b>{0} </b> 邀请你加入 <b><br />{1} </b> 团队
          </p>
          <p style="font-family:sans-serif;font-size:16px;line-height:24px;margin-bottom:0;">
            BoardX在线白板平台，为组织创新及团队协作赋能！点击下方按键，立即加入<br />{2} 团队，与团队成员一起协作！
          </p>
          <br />
          <a href={4}>
            <button style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top: -8px;">开始使用BoardX</button>
          </a>
        </div>
    </div>
    </body>
    </html>
    `;
  static INVITE_TO_ROOM_EMAIL = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
    <div style="width: 100%;height: 100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
      <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
        <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
        <p style="font-family:sans-serif;font-size:36px;margin-bottom: 24px;line-height: 50px;"> <b>{0} </b> has invited you to<br /> BoardX room:  <b>{1} </b> </p>
        <p style="font-family:sans-serif, sans serif;font-size:16px;line-height: 24px;margin-bottom: 0;">Click the button below to register an account and start the collaboration.</p>
        <br />
        <a href="{2}">
          <button style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top: -8px;">Join Now</button>
        </a>
      </div>
      </div>
    </body>
    </html>
    `;
  static WELCOME_EMAIL = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
      <div style="width:100%;height:100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
        <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
          <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
          <p style="font-family:sans-serif;font-size:36px;margin-bottom:24px;line-height:50px;"> <b>Welome to BoardX</b> </p>
          <p style="font-family:sans-serif, sans serif;font-size:16px;line-height:24px;margin-bottom:0;">
            BoardX is a digital whiteboard that empowers people to collaborate and create.
          </p>
          <p style="font-family:sans-serif, sans serif;font-size:16px">
            <a href="https://app.boardx.us/signin">
              <button  style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top:-8px;">Get Started</button>
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  static WELCOME_EMAIL_ZH_CN = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
    <div style="width:100%;height:100%;background: #E5E5E5;margin: 0 auto;
    padding: 30px;color: #000">
      <div style="background: #ffffff;margin: 0 auto;width:550px;padding: 9px 87px 59px 31px;box-sizing: border-box;border-radius: 16px;">
        <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
        <p style="font-family:sans-serif;font-size:36px;margin-bottom:24px;line-height:50px;"> <b>欢迎来到BoardX</b> </p>
        <p style="font-family:sans-serif, sans serif;font-size:16px;line-height:24px;margin-bottom:0;">
          BoardX在线白板平台，为组织创新及团队协作赋能！欢迎使用BoardX！
        </p>
        <p style="font-family:sans-serif, sans serif;font-size:16px">
          <a href="https://app.boardx.us/signin">
            <button  style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top:-8px;">开始使用</button>
          </a>
        </p>
      </div>
    </div>
    </body>
    </html>
    `;
  static MENTION = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
    <div style="width:100%;height:100%;background: #E5E5E5;position:relative">
      <div style="background: #ffffff;margin: 0 auto;position: absolute;left:50%;top:50%;transform:translate(-50%, -50%);padding: 9px 87px 59px 31px;box-sizing:border-box;border-radius:16px;">
        <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
        <p style="font-family:sans-serif, sans serif;font-size:16px;line-height:24px;margin-bottom:0;">
            <span style="font-size:18px;font-weight:bold;">{0}</span> mentioned you on <span style="font-size:18px;font-weight:bold;">{1}</span> board
        </p>
        <p>{2}</p>
        <p style="font-family:sans-serif, sans serif;font-size:16px">
          <a href="https://app.boardx.us/board/{3}?commentId={4}">
            <button  style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top:-8px;">Visit Board</button>
          </a>
        </p>
      </div>
    </div>
    </body>
    </html>
    `;
  static REPLY = `<html><head>
    <link href='https://fonts.googleapis.com/css?family=sans-serif' rel='stylesheet'>
    <style>
    body {font-family: 'sans-serif';font-size: 22px;}
    </style>
    </head>
    <body>
    <div style="width:100%;height:100%;background: #E5E5E5;position:relative">
      <div style="background: #ffffff;margin: 0 auto;position: absolute;left:200px;top:100px;transform:translate(-50%, -50%);padding: 9px 87px 59px 31px;box-sizing:border-box;border-radius:16px;">
        <img  src="https://app.boardx.us/images/logo_1.png" style="margin:20px 0px"><br />
        <p style="font-family:sans-serif, sans serif;font-size:16px;line-height:24px;margin-bottom:0;">
            <span style="font-size:18px;font-weight:bold;">{0}</span> replied to you on <span style="font-size:18px;font-weight:bold;">{1}</span> board
        </p>
        <p>{2}</p>
        <p style="font-family:sans-serif, sans serif;font-size:16px">
          <a href="https://app.boardx.us/board/{3}?commentId={4}">
            <button  style="padding: 16px;background: #4A7BF7;border-radius: 4px;width:328px;height:56px;border-width:0px;color:#ffffff !important;font-family:sans-serif;font-size:14px;margin-top:-8px;">Visit Board</button>
          </a>
        </p>
      </div>
    </div>
    </body>
    </html>
    `;
}
