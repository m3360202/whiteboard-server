import SubscriptionsBusinessProvider from '../business/SubscriptionsBusinessProvider';
import { Meteor } from 'meteor/meteor';
import { AIChat, BoardTimer, OnlineUsersData, Board } from '../../imports/lib/data/collectionsServer';
import { Users  } from '../../app/models/server/raw/index';

Meteor.methods({
  'subscriptions.get'(orgId) {
    console.log('getsubscriptions', orgId);
    this.unblock();
    return SubscriptionsBusinessProvider.getProviderInstance().getSubscriptions(
      orgId,
    );
  },
  getRoomMember(rid, uid) {
    this.unblock();
    console.log('getroommember');
    return SubscriptionsBusinessProvider.getProviderInstance().getRoomMember(rid, uid);
  },
  toggleFavorite(rid, f) {
    this.unblock();
    return SubscriptionsBusinessProvider.getProviderInstance().toggleFavorite(
      rid,
      f,
    );
  },
});

Meteor.publish({
  'aiChat'(chatSessionId: string, limit: number) {
    const userId = this.userId;
    return AIChat.find(
      { chatSessionId: chatSessionId, userId: userId },
      { limit: limit, sort: { createdAt: -1 } }
    );
  },
  'timer'(whiteboardId: string) {
    return BoardTimer.find(
      { boardId: whiteboardId }
    );
  },
  'users.user'() {
    const userId = this.userId;
 
    if(userId){
      const user = Users.find({ _id: userId });
      return user;
    }else{
      return [];
    }
    
  },
  'onlineUsers'(boardId) {
    const user = OnlineUsersData.find({ boardId });
    return user;
  },
  'whiteboard'(boardId: string,userNo:string) {
    const userId=this.userId;
    if(!userId) return [];
    const self = this;
    return SubscriptionsBusinessProvider.getProviderInstance().whiteboard(
      boardId,
      userId,
      userNo,
      self
    );
  },
});
