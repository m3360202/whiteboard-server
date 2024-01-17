import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import RoomsBusinessProvider from '../business/RoomsBusinessProvider';

Meteor.methods({
  getRoomInfo(roomId) {
    this.unblock();
    console.log('getroominfo');
    return RoomsBusinessProvider.getProviderInstance().getRoomInfo(roomId);
  },
  addRoomModerator(rid, userId) {
    this.unblock();
    check(rid, String);
    check(userId, String);
    return RoomsBusinessProvider.getProviderInstance().addRoomModerator(
      rid,
      userId
    );
  },

  addUsersToRoom(data = {}, inviteData) {
    this.unblock();
    return RoomsBusinessProvider.getProviderInstance().addUsersToRoom(
      data,
      inviteData
    );
  },

  createChannel(
    name,
    members,
    readOnly = false,
    customFields = {},
    extraData = {}
  ) {
    this.unblock();
    check(name, String);
    check(members, Match.Optional([String]));

    return RoomsBusinessProvider.getProviderInstance().createChannel(
      name,
      members,
      readOnly,
      customFields,
      extraData
    );
  },

  createPrivateGroup(
    data
  ) {
    this.unblock();
    return RoomsBusinessProvider.getProviderInstance().createPrivateGroup(
      data
    );
  },

  removeRoomModerator(rid, userId) {
    this.unblock();
    check(rid, String);
    check(userId, String);
    return RoomsBusinessProvider.getProviderInstance().removeRoomModerator(
      rid,
      userId
    );
  },

  removeUserFromRoom(rid, username) {
    this.unblock();
    check(rid, String);
    check(username, String);
    return RoomsBusinessProvider.getProviderInstance().removeUserFromRoom(
      rid,
      username
    );
  },

  'rooms.info'(roomId) {
    console.log('rooms.info', roomId);
    this.unblock();
    if (!roomId) {
      return {};
    }
    check(roomId, String);
    return RoomsBusinessProvider.getProviderInstance().roomsInfo(roomId);
  },

  roomsDelete(roomId) {
    this.unblock();
    check(roomId, String);
    return RoomsBusinessProvider.getProviderInstance().roomsDelete(roomId);
  },

  renameRoom(rid, name) {
    this.unblock();
    return RoomsBusinessProvider.getProviderInstance().renameRoom(rid, name);
  }
});
