import { Invites } from '../../app/models/server';

export default class InvitesDataProvider {
  static provider = null;
  static getProviderInstance() {
    if (InvitesDataProvider.provider == null) {
      InvitesDataProvider.provider = new InvitesDataProvider();
    }
    return InvitesDataProvider.provider;
  }

  getByUserRoomMaxUsesAndExpiration(userId, rid, orgId, maxUses, days) {
    return Invites.findOneByUserRoomMaxUsesAndExpiration(
      userId,
      rid,
      orgId,
      maxUses,
      days,
    );
  }

  addInvitesCreate(createInvite) {
    return Invites.create(createInvite);
  }

  getInvitesList(data) {
    return Invites.find(data).fetch();
  }

  getByID(id) {
    return Invites.findOneById(id);
  }

  getInvitesId(data) {
    return Invites.findOne(data);
  }

  deleteUsersInvites(id) {
    return Invites.removeById(id);
  }

  addIncreaseUsageById(id) {
    return Invites.increaseUsageById(id);
  }
}
