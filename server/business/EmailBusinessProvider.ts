import Fiber from 'fibers';
import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import i18n from 'meteor/universe:i18n';
import EmailConstants from '../constants/EmailConstants';
import {
  EmailVerify
} from '../../imports/lib/data/collectionsServer';
String.prototype.format = function () {
  var formatted = this;
  for (var arg in arguments) {
    formatted = formatted.replace('{' + arg + '}', arguments[arg]);
  }
  return formatted;
};

export default class EmailBusinessProvider {
  static provider = null;
  static getProviderInstance() {
    if (EmailBusinessProvider.provider == null) {
      EmailBusinessProvider.provider = new EmailBusinessProvider();
    }
    return EmailBusinessProvider.provider;
  }

  sendVerifyEmail(data) {
    //var user = Meteor.users.findOne(_id:data.userId);
    //if (!user) return 'false';
    try {
      Accounts.sendVerificationEmail(data.userId);
    } catch (e) { }
    return true;
  }
  checkVerifyEmail(token) {
    let tokenLog=EmailVerify.findOne({token:token});
    if(tokenLog){
    let arr=[];
    let user = Meteor.users.findOne({_id:tokenLog.userId});
    let data = {address:user.emails[0].address,
      verified:true};
      arr.push(data);
    Meteor.users.update(tokenLog.userId, { $set: { emails: arr } });
    return true;
  }else{return tokenLog.userId;}
  }
  sendEmail(to, subject, html) {
    Fiber(function () {
      try {
        console.log('to',to,'subject',subject,'html',html,
        'EmailConstants.EMAIL',EmailConstants.EMAIL)
        Email.send({ to, from: EmailConstants.EMAIL, subject, html });
      } catch (e) { console.log('e',e) }
    }).run();
    return 'sent';
  }
  UserRegistrationNotification( whoInvite, toEmail, userName) {
    let subject = EmailConstants.USER_SUBJECT;
    let text = EmailConstants.REGISTRATION_EMAIL_INVITATION.format(
      whoInvite,
      userName,
    );
    this.sendEmail(toEmail, subject, text);
  }
  UserRegistrationToOrgNotification(orgName, whoInvite, toEmail, userName) {
    let subject = EmailConstants.USER_SUBJECT;
    let text = EmailConstants.REGISTRATION_EMAIL_ORGANIZATION.format(
      whoInvite,
      userName,
      orgName,
    );
    console.log('toEmailtext',toEmail,subject,text)
    this.sendEmail(toEmail, subject, text);
  }

  UserRegistrationToRoomNotification(
    roomName,
    roomId,
    whoInvite,
    toEmail,
    userName,
  ) {
    let subject = EmailConstants.USER_SUBJECT;
    let text = EmailConstants.REGISTRATION_EMAIL_ROOM.format(
      whoInvite,
      userName,
      roomName,
      roomId,
    );
    this.sendEmail(toEmail, subject, text);
  }

  InviteUserToRoomNotification(roomName, from, toUserName, roomUrl, language) {
    let userEmail = Meteor.users.findOne({ username: toUserName }).emails[0]
      .address;
    let subject = EmailConstants.INVITE_USER_TO_ROOM_SUBJECT.format(roomName);
    let text = '';
    if (language === 'en') {
      text = EmailConstants.INVITE_USER_TO_ROOM_EMAIL.format(
        from,
        roomName,
        from,
        roomName,
        from,
        roomUrl,
      );
    } else {
      text = EmailConstants.INVITE_USER_TO_ROOM_EMAIL_ZH_CN.format(
        from,
        roomName,
        from,
        roomName,
        from,
        roomUrl,
      );
    }
    this.sendEmail(userEmail, subject, text);
  }

  sendOrgInvitationRegisterEmailToNonExistingUser(
    orgName,
    from,
    toEmail,
    invitationLink,
    language
  ) {
    let subject =
      EmailConstants.INVITE_USER_TO_ORGANIZATION_REGISTER_SUBJECT.format(
        orgName,
      );
    let text = '';
    if (language === 'en') {
      text = EmailConstants.INVITE_NON_EXISTING_USER_TO_ORGANIZATION_REGISTER_EMAIL.format(
        from,
        orgName,
        invitationLink,
      );
    } else {
      text = EmailConstants.INVITE_NON_EXISTING_USER_TO_ORGANIZATION_REGISTER_EMAIL_ZH_CN.format(
        from,
        orgName,
        invitationLink,
      );
    }
    console.log('text',text)
    this.sendEmail(toEmail, subject, text);
    return true;
  }

  sendOrgInvitationToExistingUser(orgId, orgName, from, toEmail, link, language) {
    let subject = EmailConstants.INVITE_TO_ORGANIZATION_SUBJECT.format(orgName);
    let text = '';
    if (language === 'en') {
      text = EmailConstants.INVITE_EXISTING_USER_TO_ORGANIZATION_EMAIL.format(
        from,
        orgName,
        orgName,
        orgId,
        link,
      );
    } else {
      text = EmailConstants.INVITE_EXISTING_USER_TO_ORGANIZATION_EMAIL_ZH_CN.format(
        from,
        orgName,
        orgName,
        orgId,
        link,
      );
    }
    this.sendEmail(toEmail, subject, text);
  }

  sendInvitationEmailToRoom(roomName, from, toEmail, invitationLink) {
    let subject = EmailConstants.INVITE_TO_ROOM_SUBJECT.format(roomName);
    let text = EmailConstants.INVITE_TO_ROOM_EMAIL.format(
      from,
      roomName,
      invitationLink,
    );
    this.sendEmail(toEmail, subject, text);
  }

  sendWelcomeEmailToNewuser(username, toEmail, language) {
    let subject = EmailConstants.WELCOME_SUBJECT;
    let text = '';
    if (language === 'en') {
      text = EmailConstants.WELCOME_EMAIL.format(username);
    } else {
      text = EmailConstants.WELCOME_EMAIL_ZH_CN.format(username);
    }
    this.sendEmail(toEmail, subject, text);
  }
}
