import { Board, Widget, DeletedWiget, BoardComment,FileManagement } from '../../imports/lib/data/collectionsServer';
import EmailConstants from '../constants/EmailConstants';
import Fiber from 'fibers';
import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { Promise } from 'meteor/promise';
export default class WidgetDataProvider {
  static provider = null;

  static getProviderInstance() {
    if (WidgetDataProvider.provider == null) {
      WidgetDataProvider.provider = new WidgetDataProvider();
    }
    return WidgetDataProvider.provider;
  }
  getCommentByBoardID(boardId) {
    let result;
    const lookup = [
      {
        $lookup: {
          from: 'users',
          localField: 'createBy',
          foreignField: '_id',
          as: 'users',
        },
      },
      { $match: { boardId: boardId, type: 'main' } },
      {
        $sort: {
          lastlastVisit: 1
        }
      }
    ];
    result = Promise.await(
      BoardComment.rawCollection().aggregate(lookup).toArray(),
    );
    result.forEach((item) => {
      item['reply'] = this.getReplyByID(item._id);
    });
    return result;
  }
  getCommentByID(commentId) {
    return BoardComment.find({ _id: commentId }).fetch();
  }
  getReplyByID(commentId) {
    const item = BoardComment.find({ commentId: commentId, type: 'reply' }, { lastVisit: 1 }).fetch();
    item.forEach((c) => {
      c['users'] = Meteor.users.findOne({ _id: c.createBy });
    });

    return item;
  }
  addComment(data) {

    const createUser = Meteor.users.findOne({ _id: data.createBy });
    const board = Board.findOne({ _id: data.boardId });
    const lastReplyTime = Date.now();
    data.lastReplyTime = lastReplyTime;
    BoardComment.insert(data);
    let commentId;
    if (data.type === 'main') {
      const insertComment = BoardComment.findOne({ lastReplyTime: lastReplyTime });
      commentId = insertComment._id;
    }
    else {
      commentId = data.commentId;
    }

    if (data.mentions && data.mentions.length > 0) {
      data.mentions.forEach((c) => {
        //const onlineUser = OnlineUsers.findOne({ userId: c.member, boardId: data.boardId });
        const toUser = Meteor.users.findOne({ _id: c.member });
        //if (!onlineUser) {
        let subject = createUser.name + ' mentioned you on ' + board.name + ' board';
        let text;
        if (data.type == 'main') {
          text = EmailConstants.MENTION.format(
            createUser.name,
            board.name,
            data.content,
            board._id,
            commentId
          );
        } else {
          text = EmailConstants.REPLY.format(
            createUser.name,
            board.name,
            data.content,
            board._id,
            commentId
          );
        }
        this.sendEmail(toUser.emails[0].address, subject, text);
        // }
      })
    }
    return;
  }
  readComment(commentId) {
    //deal with reply
    const comment = BoardComment.find({
      commentId: commentId
    }).fetch();
    comment.forEach((c) => {
      if (c.hasRead && c.hasRead.length > 0) {
        if (c.hasRead.indexOf(Meteor.userId()) <= -1) {
          const arr = c.hasRead;
          arr.push(Meteor.userId());
          BoardComment.update(c._id, { $set: { hasRead: arr } });
        }

      }
      else {
        const arr = [];
        arr.push(Meteor.userId());
        BoardComment.update(c._id, { $set: { hasRead: arr } });
      }
    });
    //deal with main
    const main = BoardComment.findOne({
      _id: commentId
    });
    if (main.hasRead && main.hasRead.length > 0) {
      if (main.hasRead.indexOf(Meteor.userId()) <= -1) {
        const arr = main.hasRead;
        arr.push(Meteor.userId());
        BoardComment.update(commentId, { $set: { hasRead: arr } });
      }

    }
    else {
      const arr = [];
      arr.push(Meteor.userId());
      BoardComment.update(commentId, { $set: { hasRead: arr } });
    }
    return;
  }
  delComment(commentId) {
    const comment = BoardComment.findOne({
      _id: commentId
    });
    if (comment && comment.type === 'main') {
      BoardComment.remove({ _id: commentId });
      BoardComment.remove({ commentId: commentId });
      return;
    }
    if (comment && comment.type === 'reply') {
      return BoardComment.remove({ _id: commentId });
    }

  }
  updateComment(data) {
    const createUser = Meteor.users.findOne({ _id: data.createBy });
    const board = Board.findOne({ _id: data.boardId });
    let commentId = null;
    if (data.type === 'main') {
      commentId = data._id;
    } else {
      commentId = data._commentId;
    }
    if (data.mentions && data.mentions.length > 0) {
      data.mentions.forEach((c) => {
        //const onlineUser = OnlineUsers.findOne({ userId: c.member, boardId: data.boardId });
        const toUser = Meteor.users.findOne({ _id: c.member });
        // if (!onlineUser) {
        let subject = createUser.name + ' mentioned you on ' + board.name + ' board';
        let text;
        if (data.type == 'main') {
          text = EmailConstants.MENTION.format(
            createUser.name,
            board.name,
            data.content,
            board._id,
            commentId
          );
        } else {
          text = EmailConstants.REPLY.format(
            createUser.name,
            board.name,
            data.content,
            board._id,
            commentId
          );
        }
        this.sendEmail(toUser.emails[0].address, subject, text);
        // }
      })
    }
    return BoardComment.update({ _id: data._id }, { $set: { content: data.content, mentions: data.mentions, contentValue: data.contentValue, mentionValue: data.mentionValue } });
  }
  editTemplate(data) {
    return Board.update(
      { _id: data.boardId },
      {
        $set: {
          name: data.name,
          description: data.description,
          onlyMe: data.onlyMe,
          tags: data.tags
        }
      }
    );
  }
  deleteTemplate(boardId) {
    return Board.remove({ _id: boardId });
  }
  sendEmail(to, subject, html) {
    Fiber(function () {
      try {
        Email.send({ to, from: EmailConstants.EMAIL, subject, html });
      } catch (e) { }
    }).run();
    return 'sent';
  }

  getWidgetID(widgetId) {
    return Widget.findOne(widgetId);
  }

  getWidgetsByBoardId(whiteboardId) {
    
    console.log('getWidgetsByBoardId111');
    let widgets= Widget.find({ whiteboardId }).fetch();
    console.log('getWidgetsByBoardId222');
    return widgets;
  }

  getStickyNotesWidgetsByBoardId(boardId, obj_types) {
    let widgetData = Widget.find({
      whiteboardId: boardId,
      obj_type: {
        $in: obj_types
      }
    }).fetch();

    widgetData = widgetData.filter(
      item => item.text && item.text.includes('[template-')
    );

    return widgetData;
  }

  addWidget(data) {
    // BoardHashcode.update({ boardId: data.whiteboardId }, { $set: { boardId: data.whiteboardId, timestamp: Date.now(), updated: false } }, { upsert: true });

    return Widget.insert(data);
  }

  addFromRemoveWidgetID(deletedID) {
    return DeletedWiget.insert(deletedID);
  }

  updateWidget(widgetId, item) {
    // BoardHashcode.update({ boardId: item.boardId }, { $set: { boardId: item.boardId, timestamp: Date.now(), updated: false } }, { upsert: true });
    return Widget.update(widgetId, { $set: item });
  }

  // updateWidgetArr(item) {
  //   return Widget.update({ _id: item._id }, { $set: item });
  // }

   removeWidgetByBoardId(boardId) {
    
    return  Widget.remove({ whiteboardId: boardId });
  }

  deleteWidgetID(boardId, widgetId) {
    console.log(boardId, widgetId);
    // BoardHashcode.update({ boardId: boardId }, { $set: { boardId: boardId, timestamp: Date.now(), updated: false } }, { upsert: true });
    const widget = Widget.findOne(widgetId);
    if(widget){
      if(widget.obj_type === 'WBFile'){
        const fileManager = FileManagement.findOne({ widgetId: widget._id });
        if(fileManager){
          FileManagement.remove({ widgetId: widget._id});
        }
      }
      Widget.remove(widgetId);
    }
    

  }
}
