import { Meteor } from 'meteor/meteor';
import WidgetBusinessProvider from '../business/WidgetBusinessProvider';

Meteor.methods({
  updateWidget(widgetId, item) {
    this.unblock();
    check(widgetId, String);
    return WidgetBusinessProvider.getProviderInstance().updateWidget(
      widgetId,
      item,
    );
  },
  getCommentByBoardID(boardId) {
    this.unblock();
    check(boardId, String);
    return WidgetBusinessProvider.getProviderInstance().getCommentByBoardID(boardId);
  },
  getCommentByID(commentId) {
    this.unblock();
    check(commentId, String);
    return WidgetBusinessProvider.getProviderInstance().getCommentByID(commentId);
  },
  addComment(data) {
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().addComment(data);
  },
  readComment(commentId) {
    this.unblock();
    check(commentId, String);
    return WidgetBusinessProvider.getProviderInstance().readComment(commentId);
  },
  delComment(commentId) {
    this.unblock();
    check(commentId, String);
    return WidgetBusinessProvider.getProviderInstance().delComment(commentId);
  },
  updateComment(data) {
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().updateComment(data);
  },
  createNewTemplate(data, type) {
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().createNewTemplate(data, type);
  },
  editTemplate(data) {
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().editTemplate(data);
  },
  deleteTemplate(boardId) {
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().deleteTemplate(boardId);
  },
  copyPasteWidgets(data) {
    check(data, Array);
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().copyPasteWidgets(data);
  },

  removeWidget(widgetId) {
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().removeWidget(widgetId);
  },

  removeWidgetArr(widgetArr) {
    console.log('removeWidgetArr', widgetArr)
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().removeWidgetArr(
      widgetArr,
    );
  },

  insertWidgetArr(data) {
    // console.log('insertWidgetArr', data)
    this.unblock();
    check(data, Array);
    return WidgetBusinessProvider.getProviderInstance().insertWidgetArr(data);
  },

  insertWidget(data) {
    this.unblock();
    check(data.obj_type, String);
   console.log('insertWidget111')
    let result= WidgetBusinessProvider.getProviderInstance().insertWidget(data);
    console.log('insertwidget 222')
    return result;
  },

  updateWidgetArr(dataArr) {
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().updateWidgetArr(
      dataArr,
    );
  },

  getWidgetsByBoardId(whiteboardId) {
    console.log('getWidgetsByBoardId', whiteboardId)
    check(whiteboardId, String);
    this.unblock();
    return WidgetBusinessProvider.getProviderInstance().getWidgetsByBoardId(
      whiteboardId,
    );
  },

  getStickyNotesWidgetsByBoardId(boardId, obj_types) {
    this.unblock();
    check(boardId, String);
    check(obj_types, Array);
    return WidgetBusinessProvider.getProviderInstance().getStickyNotesWidgetsByBoardId(
      boardId,
      obj_types
    );
  }
});
