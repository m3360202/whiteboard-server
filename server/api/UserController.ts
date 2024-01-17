import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { settings } from '../../app/settings';
import UserBusinessProvider from '../business/UserBusinessProvider';
import {
  UserLogin,
  OnlineUsersData
} from '../../imports/lib/data/collectionsServer';
import { Users } from '../../app/models/server/index';
import axios from 'axios';
import { Accounts } from 'meteor/accounts-base';
import uuid from 'uuid';

function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateUUID() {
  const generatedUUID = Math.random().toString(36).substr(2, 16);
  const randomString = generateRandomString(16 - generatedUUID.length);
  const uuidString = randomString + generatedUUID;
  return uuidString;
}
Meteor.methods({
  addUserToRole(userId, role, team) {
    this.unblock();
    return Roles.addUsersToRoles(userId, [role], team);
  },
  async getWechatAccessToken(getAccessUrl) {
    let res = null;
    await axios
      .get(getAccessUrl)
      .then(function (response) {
        console.log('response', response.data);
        res = response.data;
      })
      .catch(function (error) {
        return error;
      });
    return res;
  },
  getLinkedinUserEmail(token) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getLinkedinUserEmail(token);
  },
  async getWechatUserInfo(getUserInfoUrl) {
    let res = null;
    await axios
      .get(getUserInfoUrl)
      .then(function (response) {
        console.log('response', response.data);
        res = response.data;
      })
      .catch(function (error) {
        return error;
      });
    return res;
  },
  updateAvatar(file) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().updateAvatar(file);
  },
  registerUser(formData) {
    console.log('reguisteruser-------------------', formData);
    this.unblock();

    const AllowAnonymousRead = settings.get('Accounts_AllowAnonymousRead');
    const AllowAnonymousWrite = settings.get('Accounts_AllowAnonymousWrite');
    const manuallyApproveNewUsers = settings.get(
      'Accounts_ManuallyApproveNewUsers'
    );
    return UserBusinessProvider.getProviderInstance().registerUser(
      formData,
      AllowAnonymousRead,
      AllowAnonymousWrite,
      manuallyApproveNewUsers
    );
  },

  saveUserProfile(data) {
    this.unblock();
    check(data.newPassword, Match.Maybe(String));
    return UserBusinessProvider.getProviderInstance().saveUserProfile(data);
  },

  updateUserAccount(userId, data) {
    this.unblock();
    check(userId, String);
    check(data, Object);
    return UserBusinessProvider.getProviderInstance().updateUserAccount(
      userId,
      data
    );
  },

  updateUserAvatar(avatarKey) {
    this.unblock();
    const userId = Meteor.userId();
    check(avatarKey, String);
    check(Meteor.userId(), String);
    return UserBusinessProvider.getProviderInstance().updateUserAvatar(
      avatarKey,
      userId
    );
  },

  getUserName(userId) {
    check(userId, String);
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getUserName(userId);
  },
  getUserList(data) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getUserList(data);
  },
  getOrgAdminUser(orgId) {
    check(orgId, String);
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getOrgAdminUser(orgId);
  },
  getUserInfo() {
    console.log('getUserInfo', this.userId)
    if(!this.userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
     this.unblock();
    return UserBusinessProvider.getProviderInstance().getUserInfo(this.userId);
  },
  getName(userId) {
    check(userId, String);
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getName(userId);
  },
  getUserInviteId(userId) {
    check(userId, String);
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getUserInviteId(userId);
  },
  getUserUnionId(userId) {
    check(userId, String);
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getUserUnionId(userId);
  },
  getUserByUnionId(unionId) {
    this.unblock();
    check(unionId, String);
    return UserBusinessProvider.getProviderInstance().getUserByUnionId(unionId);
  },
  checkIfUserExistsByUserName(username) {
    this.unblock();
    check(username, String);
    return UserBusinessProvider.getProviderInstance().checkIfUserExistsByUserName(
      username
    );
  },
  checkIfUserExistsByEmail(email) {
    this.unblock();
    check(email, String);
    return UserBusinessProvider.getProviderInstance().checkIfUserExistsByEmail(
      email
    );
  },

  removeOnlineuserToBoard(whiteboardId, uno) {
    this.unblock();
    check(whiteboardId, String);
    check(uno, String);
    return UserBusinessProvider.getProviderInstance().removeOnlineuserToBoard(
      whiteboardId,
      uno
    );
  },

  usersAutocomplete(data) {
    this.unblock();
    check(data.selector, Match.ObjectIncluding({ term: String }));
    return UserBusinessProvider.getProviderInstance().usersAutocomplete(data);
  },

  usersInfo(userId) {
    this.unblock();
    check(userId, String);
    return UserBusinessProvider.getProviderInstance().usersInfo(userId);
  },
  async userInviteToken(token) {
    this.unblock();
    return await UserBusinessProvider.getProviderInstance().userInviteToken(
      token
    );
  },
  async useInviteToken(userId, token) {
    this.unblock();
    return await UserBusinessProvider.getProviderInstance().useInviteToken(
      userId,
      token
    );
  },

  async validateInviteToken(token) {
    this.unblock();
    return await UserBusinessProvider.getProviderInstance().validateInviteToken(
      token
    );
  },

  async handleSendFeedbackMsgToGitHub(msg) {
    this.unblock();
    check(msg, String);
    // console.log('handleFeedback: ', msg);

    try {
      await axios({
        method: 'post',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization:
            'Bearer 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',
        },
        url: 'https://api.github.com/repos/boardx/BoardX-Community/issues',
        data: {
          title: msg.substring(0, 200),
          body: msg,
          assignees: [],
          // milestone: 1,
          labels: ['type: bug'],
        },
      });
      return true;
    } catch (err) {
      return Promise.reject(err);
    }
  },

  getByEmailAddress(email) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getByEmailAddress(email);
  },

  exitOnlineUserByBoardId(userId, userNo, boardId) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().exitOnlineUserByBoardId(
      userId,
      userNo,
      boardId
    );
  },
  getAllOnlineUsers(email) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getAllOnlineUsers(email);
  },
  getOnlineUserListInBoard(boardId) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getOnlineUserListInBoard(
      boardId
    );
  },
  getOnlineUserListIByNo(userNo) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getOnlineUserListIByNo(
      userNo
    );
  },
  checkIfUserInOrg(userId, orgId) {
    this.unblock();
    console.log('checkIfUserInOrg: ', userId, orgId);
    check(userId, String);
    check(orgId, String);
    return UserBusinessProvider.getProviderInstance().checkIfUserInOrg(
      userId,
      orgId
    );
  },
  checkIfUserInRoom(userId, roomId) {
    this.unblock();
    console.log('checkIfUserInRoom: ', userId, roomId);
    check(userId, String);
    check(roomId, String);
    return UserBusinessProvider.getProviderInstance().checkIfUserInRoom(
      userId,
      roomId
    );
  },
  updateUserProfileByManage(data) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().updateUserProfileByManage(
      data
    );
  },
  deleteUser(userId) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().deleteUser(userId);
  },

  calculationUserXPValue(userId) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().calculationUserXPValue(
      userId
    );
  },

  addUserTags(data) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().addUserTags(data);
  },

  getUserTags() {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().getUserTags();
  },

  updateUserProfileTags(userData, tagName) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().updateUserProfileTags(
      userData,
      tagName
    );
  },

  editUserTags(userData, tagsData, type) {
    this.unblock();
    return UserBusinessProvider.getProviderInstance().editUserTags(
      userData,
      tagsData,
      type
    );
  },
  saveLoginToken(userId, token) {
   

    UserLogin.insert({
      userId: userId,
      token,
      createdAt: new Date()
    });
    //连同token和user一起返回
    return { status: true, msg: 'Login success', token,userId };
  },
  loginAuth2(email, password) {
   
    const user = Accounts.findUserByEmail(email);
    if (!user) {
      return { status: false, msg: 'User not found' };
    }
    if (Accounts._checkPassword(user, password).error) {
      return { status: false, msg: 'Password is not correct' };
    }
    this.setUserId(user._id); // 登录用户

    const token = generateUUID();

    UserLogin.insert({
      userId: user._id,
      token,
      createdAt: new Date()
    });
    //连同token和user一起返回
    return { status: true, msg: 'Login success', token, user };
  },
 
  loginWithToken(token) {
    const log = UserLogin.findOne({ token });
    if(log){
      const user = Users.findOne({_id:log.userId});
      this.setUserId(user._id);
      return { status: true, msg: 'Login success', token, user };
    }
    else{
      return { status: false, msg: 'User not found' };
    }
  },
  addOnlineUser(user,boardId,token){
    this.unblock();
    if(!user || !user.userId || !boardId || !token){
      return;
    }
    const userNo = generateUUID();
      const addData = {
        boardId,
        userId: user.userId,
        username: user.userName, 
        avatar: user.avatar, 
        name:user.name,
        t: Date.now(),
        userNo:userNo,
        token,
        createdAt: new Date()
      }
      OnlineUsersData.insert(addData);
      return userNo;
    
    
  },
  exitOnlineUser(userId,boardId,token){
    this.unblock();
    const onLineUser = OnlineUsersData.findOne({boardId,userId,token});
    if(onLineUser){
      return OnlineUsersData.remove({_id:onLineUser._id});
    }
  },
  exitRecentOnlineUser(userId,boardId,userNo){
    this.unblock();
    const onLineUser = OnlineUsersData.findOne({boardId,userId,userNo});
    if(onLineUser){
      return OnlineUsersData.remove({_id:onLineUser._id});
    }
  }
});
