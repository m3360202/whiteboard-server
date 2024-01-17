import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import EmailBusinessProvider from '../business/EmailBusinessProvider';

Meteor.methods({
  sendVerifyEmail(data) {
    this.unblock();
    return EmailBusinessProvider.getProviderInstance().sendVerifyEmail(data);
  },
  checkVerifyEmail(token) {
    this.unblock();
    return EmailBusinessProvider.getProviderInstance().checkVerifyEmail(token);
  },
  sendEmail(to, subject, text) {
    check([to, subject, text], [String]);
    this.unblock();
    return EmailBusinessProvider.getProviderInstance().sendEmail(
      to,
      subject,
      text,
    );
  },
  UserRegistrationNotification(
    whoInvite,
    toEmail,
    userName,
  ) {
    this.unblock();
    check(whoInvite, Match.Maybe(String));
    check(toEmail, Match.Maybe(String));
    check(userName, Match.Maybe(String));
    return EmailBusinessProvider.getProviderInstance().UserRegistrationNotification(
      whoInvite,
      toEmail,
      userName,
    );
  },
  UserRegistrationToOrgNotification(
    orgName,
    orgId,
    whoInvite,
    toEmail,
    userName,
  ) {
    this.unblock();
    check(orgName, Match.Maybe(String));
    check(orgId, Match.Maybe(String));
    check(whoInvite, Match.Maybe(String));
    check(toEmail, Match.Maybe(String));
    check(userName, Match.Maybe(String));
    return EmailBusinessProvider.getProviderInstance().UserRegistrationToOrgNotification(
      orgName,
      whoInvite,
      toEmail,
      userName,
    );
  },

  UserRegistrationToRoomNotification(
    roomName,
    roomId,
    whoInvite,
    toEmail,
    userName,
  ) {
    this.unblock();
    check(roomName, Match.Maybe(String));
    check(roomId, Match.Maybe(String));
    check(whoInvite, Match.Maybe(String));
    check(toEmail, Match.Maybe(String));
    check(userName, Match.Maybe(String));
    return EmailBusinessProvider.getProviderInstance().UserRegistrationToRoomNotification(
      roomName,
      roomId,
      whoInvite,
      toEmail,
      userName,
    );
  },

  InviteUserToRoomNotification(roomName, from, toUserName, roomUrl, language) {
    this.unblock();
    check(roomName, String);
    check(from, String);
    check(toUserName, String);
    check(roomUrl, String);
    return EmailBusinessProvider.getProviderInstance().InviteUserToRoomNotification(
      roomName,
      from,
      toUserName,
      roomUrl,
      language
    );
  },

  sendOrgInvitationRegisterEmailToNonExistingUser(
    orgName,
    from,
    toEmail,
    invitationLink,
    language
  ) {
    this.unblock();
    check(orgName, String);
    check(from, String);
    check(toEmail, String);
    check(invitationLink, String);
    return EmailBusinessProvider.getProviderInstance().sendOrgInvitationRegisterEmailToNonExistingUser(
      orgName,
      from,
      toEmail,
      invitationLink,
      language
    );
  },

  sendOrgInvitationToExistingUser(orgId, orgName, from, toEmail, link, language) {
    this.unblock();
    check(orgId, String);
    check(orgName, String);
    check(from, String);
    check(toEmail, String);
    check(link, String);
    return EmailBusinessProvider.getProviderInstance().sendOrgInvitationToExistingUser(
      orgId,
      orgName,
      from,
      toEmail,
      link,
      language
    );
  },

  sendInvitationEmailToRoom(roomName, from, toEmail, invitationLink) {
    this.unblock();
    check(roomName, String);
    check(from, String);
    check(toEmail, String);
    check(invitationLink, String);
    return EmailBusinessProvider.getProviderInstance().sendInvitationEmailToRoom(
      roomName,
      from,
      toEmail,
      invitationLink,
    );
  },

  sendWelcomeEmailToNewuser(username, toEmail, language) {
    this.unblock();
    check(toEmail, String);
    return EmailBusinessProvider.getProviderInstance().sendWelcomeEmailToNewuser(
      username,
      toEmail,
      language
    );
  },
});
