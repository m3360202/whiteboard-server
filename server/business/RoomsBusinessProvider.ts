import { Meteor } from 'meteor/meteor';
import RoomsDataProvider from '../data/RoomsDataProvider';
import SubscriptionsDataProvider from '../data/SubscriptionsDataProvider';
import UserDataProvider from '../data/UserDataProvider';
import OrgDataProvider from '../data/OrgDataProvider';
import EmailBusinessProvider from './EmailBusinessProvider';
import { findUsersOfRoom } from '../webmethods/lib/findUsersOfRoom';
import { addUserRoles } from '../webmethods/lib/addUserRoles';
import { Match, check } from 'meteor/check';
import { hasRole } from '../webmethods/lib/hasRole';
import { getUsersInRole } from '../webmethods/lib/getUsersInRole';
import { removeUserFromRoles } from '../webmethods/lib/removeUserFromRoles';
import { escapeHTML } from '@rocket.chat/string-helpers';
import _ from 'underscore';
import s from 'underscore.string';

export default class RoomsBusinessProvider {
  static provider = null;
  static getProviderInstance() {
    if (RoomsBusinessProvider.provider == null) {
      RoomsBusinessProvider.provider = new RoomsBusinessProvider();
    }
    return RoomsBusinessProvider.provider;
  }
  getRoomInfo(roomId) {
    return RoomsDataProvider.getProviderInstance().getRoomInfo(roomId);
  }
  addUserToRoom(rid, user, inviter, orgId?, silenced?) {
    const now = new Date();
    const room = RoomsDataProvider.getProviderInstance().getRoomID(rid);
    const subscription =
      SubscriptionsDataProvider.getProviderInstance().getRoomIdAndUserId(
        rid,
        user._id
      );

    if (subscription) {
      return;
    }

    SubscriptionsDataProvider.getProviderInstance().addCreateWithRoomAndUser(
      room,
      user,
      {
        ts: now,
        open: true,
        alert: true,
        unread: 1,
        userMentions: 1,
        groupMentions: 0,
        orgId: room.orgId,
        orgName: room.orgName
      }
    );

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
    return true;
  }

  // done
  getValidRoomName(displayName, rid = '', options = { allowDuplicates: true }) {
    let slugifiedName = displayName;
    const cleanName = displayName;

    if (options.allowDuplicates !== true) {
      const room =
        RoomsDataProvider.getProviderInstance().getByDisplayName(displayName);

      if (room && room._id !== rid) {
        if (room.archived) {
          throw new Meteor.Error(
            'error-archived-duplicate-name',
            `There's an archived channel with name ${cleanName}`,
            { function: 'RocketChat.getValidRoomName', channel_name: cleanName }
          );
        } else {
          throw new Meteor.Error(
            'error-duplicate-channel-name',
            `A channel with name '${cleanName}' exists`,
            { function: 'RocketChat.getValidRoomName', channel_name: cleanName }
          );
        }
      }
    }
    slugifiedName = cleanName;
    let nameValidation;
    nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');

    if (options.allowDuplicates !== true) {
      const room =
        RoomsDataProvider.getProviderInstance().getByRoomsName(slugifiedName);

      if (room && room._id !== rid) {
        if (settings.get('UI_Allow_room_names_with_special_chars')) {
          let tmpName = slugifiedName;
          let next = 0;
          while (
            RoomsDataProvider.getProviderInstance().getByNameAndNotId(
              tmpName,
              rid
            )
          ) {
            tmpName = `${slugifiedName}-${++next}`;
          }
          slugifiedName = tmpName;
        } else if (room.archived) {
          throw new Meteor.Error(
            'error-archived-duplicate-name',
            `There's an archived channel with name ${escapeHTML(
              slugifiedName
            )}`,
            {
              function: 'RocketChat.getValidRoomName',
              channel_name: escapeHTML(slugifiedName)
            }
          );
        } else {
          throw new Meteor.Error(
            'error-duplicate-channel-name',
            `A channel with name '${escapeHTML(slugifiedName)}' exists`,
            {
              function: 'RocketChat.getValidRoomName',
              channel_name: escapeHTML(slugifiedName)
            }
          );
        }
      }
    }

    return displayName;
  }

  createRoom(
    type,
    name,
    owner,
    members = [],
    readOnly,
    publicRoom,
    { teamId, orgId, orgName, ...extraData } = {},
    options = {}
  ) {
    name = s.trim(name);
    owner = s.trim(owner);
    members = [].concat(members);

    if (!name) {
      throw new Meteor.Error('', 'Room name cannot be empty', {
        function: 'RocketChat.createRoom'
      });
    }

    owner = UserDataProvider.getProviderInstance().getUsernameIgnoringCase(
      owner,
      { fields: { username: 1 } }
    );

    if (!owner) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        function: 'RocketChat.createRoom'
      });
    }

    if (!_.contains(members, owner.username)) {
      members.push(owner.username);
    }

    if (extraData.broadcast) {
      readOnly = true;
      delete extraData.reactWhenReadOnly;
    }

    const now = new Date();

    const validRoomNameOptions = { allowDuplicates: true };

    if (options.nameValidationRegex) {
      validRoomNameOptions.nameValidationRegex = options.nameValidationRegex;
    }
    let room;
    if (publicRoom == true) {
      room = {
        fname: name,
        ...extraData,
        name: this.getValidRoomName(name, null, validRoomNameOptions),
        t: type,
        msgs: 0,
        usersCount: 0,
        u: {
          _id: owner._id,
          username: owner.username
        },
        ts: now,
        ro: readOnly === true,
        orgId,
        orgName,
        isPublicRoom: publicRoom
      };
    } else {
      room = {
        fname: name,
        ...extraData,
        name: this.getValidRoomName(name, null, validRoomNameOptions),
        t: type,
        msgs: 0,
        usersCount: 0,
        u: {
          _id: owner._id,
          username: owner.username
        },
        ts: now,
        ro: readOnly === true,
        orgId,
        orgName
      };
    }

    room._USERNAMES = members;
    delete room._USERNAMES;
    room =
      RoomsDataProvider.getProviderInstance().addCreateWithFullRoomData(room);

    for (const username of members) {
      const member =
        UserDataProvider.getProviderInstance().getfindOneByUsername(username, {
          fields: { username: 1, 'settings.preferences': 1 }
        });

      if (!member) {
        continue;
      }

      const extra = { ...options.subscriptionExtra, orgId, orgName } || {};

      extra.open = true;

      if (room.prid) {
        extra.prid = room.prid;
      }

      if (username === owner.username) {
        extra.ls = now;
      }

      SubscriptionsDataProvider.getProviderInstance().addCreateWithRoomAndUser(
        room,
        member,
        extra
      );
    }

    addUserRoles(owner._id, ['owner'], room._id);

    return {
      rid: room._id, // backwards compatible
      ...room
    };
  }

  addRoomModerator(rid, userId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addRoomModerator'
      });
    }

    const user = UserDataProvider.getProviderInstance().getUsersID(userId);

    if (!user || !user.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addRoomModerator'
      });
    }

    const subscription =
      SubscriptionsDataProvider.getProviderInstance().getRoomIdAndUserId(
        rid,
        user._id
      );

    if (!subscription) {
      throw new Meteor.Error(
        'error-user-not-in-room',
        'User is not in this room',
        {
          method: 'addRoomModerator'
        }
      );
    }

    if (
      Array.isArray(subscription.roles) === true &&
      subscription.roles.includes('moderator') === true
    ) {
      throw new Meteor.Error(
        'error-user-already-moderator',
        'User is already a moderator',
        {
          method: 'addRoomModerator'
        }
      );
    }

    SubscriptionsDataProvider.getProviderInstance().addRoleById(
      subscription._id
    );
    return true;
  }

  addUsersToRoom(data, inviteData) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addUsersToRoom'
      });
    }

    const room = RoomsDataProvider.getProviderInstance().getRoomID(data.rid);
    const userId = Meteor.userId();
    const subscription =
      SubscriptionsDataProvider.getProviderInstance().getRoomIdAndUserId(
        data.rid,
        userId,
        { fields: { _id: 1 } }
      );

    if (room.t === 'd') {
      throw new Meteor.Error(
        'error-cant-invite-for-direct-room',
        "Can't invite user to direct rooms",
        {
          method: 'addUsersToRoom'
        }
      );
    }

    if (!Array.isArray(data.users)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'addUsersToRoom'
      });
    }

    const user = Meteor.user();
    data.users.forEach(username => {
      const newUser =
        UserDataProvider.getProviderInstance().getUsernameIgnoringCase(
          username
        );

      if (!newUser) {
        throw new Meteor.Error('error-invalid-username', 'Invalid username', {
          method: 'addUsersToRoom'
        });
      }
      const subscription =
        SubscriptionsDataProvider.getProviderInstance().getRoomIdAndUserId(
          data.rid,
          newUser._id
        );

      if (!subscription) {
        this.addUserToRoom(data.rid, newUser, user);
      }
    });

    EmailBusinessProvider.getProviderInstance().InviteUserToRoomNotification(
      inviteData.roomName,
      inviteData.fromUserName,
      inviteData.toUserName,
      inviteData.locationHref,
      inviteData.language
    );

    return true;
  }

  createChannel(name, members, readOnly, customFields, extraData) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'createChannel'
      });
    }

    return this.createRoom(
      'c',
      name,
      Meteor.user() && Meteor.user()?.username,
      members,
      readOnly,
      { customFields, ...extraData }
    );
  }

  createPrivateGroup(
    data
  ) {

    let name = data.name;
    let members = data.members;
    let readOnly = data.readOnly;
    let publicRoom = data.publicRoom;
    let customFields = data.customFields;
    let extraData = data.extraData;
    let username = data.user.userName;
    console.log('createPrivateGroup', data);
    return this.createRoom(
      'p',
      name,
      username,
      members,
      readOnly,
      publicRoom,
      { ...customFields, ...extraData }
    );
  }

  removeRoomModerator(rid, userId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeRoomModerator'
      });
    }

    const user = UserDataProvider.getProviderInstance().getUsersID(userId);

    if (!user || !user.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeRoomModerator'
      });
    }

    const subscription =
      SubscriptionsDataProvider.getProviderInstance().getRoomIdAndUserId(
        rid,
        user._id
      );

    if (!subscription) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'removeRoomModerator'
      });
    }

    if (
      Array.isArray(subscription.roles) === false ||
      subscription.roles.includes('moderator') === false
    ) {
      throw new Meteor.Error(
        'error-user-not-moderator',
        'User is not a moderator',
        {
          method: 'removeRoomModerator'
        }
      );
    }

    SubscriptionsDataProvider.getProviderInstance().deleteRoleById(
      subscription._id,
      'moderator'
    );
    return true;
  }

  removeUserFromRoom(rid, username) {
    const fromId = Meteor.userId();
    if (!fromId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeUserFromRoom'
      });
    }

    const room = RoomsDataProvider.getProviderInstance().getRoomID(rid);
    const removedUser =
      UserDataProvider.getProviderInstance().getUsernameIgnoringCase(username);
    const subscription =
      SubscriptionsDataProvider.getProviderInstance().getRoomIdAndUserId(
        rid,
        removedUser._id,
        { fields: { _id: 1 } }
      );

    if (!subscription) {
      throw new Meteor.Error(
        'error-user-not-in-room',
        'User is not in this room',
        {
          method: 'removeUserFromRoom'
        }
      );
    }

    if (hasRole(removedUser._id, 'owner', room._id)) {
      const numOwners = getUsersInRole('owner', room._id).fetch().length;

      if (numOwners === 1) {
        throw new Meteor.Error(
          'error-you-are-last-owner',
          'You are the last owner. Please set new owner before leaving the room.',
          {
            method: 'removeUserFromRoom'
          }
        );
      }
    }

    SubscriptionsDataProvider.getProviderInstance().deleteRoomIdAndUserId(
      rid,
      removedUser._id
    );

    // if (['c', 'p'].includes(room.t) === true) {
    //   removeUserFromRoles(removedUser._id, ['moderator', 'owner'], rid);
    // }
    return true;
  }

  roomsInfo(roomId) {
    return this.findRoomByIdOrName(roomId);
  }

  findRoomByIdOrName(roomId) {
    if (!roomId) {
      throw new Meteor.Error(
        'error-roomid-param-not-provided',
        'The parameter "roomId" or "roomName" is required'
      );
    }
    // if (!SubscriptionsDataProvider.getProviderInstance().getRoomByIdOrName(Meteor.userId(), roomId)) {
    //   throw new Meteor.Error('not-allowed', 'You do not have access to this room');
    // };

    let room;
    if (roomId) {
      room = RoomsDataProvider.getProviderInstance().getRoomID(roomId);
    }

    if (!room) {
      throw new Meteor.Error(
        'error-room-not-found',
        'The required "roomId" or "roomName" param provided does not match any channel'
      );
    }

    const members = findUsersOfRoom({
      rid: roomId
    }).fetch();

    room.members = members;
    const moderators =
      SubscriptionsDataProvider.getProviderInstance().getRoomIdAndRoles(roomId);
    room.moderators = moderators;
    return room;
  }

  roomsDelete(roomId) {
    const room = RoomsDataProvider.getProviderInstance().getByIdOrName(roomId);

    if (room.u._id !== Meteor.userId()) {
      throw Meteor.Error('not-allowed', 'Only the owner could delete the room');
    }

    RoomsDataProvider.getProviderInstance().deleteById(roomId);
    SubscriptionsDataProvider.getProviderInstance().deleteByRoomId(roomId);
    return true;
  }

  renameRoom(rid, name) {
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        function: 'RocketChat.saveRoomName'
      });
    }

    if (!Match.test(rid, String)) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    const room = RoomsDataProvider.getProviderInstance().getRoomID(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    this.updateRoomName(rid, name);
    return { result: true, rid: room._id };
  }

  updateRoomName(rid, displayName) {
    const slugifiedRoomName = this.getValidRoomName(displayName, rid);
    return (
      RoomsDataProvider.getProviderInstance().updateNameById(
        rid,
        slugifiedRoomName,
        displayName
      ) &&
      SubscriptionsDataProvider.getProviderInstance().updateNameAndAlertByRoomId(
        rid,
        slugifiedRoomName,
        displayName
      )
    );
  }
};