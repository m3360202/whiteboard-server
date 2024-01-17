import { Rooms, Subscriptions } from '../../../app/models/server/index';
import { OrganizationMember } from '../../../imports/lib/data/collectionsServer';

export const addUserToRoom = function (rid, user, inviter, orgId, silenced) {
  const now = new Date();
  const room = Rooms.findOneById(rid);
  // Check if user is already in room
  const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
  if (subscription) {
    return;
  }

  Subscriptions.createWithRoomAndUser(room, user, {
    ts: now,
    open: true,
    alert: true,
    unread: 1,
    userMentions: 1,
    groupMentions: 0,
    orgId: room.orgId,
    orgName: room.orgName,
  });

  //

  const orgMember = OrganizationMember.findOne({
    orgId: room.orgId,
    userId: user._id,
  });

  if (!orgMember) {
    OrganizationMember.insert({
      orgId: room.orgId,
      name: room.orgName,
      userId: user._id,
      username: user.username,
      role: 'member',
    });
  }

  return true;
};
