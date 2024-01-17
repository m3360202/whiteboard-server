import { Users, Rooms } from '../../app/models/server/index';
import { Users as UsersToRaw } from '../../app/models/server/raw/index';
import {
  OnlineUsersData,
  OrganizationMember,
  Organization,
  UserSessionLog,
  TokensLog,
  RoomMember,
  AIAssistLog,
  UserTags,
  TestLog,
  UserLogin
} from '../../imports/lib/data/collectionsServer';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import moment from 'moment';

import { Subscriptions } from '../../app/models/server/index';

export default class UserDataProvider {
  static provider = null;
  static getProviderInstance() {
    if (UserDataProvider.provider == null) {
      UserDataProvider.provider = new UserDataProvider();
    }
    return UserDataProvider.provider;
  }

  getActiveInfo(selector, exceptions, conditions, options) {
    return UsersToRaw.findActiveByUsernameOrNameRegexWithExceptionsAndConditions(
      new RegExp(escapeRegExp(selector.term), 'i'),
      exceptions,
      conditions,
      options
    ).toArray();
  }

  deleteOnlineuserToBoard(boardId, userNo) {
    console.log('deleteOnlineuserToBoard');
    TestLog.insert({ logInfo: 'this is trigger deleteOnlineuserToBoard this is use right in user exit board', boardId, userNo });
    const target = OnlineUsersData.findOne({ boardId, userNo });
    if (target) {
      TestLog.insert({ logInfo: 'the target is ', target });
      OnlineUsersData.remove({ _id: target._id });
    }
    return true;
  }

  getOnlineUsers(id) {
    return OnlineUsersData.findOne(id);
  }

  getOnlineUsersFind(id) {
    return OnlineUsersData.find(id).fetch();
  }

  addRegisterUserName(userId, userName) {
    return Users.setUsername(userId, userName);
  }
  addRegisterInviteId(userId, inviteId) {
    Users.setInviteId(userId, inviteId);
    let thisMoment = moment().format('x');
    let now = parseInt(thisMoment / 1000);
    const tokenData = {
      userId: userId,
      action: 'invited by others',
      purchaseSource: 'official website',
      credits: 10000,
      purchaseTime: now
    };
    TokensLog.insert(tokenData);
    Users.update(userId, { $set: { credits: 10000, referalUsers: 0 } });
  }
  addRegisterName(userId, Name) {
    Users.setName(userId, Name);
  }
  addRegisterHeadUrl(userId, HeadUrl) {
    Users.setHeadUrl(userId, HeadUrl);
  }
  addRegisterExtendEmail(userId, email) {
    Users.update(userId, { $set: { extendEmail: email } });
  }
  addRegisterType(userId, type) {
    Users.update(userId, { $set: { type: type } });
  }
  addCreditsForRegistUserBySelf(userId) {
    Users.update(userId, { $set: { credits: 10000, referalUsers: 0 } });
  }
  addRegisterUnionId(userId, unionId) {
    Users.setUnionId(userId, unionId);
  }
  getUserInfoByMeteorUserId(userId) {
    return Meteor.users.findOne({ _id: userId });
  }

  addRegisterReason(userId, reason) {
    Users.setReason(userId, reason);
  }
  getFullUserInfo(userId) {
    return (
      Meteor.users
        .find(
          { _id: userId },
          {
            fields: {
              emails: 1,
              username: 1,
              name: 1,
              inviteId: 1,
              head_url: 1,
              unionId: 1
            }
          }
        )
        .fetch()[0] || []
    );
  }
  getByEmailAddress(email) {
    const result = Users.findOneByEmailAddress(email);
    if (result) {
      return result;
    } else {
      return {};
    }
  }
  getUserByUnionId(unionId) {
    return Users.findOneByUnionId(unionId);
  }
  updateUserProfile(_id, data) {
    Users.update({ _id }, { $set: { name: data.name } });
    return true;
  }
  updateUserAccount(userId, data) {
    return Users.update({ _id: userId }, { $set: data });
  }
  updateUserProfileByManage(data) {
    if (data && data.credits) {
      const tokenData = {
        userId: data.userId,
        action: 'change user credits by management',
        purchaseSource: 'boardx admin dashboard',
        tokens: data.credits,
        purchaseTime: Date.now(),
        controller: Meteor.userId()
      };
      TokensLog.insert(tokenData);
    }
    Users.update(data.userId, {
      $set: {
        name: data.name,
        username: data.username,
        state: data.state,
        credits: data.credits,
        'emails.0.address': data.email
      }
    });
    if (data.roles && data.roles.length > 0) {
      let user = Users.findOne(data.userId);
      //Meteor 自带roles
      let arr = [user.roles[0], user.roles[1]];
      let combinedArray = [...arr, ...data.roles];
      Users.update(data.userId, {
        $set: {
          roles: combinedArray
        }
      });
    }
    return true;
  }
  getUserList(data) {
    let result;
    if (data) {
      if (data.filter) {
        result = Users.find(
          {
            $or: [
              { username: { $regex: data.filter, $options: 'i' } },
              { 'emails.0.address': { $regex: data.filter, $options: 'i' } },
              { name: { $regex: data.filter, $options: 'i' } }
            ]
          },
          { limit: data.limit }
        ).fetch();
      } else {
        if (data.limit) {
          result = Users.find(
            {
              $and: [
                { username: { $exists: true } },
                { name: { $exists: true } },
                { emails: { $exists: true } },
                { 'emails.0.address': { $exists: true } }
              ]
            },
            { limit: data.limit }
          ).fetch();
        }
      }
    } else {
      result = Users.find().fetch();
    }
    return result;
  }
  addUserSessionLog(data) {
    return UserSessionLog.insert(data);
  }
  getOrgAdminUser(orgId) {
    const orgAdmin = OrganizationMember.findOne({
      userId: Meteor.userId(),
      orgId: orgId,
      role: { $ne: 'member' }
    });
    if (orgAdmin) {
      return true;
    } else {
      return false;
    }
  }
  updateOnlineUsers(userId, updateValue) {
    TestLog.insert({ userId: userId, logInfo: 'this is trigger updateOnlineUsers3333333333333' });
    return OnlineUsersData.update(userId, updateValue);
  }

  getUsersID(userId) {
    return Users.findOneById(userId);
  }

  getUsernameIgnoringCase(username, fields) {
    return Users.findOneByUsernameIgnoringCase(username, fields);
  }

  getfindOneByUsername(username, fieldsData) {
    return Users.findOneByUsername(username, fieldsData);
  }

  updateInviteToken(userId, token) {
    return Users.updateInviteToken(userId, token);
  }

  getOnlineUsersBoardId(whiteboardId) {
    console.log(
      'getOnlineUsersBoardId',
      whiteboardId,
      OnlineUsersData.find({ whiteboardId })
    )
    return OnlineUsersData.find({whiteboardId});
  }

  exitOnlineUserByBoardId(userId, userNo, boardId) {
    TestLog.insert({ userId: userId, userNo: userNo, logInfo: 'this is trigger exitOnlineUserByBoardId ' });
    OnlineUsersData.remove({ userId: userId, userNo: userNo, boardId: boardId });
    return true;
  }
  getAllOnlineUsers() {
    return OnlineUsersData.find().fetch();
  }
  getOnlineUserListInBoard(boardId) {
    let result = OnlineUsersData.find({ boardId: boardId });
    return result;
  }
  getOnlineUserListIByNo(userNo) {
    return OnlineUsersData.find({ userNo: userNo }).fetch();
  }

  checkIfUserInOrg(orgId, userId) {
    return OrganizationMember.findOne({ orgId: orgId, userId: userId });
  }
  checkIfUserInRoom(roomId, userId) {
    return Subscriptions.findOneByRoomIdAndUserId(roomId, userId);
  }

  deleteUser(userId) {
    //checck org
    let checkOrgMember = OrganizationMember.findOne({ userId: userId });
    if (checkOrgMember) {
      return {
        status: false,
        msg:
          'This user is a org member of ' +
          checkOrgMember.name +
          ' please remove it before delete useraccount'
      };
    }
    let checkOrg = Organization.findOne({ 'u._id': userId });
    if (checkOrgMember) {
      return {
        status: false,
        msg:
          'This user is the org creator of ' +
          checkOrg.name +
          ' please remove the Organization before delete useraccount'
      };
    }
    let checkRoomMember = RoomMember.findOne({ 'u._id': userId });
    if (checkRoomMember) {
      return {
        status: false,
        msg:
          'This user is a room member of ' +
          checkRoomMember.name +
          ' please remove it before delete useraccount'
      };
    }
    let checkRoom = Rooms.findOne({ 'u._id': userId });
    if (checkRoom) {
      return {
        status: false,
        msg:
          'This user is a room creator of ' +
          checkRoom.name +
          ' please remove it before delete useraccount'
      };
    }
    //  del board wigets and boards not done
    if (!checkOrgMember && !checkOrg && !checkRoom && !checkRoomMember) {
      Users.remove(userId);
      return { status: true, msg: 'ok' };
    }
  }

  // 计算 xp 值:
  // 1、用户24小时内使用board的次数(重复使用同一个board也计算)  10xp/次
  // 2、用户24小时内邀请新用户注册  500xp/次
  // 3、用户24小时内使用AI助手的次数  10xp/次
  calculationUserXPValue(userId) {
    let xpValue = 0;
    const now = new Date().getTime();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).getTime();

    let userSessionLog = UserSessionLog.find({
      userId: userId,
      whiteboardId: { $exists: true },
      type: 'start',
      sessionStart: { $gte: yesterday }
    }).fetch();

    const newYesterdayTime = parseInt(yesterday / 1000);
    let tokensLog = TokensLog.find({
      userId: userId,
      purchaseTime: { $gte: newYesterdayTime }
    }).fetch();

    let aiAssistLog = AIAssistLog.find({
      userId: userId,
      createdTime: { $gte: yesterday }
    }).fetch();

    xpValue =
      userSessionLog.length * 10 +
      tokensLog.length * 500 +
      aiAssistLog.length * 10;

    return xpValue;
  }

  addUserTags(data) {
    return UserTags.insert(data);
  }

  getUserTags() {
    return UserTags.find().fetch();
  }

  updatedUserTags(tag, usersData) {
    return UserTags.update(tag._id, { $set: { users: usersData } });
  }

  updateUserProfileTags(user, tags) {
    return Users.update(user._id, { $set: { tags: tags } });
  }

}
