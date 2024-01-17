import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';
import { Rooms, Subscriptions, Users } from '../../../app/models/server/index';
import { addUserRoles } from './addUserRoles';
import { getValidRoomName } from './getValidRoomName';

export const createRoom = function (
  type,
  name,
  owner,
  members = [],
  readOnly,
  { teamId, orgId, orgName, ...extraData } = {},
  options = {},
) {
  name = s.trim(name);
  owner = s.trim(owner);
  members = [].concat(members);

  if (!name) {
    throw new Meteor.Error('', 'Room name cannot be empty', {
      function: 'RocketChat.createRoom',
    });
  }

  owner = Users.findOneByUsernameIgnoringCase(owner, {
    fields: { username: 1 },
  });

  if (!owner) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: 'RocketChat.createRoom',
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

  const validRoomNameOptions = {};

  if (options.nameValidationRegex) {
    validRoomNameOptions.nameValidationRegex = options.nameValidationRegex;
  }

  let room = {
    fname: name,
    ...extraData,
    name: getValidRoomName(name, null, validRoomNameOptions),
    t: type,
    msgs: 0,
    usersCount: 0,
    u: {
      _id: owner._id,
      username: owner.username,
    },
    ts: now,
    ro: readOnly === true,
    orgId,
    orgName,
  };

  room._USERNAMES = members;
  delete room._USERNAMES;
  room = Rooms.createWithFullRoomData(room);

  for (const username of members) {
    const member = Users.findOneByUsername(username, {
      fields: { username: 1, 'settings.preferences': 1 },
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

    Subscriptions.createWithRoomAndUser(room, member, extra);
  }

  addUserRoles(owner._id, ['owner'], room._id);
  return {
    rid: room._id, // backwards compatible
    ...room,
  };
};
