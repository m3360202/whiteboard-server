import { Rooms } from '../../app/models/server';
import { Subscriptions } from '../../app/models/server';
import {
  RoomMember,
} from '../../imports/lib/data/collectionsServer';
export default class RoomsDataProvider {
  static provider = null;

  static getProviderInstance() {
    if (RoomsDataProvider.provider == null) {
      RoomsDataProvider.provider = new RoomsDataProvider();
    }
    return RoomsDataProvider.provider;
  }

  // calling Room with Mongodb collection: Rooms.getCollection()
  updateRooms(orgId, orgName) {
    Rooms.update({ orgId }, { $set: { orgName } }, { multi: true });
  }
  getRoomInfo(roomId) {
    return Rooms.findOne({ _id: roomId });
  }

  getRoomID(rid, data) {
    return Rooms.findOneById(rid, data);
  }

  getByIdOrName(roomId) {
    return Rooms.findOneByIdOrName(roomId);
  }

  getRoomsID(_id) {
    return Rooms.findOne(_id);
  }

  getByRoomsName(slugifiedName) {
    return Rooms.findOneByName(slugifiedName);
  }

  getByNameAndNotId(tmpName, rid) {
    return Rooms.findOneByNameAndNotId(tmpName, rid);
  }

  deleteById(roomId) {
    return Rooms.removeById(roomId);
  }

  updateNameById(rid, slugifiedRoomName, displayName) {
    return Rooms.setNameById(rid, slugifiedRoomName, displayName);
  }

  getByDisplayName(displayName) {
    return Rooms.findOneByDisplayName(displayName);
  }

  addCreateWithFullRoomData(room) {
    return Rooms.createWithFullRoomData(room);
  }



}
