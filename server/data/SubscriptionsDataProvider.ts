import { Subscriptions,Rooms } from '../../app/models/server';
import { Rooms } from '../../app/models/server';

export default class SubscriptionsDataProvider {
  static provider = null;

  static getProviderInstance() {
    if (SubscriptionsDataProvider.provider == null) {
      SubscriptionsDataProvider.provider = new SubscriptionsDataProvider();
    }
    return SubscriptionsDataProvider.provider;
  }

  updateSubscriptions(orgId, orgName) {
    return Subscriptions.update({ orgId }, { $set: { orgName } }, { multi: true });
  }

  getRoomIdAndUserId(rid, uid, fields) {
    return Subscriptions.findOneByRoomIdAndUserId(rid, uid, fields);
  }
  getRoomMember(rid, uid) {
    return Subscriptions.findOneByRoomIdAndUserId(rid, uid);
  }
  getRoomIdAndRoles(roomId) { 
    let room = Rooms.findOne({_id:roomId});
    if(!room.isPublicRoom){
      return Subscriptions.findByRoomIdAndRoles(roomId, ['moderator'], { fields: { u: 1 } }).fetch().map((sub) => sub.u);
    }
    else{
      room.role='member';
      return room;
    }
  }

  getOwnerAndAdminByRoomId(roomId) {
    return Subscriptions.findByRoomIdAndRoles(roomId, ['owner', 'moderator'])
      .fetch()
      .map((sub) => sub.u._id);
  }

  getRoomByIdOrName(userId, rid) {
    let room = Rooms.findOne({_id:rid});
    if(room && room.isPublicRoom){
      return room;
    }
    else{
      
      return Subscriptions.findOne({ 'u._id': userId, rid });
    }

  }

  addRoleById(_id) {
    Subscriptions.addRoleById(_id, 'moderator');
  }

  addCreateWithRoomAndUser(room, user, createData) {
    return Subscriptions.createWithRoomAndUser(room, user, createData);
  }

  deleteRoleById(_id, role) {
    return Subscriptions.removeRoleById(_id, role);
  }

  deleteRoomIdAndUserId(rid, uid) {
    return Subscriptions.removeByRoomIdAndUserId(rid, uid);
  }

  deleteByRoomId(roomId) {
    return Subscriptions.removeByRoomId(roomId);
  }

  updateSubscriptionsToRoom(rid, userId) {
    return Subscriptions.update(
      { rid, 'u._id': userId },
      { $set: { ts: new Date(Date.now()), ls: new Date(Date.now()) } },
    );
  }

  updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName) {
    return Subscriptions.updateNameAndAlertByRoomId(
      rid,
      slugifiedRoomName,
      displayName,
    );
  }

  getByUserIdAndOrgId(userId, orgId) {
    let array = Subscriptions.findByUserIdAndOrgId(userId, orgId).fetch();
    // let publicRooms = Rooms.find({orgId:orgId,isPublicRoom:true}).fetch();
    // let arr = [];
    // publicRooms.forEach(item => {
    //   if(item.u._id != userId){
    //     arr.push(item);
    //   } 
    // });
    return array;
  }

  updateFavoriteByRoomIdAndUserId(rid, userId, f) {
    return Subscriptions.setFavoriteByRoomIdAndUserId(rid, userId, f);
  }
}
