import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import s from 'underscore.string';
import { settings } from '../../app/settings';
import { getFullUserDataByIdOrUsername } from '../webmethods/lib/getFullUserData';
import { passwordPolicy } from '../webmethods/lib/passwordPolicy';
import { saveCustomFields } from '../webmethods/lib/saveCustomFields';
import { validateEmailDomain } from '../webmethods/lib/validateEmailDomain';
import UserDataProvider from '../data/UserDataProvider';
import OrgDataProvider from '../data/OrgDataProvider';
import EmailBusinessProvider from './EmailBusinessProvider';
import InvitesDataProvider from '../data/InvitesDataProvider';
import RoomsDataProvider from '../data/RoomsDataProvider';
import { addUserToRoom } from '../webmethods/lib/addUserToRoom';
import axios from 'axios';
import { Users } from '../../app/models/server/index';
import { TokensLog, OnlineUsersData, TestLog,UserLogin } from '../../imports/lib/data/collectionsServer';
import moment from 'moment';
export default class UserBusinessProvider {
  public username: any;
  public inviteData: any;
  public room: any;
  static provider = null;

  static getProviderInstance() {
    if (UserBusinessProvider.provider == null) {
      UserBusinessProvider.provider = new UserBusinessProvider();
    }
    return UserBusinessProvider.provider;
  }

  validateInviteToken(data) {
    let token = data.hash;
    let userToken = data.user;
    let user;
    if(userToken){
      let userLogin = UserLogin.findOne({token:userToken});
      console.log('userLogin',userLogin)
      user = Users.findOne({ _id: userLogin.userId });
    }
    else{
      user = null;
    }
    if (!token || typeof token !== 'string') {
      throw new Meteor.Error(
        'error-invalid-token',
        'The invite token is invalid.',
        { method: 'validateInviteToken', field: 'token' }
      );
    }

    const inviteData = InvitesDataProvider.getProviderInstance().getByID(token);

    if (!inviteData) {
      throw new Meteor.Error(
        'error-invalid-token',
        'The invite token is invalid2.',
        { method: 'validateInviteToken', field: 'token' }
      );
    }

    const room = RoomsDataProvider.getProviderInstance().getRoomID(
      inviteData.rid,
      {
        fields: {
          _id: 1,
          name: 1,
          fname: 1,
          t: 1,
          prid: 1,
          orgId: 1
        }
      }
    );
    const organization =
      OrgDataProvider.getProviderInstance().getOrganizationfindOne({
        _id: inviteData.orgId
      });

    if (inviteData.expires && inviteData.expires <= Date.now()) {
      throw new Meteor.Error(
        'error-invite-expired',
        'The invite token has expired.',
        { method: 'validateInviteToken', field: 'expires' }
      );
    }

    if (inviteData.maxUses > 0 && inviteData.uses >= inviteData.maxUses) {
      throw new Meteor.Error(
        'error-invite-expired',
        'The invite token has expired.',
        { method: 'validateInviteToken', field: 'maxUses' }
      );
    }
    let isLogin = user && user._id ? true : false;
    let isAnonymous = user && user.username.indexOf('vistor_') > -1 ? true : false; 
    return {
      inviteData,
      room,
      organization,
      isLogin: isLogin,
      isAnonymous: isAnonymous
    };
  }
  updateAvatar(file) {
    Users.update(Meteor.userId(), { $set: { head_url: file } });
    return file;
  }
  getUserList(data) {
    return UserDataProvider.getProviderInstance().getUserList(data);
  }

  registerUser(
    formData,
    AllowAnonymousRead,
    AllowAnonymousWrite,
    manuallyApproveNewUsers
  ) {
    let thisMoment = moment().format('x');
    let now = parseInt(thisMoment / 1000);
    if (
      AllowAnonymousRead === true &&
      AllowAnonymousWrite === true &&
      formData.email == null
    ) {
      const userId = Accounts.insertUserDoc(
        {},
        {
          globalRoles: ['anonymous'],
          active: true
        }
      );

      const stampedLoginToken = Accounts._generateStampedLoginToken();
      Accounts._insertLoginToken(userId, stampedLoginToken);
      return stampedLoginToken;
    }

    if (settings.get('Accounts_RegistrationForm') === 'Disabled') {
      throw new Meteor.Error(
        'error-user-registration-disabled',
        'User registration is disabled',
        { method: 'registerUser' }
      );
    }

    if (
      settings.get('Accounts_RegistrationForm') === 'Secret URL' &&
      (!formData.secretURL ||
        formData.secretURL !==
        settings.get('Accounts_RegistrationForm_SecretURL'))
    ) {
      if (!formData.secretURL) {
        throw new Meteor.Error(
          'error-user-registration-secret',
          'User registration is only allowed via Secret URL',
          { method: 'registerUser' }
        );
      }

      try {
        this.validateInviteToken(formData.secretURL);
      } catch (e) {
        throw new Meteor.Error(
          'error-user-registration-secret',
          'User registration is only allowed via Secret URL',
          { method: 'registerUser' }
        );
      }
    }
    let { username } = formData;
    let existingUser = Meteor.users.findOne({ username });

    let n = 0;
    while (existingUser) {
      n++;
      username = `${username}-${n.toString()}`;
      existingUser = Meteor.users.findOne({ username });
    }

    formData.username = username;

    passwordPolicy.validate(formData.pass);

    validateEmailDomain(formData.email);

    const userData = {
      email: s.trim(formData.email.toLowerCase()),
      password: formData.pass,
      username: formData.username,
      name: formData.name,
      profile: formData.profile,
      reason: formData.reason
    };

    const importedUser = this.getByEmailAddress(formData.email);

    let userId;
    let inviterReferalUsers = 0;
    if (
      importedUser &&
      importedUser.importIds &&
      importedUser.importIds.length &&
      !importedUser.lastLogin
    ) {
      Accounts.setPassword(importedUser._id, userData.password);
      userId = importedUser._id;
    } else {
      userId = Accounts.createUser(userData);
      const orgMember = OrgDataProvider.getProviderInstance().getOrgMember({
        orgId: 'iyZPRHtJiCQRDQ8G9',
        userId
      });

      // if (!orgMember) {
      //   OrgDataProvider.getProviderInstance().addNewOrgMember({
      //     orgId: 'iyZPRHtJiCQRDQ8G9', name: 'BoardX Community', userId, username: userData.username, role: 'member',
      //   });
      // }
    }
    console.log(formData, 'formData');
    UserDataProvider.getProviderInstance().addRegisterUserName(
      userId,
      s.trim(username)
    );
    UserDataProvider.getProviderInstance().addRegisterName(
      userId,
      s.trim(formData.name)
    );
    if (formData.profile.inviteId && formData.profile.inviteId !== 'none') {
      let inviterCredits;
      UserDataProvider.getProviderInstance().addRegisterInviteId(
        userId,
        s.trim(formData.profile.inviteId)
      );
      const inviter = Users.findOne({ _id: formData.profile.inviteId });
      if (inviter) {
        inviterReferalUsers = inviter.referalUsers
          ? inviter.referalUsers + 1
          : 1;
      }
      if (inviter && inviter.referalUsers < 11) {
        inviterCredits = inviter.credits ? inviter.credits + 10000 : 20000;
        const tokenData = {
          userId: formData.profile.inviteId,
          action: 'invite user regist',
          purchaseSource: 'official website',
          credits: 10000,
          purchaseTime: now
        };
        TokensLog.insert(tokenData);
      }
      if (inviter && inviter.referalUsers > 9) {
        inviterCredits = inviter.credits;
      }
      Users.update(formData.profile.inviteId, {
        $set: { credits: inviterCredits, referalUsers: inviterReferalUsers }
      });
      EmailBusinessProvider.getProviderInstance().UserRegistrationNotification(
        inviter?.name,
        inviter?.emails[0].address,
        formData.name
      );
    } else {
      UserDataProvider.getProviderInstance().addCreditsForRegistUserBySelf(
        userId
      );
    }
    if (formData.profile.unionId) {
      UserDataProvider.getProviderInstance().addRegisterUnionId(
        userId,
        s.trim(formData.profile.unionId)
      );
    }
    if (formData.profile.head_url) {
      UserDataProvider.getProviderInstance().addRegisterHeadUrl(
        userId,
        s.trim(formData.profile.head_url)
      );
    }
    if (formData.profile.email) {
      UserDataProvider.getProviderInstance().addRegisterExtendEmail(
        userId,
        s.trim(formData.profile.email)
      );
    }
    if (formData.profile.type) {
      UserDataProvider.getProviderInstance().addRegisterType(
        userId,
        s.trim(formData.profile.type)
      );
    }
    const reason = s.trim(formData.reason);
    if (manuallyApproveNewUsers && reason) {
      UserDataProvider.getProviderInstance().addRegisterReason(userId, reason);
    }

    saveCustomFields(userId, formData);
    if (formData.username.indexOf('vistor_') <= -1 && !formData.unionId) {
      EmailBusinessProvider.getProviderInstance().sendWelcomeEmailToNewuser(
        formData.name,
        formData.email,
        formData.language
      );

      try {
        // Accounts.sendVerificationEmail(userId);
      } catch (e) { }
    }
    return Users.findOne({ _id: userId });
  }

  saveUserProfile(data) {
    if (data.name) {
      return UserDataProvider.getProviderInstance().updateUserProfile(
        Meteor.userId(),
        data
      );
    }

    if (data.newPassword) {
      Accounts.setPassword(Meteor.userId(), data.newPassword, {
        logout: false
      }); //reset passowrd will not logout
    }

    return UserDataProvider.getProviderInstance().getUsersID(Meteor.userId());
  }

  updateUserAccount(userId, data) {
    return UserDataProvider.getProviderInstance().updateUserAccount(
      userId,
      data
    );
  }

  getOrgAdminUser(orgId) {
    return UserDataProvider.getProviderInstance().getOrgAdminUser(orgId);
  }
  updateUserAvatar(avatarKey, userId) {
    return Meteor.users.update(
      { _id: userId },
      { $set: { avatar: avatarKey } }
    );
  }
  getName(userId) {
    return (
      Meteor.users
        .find({ _id: userId }, { fields: { emails: 1, username: 1, name: 1 } })
        .fetch()[0] || []
    );
  }
  getUserName(userId) {
    return (
      Meteor.users
        .find({ _id: userId }, { fields: { username: 1 } })
        .fetch()[0] || []
    );
  }
  getUserInfo(userId) {
    return Users.findOne({ _id: userId });
  }
  getUserByUnionId(unionId) {
    return UserDataProvider.getProviderInstance().getUserByUnionId(unionId);
  }
  getUserInviteId(userId) {
    return (
      Meteor.users
        .find({ _id: userId }, { fields: { inviteId: 1 } })
        .fetch()[0] || []
    );
  }
  getUserUnionId(userId) {
    return (
      Meteor.users
        .find({ _id: userId }, { fields: { unionId: 1 } })
        .fetch()[0] || []
    );
  }
  checkIfUserExistsByUserName(username) {
    return Meteor.users.findOne({ username: username });
  }
  checkIfUserExistsByEmail(email) {
    const result = Meteor.users.findOne(
      { 'emails.address': email },
      { fields: { emails: 1, username: 1, name: 1 } }
    );
    console.log('result of check email', result)
    if(result){
      return result;
    }else{
      return {};
    }
    
  }

  removeOnlineuserToBoard(whiteboardId, uno) {
    return UserDataProvider.getProviderInstance().deleteOnlineuserToBoard(
      whiteboardId,
      uno
    );
  }

  usersAutocomplete(data) {
    return this.findUsersToAutocomplete(data);
  }

  async findUsersToAutocomplete({ selector }) {
    const exceptions = selector.exceptions || [];
    const conditions = selector.conditions || {};
    const options = {
      projection: {
        name: 1,
        username: 1,
        nickname: 1,
        status: 1,
        avatarETag: 1
      },
      sort: {
        username: 1
      },
      limit: 10
    };
    const users = await UserDataProvider.getProviderInstance().getActiveInfo(
      selector,
      exceptions,
      conditions,
      options
    );
    return { items: users };
  }

  usersInfo(userId) {
    return getFullUserDataByIdOrUsername({ userId });
  }

  userInviteToken(data) {
   
    let token = data.hash;
    let userToken = data.user;
    let user:any;
      let userLogin = UserLogin.findOne({token:userToken});
      user = Users.findOne({ _id: userLogin.userId });
    let userId = user._id;
    console.log('userInviteTokenuserId-------------',userId,token)
    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'The user is invalid', {
        method: 'useInviteToken',
        field: 'userId'
      });
    }

    if (!token) {
      throw new Meteor.Error(
        'error-invalid-token',
        'The invite token is invalid.',
        { method: 'useInviteToken', field: 'token' }
      );
    }

    const { inviteData, room } = this.validateInviteToken(data);\
    console.log('inviteData',inviteData)
    UserDataProvider.getProviderInstance().updateInviteToken(userId, token);
    InvitesDataProvider.getProviderInstance().addIncreaseUsageById(
      inviteData._id
    );

    // If the user already has an username, then join the invite room,
    // If no username is set yet, then the the join will happen on the setUsername method
    if (inviteData.type === 'room' && user.username) {
    }
    const invite = InvitesDataProvider.getProviderInstance().getInvitesId({
      _id: inviteData._id
    });
    const userId1 = invite.userId;
    const userWhoInvite =
      UserDataProvider.getProviderInstance().getUsersID(userId1);

    const userEmail = userWhoInvite.emails[0].address;
    const userName = userWhoInvite.name;
    const userInfo = user;
    if (inviteData.type === 'org') {
      const org = OrgDataProvider.getProviderInstance().getOrganizationfindOne({
        _id: inviteData.orgId
      });
      const orgName = org.name;
      const orgMember = OrgDataProvider.getProviderInstance().getOrgMember(
        inviteData.orgId,
        userId
      );
      console.log('orgMember',orgMember)
      if (!orgMember || (orgMember && orgMember.length == 0)) {
        OrgDataProvider.getProviderInstance().addNewOrgMember({
          orgId: inviteData.orgId,
          name: orgName,
          userId,
          username: user.username,
          role: 'member'
        });
      }
      if (userName.indexOf('vistor_') <= -1) {
        EmailBusinessProvider.getProviderInstance().UserRegistrationToOrgNotification(
          orgName,
          inviteData.orgId,
          userEmail,
          user.name
        );
      }
      return {
        organization: {
          ...org
        }
      };
    }
    console.log('user----',user)
    if (user.username.indexOf('vistor_') === -1) {
      addUserToRoom(room._id, user);
    }
    const orgMember = OrgDataProvider.getProviderInstance().getOrgMember(
      room.orgId,
      user._id
    );

    if (orgMember.length == 0) {
      OrgDataProvider.getProviderInstance().addNewOrgMember({
        orgId: room.orgId,
        name: room.orgName,
        userId: user._id,
        username: user.username,
        role: 'member'
      });
    }

    EmailBusinessProvider.getProviderInstance().UserRegistrationToRoomNotification(
      room.fname,
      inviteData.roomId,
      userName,
      userEmail,
      user.name
    );

    return {
      room: {
        rid: inviteData.rid,
        prid: room.prid,
        fname: room.fname,
        name: room.name,
        orgId: room.orgId,
        t: room.t
      },
      inviteId: inviteData.userId,
      userName: userInfo.username
    };
  }
  useInviteToken(userId, token) {
    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'The user is invalid', {
        method: 'useInviteToken',
        field: 'userId'
      });
    }

    if (!token) {
      throw new Meteor.Error(
        'error-invalid-token',
        'The invite token is invalid.',
        { method: 'useInviteToken', field: 'token' }
      );
    }

    const { inviteData, room } = this.validateInviteToken(token);
    const user = UserDataProvider.getProviderInstance().getUsersID(userId);
    UserDataProvider.getProviderInstance().updateInviteToken(user._id, token);
    InvitesDataProvider.getProviderInstance().addIncreaseUsageById(
      inviteData._id
    );

    // If the user already has an username, then join the invite room,
    // If no username is set yet, then the the join will happen on the setUsername method
    if (inviteData.type === 'room' && user.username) {
    }
    const invite = InvitesDataProvider.getProviderInstance().getInvitesId({
      _id: inviteData._id
    });
    const userId1 = invite.userId;
    const userWhoInvite =
      UserDataProvider.getProviderInstance().getUsersID(userId1);

    const userEmail = userWhoInvite.emails[0].address;
    const userName = userWhoInvite.name;
    const userInfo =
      UserDataProvider.getProviderInstance().getUserInfoByMeteorUserId(userId);
    if (inviteData.type === 'org') {
      const org = OrgDataProvider.getProviderInstance().getOrganizationfindOne({
        _id: inviteData.orgId
      });
      const orgName = org.name;
      const orgMember = OrgDataProvider.getProviderInstance().getOrgMember(
        inviteData.orgId,
        userId
      );

      if (!orgMember) {
        OrgDataProvider.getProviderInstance().addNewOrgMember({
          orgId: inviteData.orgId,
          name: orgName,
          userId,
          username: user.username,
          role: 'member'
        });
      }
      if (userName.indexOf('vistor_') <= -1) {
        EmailBusinessProvider.getProviderInstance().UserRegistrationToOrgNotification(
          orgName,
          inviteData.orgId,
          userName,
          userEmail,
          user.name
        );
      }
      return {
        organization: {
          ...org
        }
      };
    }
    if (user.username.indexOf('vistor_') === -1) {
      addUserToRoom(room._id, user);
    }
    const orgMember = OrgDataProvider.getProviderInstance().getOrgMember(
      room.orgId,
      user.userId
    );

    if (orgMember.length == 0) {
      OrgDataProvider.getProviderInstance().addNewOrgMember({
        orgId: room.orgId,
        name: room.orgName,
        userId: user.userId,
        username: user.username,
        role: 'member'
      });
    }

    EmailBusinessProvider.getProviderInstance().UserRegistrationToRoomNotification(
      room.fname,
      inviteData.roomId,
      userName,
      userEmail,
      user.name
    );

    return {
      room: {
        rid: inviteData.rid,
        prid: room.prid,
        fname: room.fname,
        name: room.name,
        orgId: room.orgId,
        t: room.t
      },
      inviteId: inviteData.userId,
      userName: userInfo.username
    };
  }

  getByEmailAddress(email) {
    return UserDataProvider.getProviderInstance().getByEmailAddress(email);
  }

  exitOnlineUserByBoardId(userId, userNo, boardId) {
    return UserDataProvider.getProviderInstance().exitOnlineUserByBoardId(
      userId,
      userNo,
      boardId
    );
  }
  getAllOnlineUsers(email) {
    return UserDataProvider.getProviderInstance().getAllOnlineUsers(email);
  }
  getOnlineUserListInBoard(boardId) {
    return UserDataProvider.getProviderInstance().getOnlineUserListInBoard(
      boardId
    );
  }
  getOnlineUserListIByNo(userNo) {
    return UserDataProvider.getProviderInstance().getOnlineUserListIByNo(
      userNo
    );
  }
  async getLinkedinUserEmail(data) {
    return new Promise((resolve, reject) => {
      let getAccessTokenUrl = `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${data.code}&redirect_uri=${data.uri}&client_id=77n0zwjlzuyfte&client_secret=KciMTHtbWHtx17Cm`;
      axios.post(getAccessTokenUrl, {}, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(function (response) {
        const token = response.data.access_token;
        let url = `https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))&oauth2_access_token=${token}`;
        axios.get(url).then(function (response) {
          let res = response.data;
          let email = res.elements[0]['handle~'].emailAddress;
          let findUserByEmail = Users.findOne({ extendEmail: email, type: 'linkedin' });
          if (findUserByEmail) {
            resolve({
              email: 'linkedin&&' + email
            });
          } else {
            const url = `https://api.linkedin.com/v2/me?oauth2_access_token=${token}`;
            axios.get(url).then((response) => {
              res = response.data;
              let firstName = res.localizedFirstName;
              let lastName = res.localizedLastName;
              let name = firstName + ' ' + lastName;
              let avatarData = res.profilePicture.displayImage.replace('urn:li:digitalmediaAsset:', '');
              let avatar = `https://media.licdn.com/dms/image/${avatarData}/profile-displayphoto-shrink_200_200/0/1680061788552?e=1686787200&v=beta&t=GdYsJ6flZPSrIBYt202ZHP3YUE-3ScvFi-xE_OmzU0s`;
              resolve({
                profile: {
                  email: 'linkedin&&' + email,
                  name: name,
                  username: name,
                  pass: 'boardx@linkedin',
                  profile: {
                    head_url: avatar,
                    type: 'linkedin',
                    email: email
                  }

                },
                hasOrg: 'hasNone'
              })



            })
          }
        }).catch(function (error) {
          console.log('error', error);
          return error;
        });
      }
      ).catch(function (error) {
        console.log('error', error);
        return error;
      });
    })
  }
  checkIfUserInOrg(orgId, userId) {
    return UserDataProvider.getProviderInstance().checkIfUserInOrg(
      orgId,
      userId
    );
  }
  checkIfUserInRoom(roomId, userId) {
    return UserDataProvider.getProviderInstance().checkIfUserInRoom(
      roomId,
      userId
    );
  }
  updateUserProfileByManage(data) {
    return UserDataProvider.getProviderInstance().updateUserProfileByManage(
      data
    );
  }
  deleteUser(userId) {
    return UserDataProvider.getProviderInstance().deleteUser(userId);
  }

  calculationUserXPValue(userId) {
    return UserDataProvider.getProviderInstance().calculationUserXPValue(
      userId
    );
  }

  addUserTags(data) {
    return UserDataProvider.getProviderInstance().addUserTags(data);
  }

  getUserTags() {
    return UserDataProvider.getProviderInstance().getUserTags();
  }

  updateUserProfileTags(userData, tagName) {
    return userData.forEach(user => {
      let tags = user.tags;
      if (!tags) {
        tags = [];
      }
      tags.push(tagName);
      UserDataProvider.getProviderInstance().updateUserProfileTags(user, tags);
    });
  }

  editUserTags(userData, tagsData, type) {
    let tags = [];
    tagsData.forEach(tag => tags.push(tag.tagName));

    // 替换
    if (type === 'replace') {
      // todo: 代码需要优化
      // 更改userProfile
      userData.forEach(user => {
        UserDataProvider.getProviderInstance().updateUserProfileTags(user, tags);
      })
      // 更改tags里的users
      tagsData.forEach(tag => {
        let tagUsers = [...tag.users, ...userData];
        tagUsers = tagUsers.filter(
          (obj, index, self) =>
            index ===
            self.findIndex(t => t.id === obj.id && t.name === obj.name)
        );
        UserDataProvider.getProviderInstance().updatedUserTags(tag, tagUsers);
      })

      // 删除之前tags里的users
      tagsData.forEach(tag => {
        let tagUsers = [...tag.users];
        userData.forEach(user => {
          tagUsers = tagUsers.filter(t => t.id !== user.id);
        });
        UserDataProvider.getProviderInstance().updatedUserTags(tag, tagUsers);
      });
      return;
    }

    // 追加
    if (type === 'append') {
      userData.forEach(user => {
        let userTags = user.tags;
        if (!userTags) {
          userTags = [];
        }
        tags.forEach(tag => {
          if (userTags.indexOf(tag) === -1) {
            userTags.push(tag);
          }
        })
        UserDataProvider.getProviderInstance().updateUserProfileTags(user, userTags);
      })

      tagsData.forEach(tag => {
        let tagUsers = [...tag.users, ...userData];
        tagUsers = tagUsers.filter(
          (obj, index, self) =>
            index ===
            self.findIndex(t => t.id === obj.id && t.name === obj.name)
        );
        UserDataProvider.getProviderInstance().updatedUserTags(tag, tagUsers);
      });
      return;
    }

    // 删除
    if (type === 'remove') {
      userData.forEach(user => {
        let userTags = user.tags;
        if (!userTags) {
          userTags = [];
        }
        tags.forEach(tag => {
          if (userTags.indexOf(tag) > -1) {
            userTags.splice(userTags.indexOf(tag), 1);
          }
        })
        UserDataProvider.getProviderInstance().updateUserProfileTags(user, userTags);
      })
      tagsData.forEach(tag => {
        let tagUsers = [...tag.users];
        userData.forEach(user => {
          tagUsers = tagUsers.filter(t => t.id !== user.id);
        })
        UserDataProvider.getProviderInstance().updatedUserTags(tag, tagUsers);
      })
      return;
    }
  }

}
