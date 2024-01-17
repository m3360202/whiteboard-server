import { Meteor } from 'meteor/meteor';
import SubscriptionsDataProvider from '../data/SubscriptionsDataProvider';
import BoardDataProvider from '../data/BoardDataProvider';
import UserDataProvider from '../data/UserDataProvider';
import { BoardHashcode, Board,OnlineUsersData } from '../../imports/lib/data/collectionsServer';
import BoardBusinessProvider from './BoardBusinessProvider';
import { TestLog } from '../../imports/lib/data/collectionsServer';
export default class SubscriptionsBusinessProvider {
  public userId: any;
  static provider = null;

  static getProviderInstance() {
    if (SubscriptionsBusinessProvider.provider == null) {
      SubscriptionsBusinessProvider.provider = new SubscriptionsBusinessProvider();
    }
    return SubscriptionsBusinessProvider.provider;
  }
  getRoomMember(rid, uid) {
    return SubscriptionsDataProvider.getProviderInstance().getRoomMember(rid, uid);
  }
  getSubscriptions(orgId) {
    if (!Meteor.userId()) {
      return [];
    }
    return SubscriptionsDataProvider.getProviderInstance().getByUserIdAndOrgId(Meteor.userId(), orgId);
  }

  toggleFavorite(rid, f) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'toggleFavorite',
      });
    }

    const userSubscription = SubscriptionsDataProvider.getProviderInstance().getRoomIdAndUserId(rid, Meteor.userId());

    if (!userSubscription) {
      throw new Meteor.Error(
        'error-invalid-subscription',
        'You must be part of a room to favorite it',
        { method: 'toggleFavorite' },
      );
    }

    return SubscriptionsDataProvider.getProviderInstance().updateFavoriteByRoomIdAndUserId(rid, Meteor.userId(), f);
  }

  usersUser(userId) {

    return Meteor.users.find(
      { _id: userId },
      {
        fields: {
          _id: 1,
          emails: 1,
          username: 1,
          name: 1,
          avatar: 1,
          type: 1,
          credits: 1,
          status: 1,
          head_url: 1,
          referalUsers: 1,
          roles: 1,
          phone: 1,
          city: 1,
          zipCode: 1,
          state: 1,
          country: 1,
          industry: 1,
          organization: 1,
          interests: 1,
          skillLevel: 1,

        }
      }
    );
  }
 
  whiteboard(whiteboardId,userId,userNo,self) {

    const board = Board.findOne({ _id: whiteboardId });
    BoardDataProvider.getProviderInstance().updateRecentBoard(
      { userId, boardId: whiteboardId },
      {
        $set: {
          lastVisit: Date.now(),
          name: board.name,
          thumbnail: board.thumbnail,
          createdBy: board.createdBy,
          roomId: board.roomId,
          createdByName: board.createdByName,
          lastUpdateTime: Date.now(),
          lastUpdateBy: board.lastUpdateBy,
          lastUpdateByName: board.lastUpdateByName,
          orgId: board.orgId,
          isTeamsTemplate: board.isTeamsTemplate,
        }
      },
      { upsert: true }
    );
    self.onStop(() => {
    //   TestLog.insert({ logInfo:'this is trigger whiteboard publish onStop',user:userId,createdAt:new Date() });
    //   const onLineUser = OnlineUsersData.findOne({boardId:whiteboardId,userId,userNo});
    // if(onLineUser){
    //   return OnlineUsersData.remove({_id:onLineUser._id});
    // }
      BoardBusinessProvider.getProviderInstance().exitBoard(whiteboardId, self);
      console.log('onStop delete online userNo: self.connection.id ', self.connection.id);
    });

    return BoardDataProvider.getProviderInstance().getBoardFromID({ _id: whiteboardId });
  }

  onlineUsers(whiteboardId) {
    return UserDataProvider.getProviderInstance().getOnlineUsersBoardId({ boardId: whiteboardId });
  }
}
