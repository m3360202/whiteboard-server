import { Meteor } from 'meteor/meteor';

import { Invites, Users } from '../../../models/server';
import { validateInviteToken } from './validateInviteToken';
import { addUserToRoom } from '../../../../server/webmethods/lib/addUserToRoom';
import {
  OrganizationMember,
  Organization,
} from '../../../../imports/lib/data/collectionsServer';

export const useInviteToken = (userId, token) => {
  if (!userId) {
    throw new Meteor.Error('error-invalid-user', 'The user is invalid', {
      method: 'useInviteToken',
      field: 'userId',
    });
  }

  if (!token) {
    throw new Meteor.Error(
      'error-invalid-token',
      'The invite token is invalid.',
      { method: 'useInviteToken', field: 'token' },
    );
  }

  const { inviteData, room } = validateInviteToken(token);
  const user = Users.findOneById(userId);
  Users.updateInviteToken(user._id, token);
  Invites.increaseUsageById(inviteData._id);

  // If the user already has an username, then join the invite room,
  // If no username is set yet, then the the join will happen on the setUsername method
  if (inviteData.type === 'room' && user.username) {
  }
  const invite = Invites.findOne({ _id: inviteData._id });
  const userId1 = invite.userId;
  const userWhoInvite = Users.findOneById(userId1);
  const userEmail = userWhoInvite.emails[0].address;
  const userName = userWhoInvite.name;

  if (inviteData.type === 'org') {
    const org = Organization.findOne({ _id: inviteData.orgId });
    const orgName = org.name;

    const orgMember = OrganizationMember.findOne({
      orgId: inviteData.orgId,
      userId,
    });

    if (!orgMember) {
      OrganizationMember.insert({
        orgId: inviteData.orgId,
        name: orgName,
        userId,
        username: user.username,
        role: 'member',
      });
    }

    Meteor.call(
      'UserRegistrationToOrgNotification',
      orgName,
      inviteData.orgId,
      userName,
      userEmail,
      user.name,
    );

    return {
      organization: {
        ...org,
      },
    };
  }
  addUserToRoom(room._id, user);
  const orgMember = OrganizationMember.findOne({
    orgId: room.orgId,
    userId: user.userId,
  });

  if (!orgMember) {
    OrganizationMember.insert({
      orgId: room.orgId,
      name: room.orgName,
      userId: user.userId,
      username: user.username,
      role: 'member',
    });
  }

  Meteor.call(
    'UserRegistrationToRoomNotification',
    room.fname,
    inviteData.roomId,
    userName,
    userEmail,
    user.name,
  );
  return {
    room: {
      rid: inviteData.rid,
      prid: room.prid,
      fname: room.fname,
      name: room.name,
      orgId: room.orgId,
      t: room.t,
    },
  };
};
