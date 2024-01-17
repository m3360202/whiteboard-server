import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import WidgetDataProvider from '../data/WidgetDataProvider';
import { LocalWidget } from '../../imports/lib/data/collectionsServer';
import BoardDataProvider from '../data/BoardDataProvider';
export default class WidgetBusinessProvider {
  public userId: any;
  static provider = null;

  static getProviderInstance() {
    if (WidgetBusinessProvider.provider == null) {
      WidgetBusinessProvider.provider = new WidgetBusinessProvider();
    }
    return WidgetBusinessProvider.provider;
  }
  getCommentByBoardID(boardId) {
    return WidgetDataProvider.getProviderInstance().getCommentByBoardID(boardId);
  }
  getCommentByID(commentId) {
    return WidgetDataProvider.getProviderInstance().getCommentByID(commentId);
  }
  addComment(data) {
    return WidgetDataProvider.getProviderInstance().addComment(data);
  }
  readComment(commentId) {
    return WidgetDataProvider.getProviderInstance().readComment(commentId);
  }
  delComment(commentId) {
    return WidgetDataProvider.getProviderInstance().delComment(commentId);
  }
  updateComment(data) {
    return WidgetDataProvider.getProviderInstance().updateComment(data);
  }
  createNewTemplate(data, type) {
    const self = this;
    let widget;
    let widgetsGroup;
    const  name  = Meteor.user().name;
    const templateRoomId = 'pEjM37SPro3QyJsn4';
    if (!Meteor.userId()) {
      throw Meteor.Error("user can't be null");
    }
    const templateBoard = {
      name: data.boardName,
      createBy: Meteor.userId(),
      createdByName: name,
      lastUpdateByName: name,
      lastUpdateTime: Date.now(),
      lastUpdateThum: Date.now(),
      timestamp: Date.now(),
      roomId: templateRoomId,
      orgId: data.orgId,
      onlyMe: data.onlyMe,
      description: data.description,
      thumbnail: data.thumbnail,
      tags: data.tags,
    };
    const id = BoardDataProvider.getProviderInstance().addBoard(templateBoard);//添加新的templateBoard
    widgetsGroup = WidgetDataProvider.getProviderInstance().getWidgetsByBoardId(
      data.boardId,
    );
    if (type === 'onlyWidgets') {

      let widgetArr = [];
      widgetsGroup.map((w) => {
        if (data.widget.includes(w._id)) {
          widgetArr.push(w);
        }
      })
      widget = widgetArr;
    } else {
      widget = widgetsGroup;
    }
    const oldIdObjs = {};
    const newIdObjs = {};
    const oldIdArr = [];
    widget.forEach((item) => {

      if (item._id) {
        if (!oldIdArr.includes(item._id)) {
          oldIdArr.push(item._id);
        }
      }
      if (item.obj_type === 'WBArrow') {
        if (item.connectorStart) {
          if (!oldIdArr.includes(item.connectorStart._id)) {
            oldIdArr.push(item.connectorStart._id);
          }
        }
        if (item.connectorEnd) {
          if (!oldIdArr.includes(item.connectorEnd._id)) {
            oldIdArr.push(item.connectorEnd._id);
          }
        }
      }
      if (item.lines && item.lines.length > 0) {
        for (let i = 0; i < item.lines.length; i++) {
          if (!oldIdArr.includes(item.lines[i]._id)) {
            oldIdArr.push(item.lines[i]._id);
          }
        }
      }
      if (item.panelObj && item.panelObj !== undefined) {
        if (!oldIdArr.includes(item.panelObj)) {
          oldIdArr.push(item.panelObj);
        }
      }
      if (
        (item.isPanel || item.obj_type === 'WBRectPanel') &&
        item.subObjList &&
        item.subObjList.length > 0
      ) {
        for (let i = 0; i < item.subObjList.length; i++) {
          if (!oldIdArr.includes(item.subObjList[i]._id)) {
            oldIdArr.push(item.subObjList[i]._id);
          }
        }
      }
      if ((item.isPanel || item.obj_type === 'WBRectPanel') && item.subObjs) {
        const subobjId = Object.keys(item.subObjs);
        if (subobjId.length > 0) {
          for (let i = 0; i < subobjId.length; i++) {
            if (!oldIdArr.includes(subobjId[i])) {
              oldIdArr.push(subobjId[i]);
            }
          }
        }
      }
      if (
        item.obj_type === 'WBGroup' &&
        item.objectArr &&
        item.objectArr.length > 0
      ) {
        for (let ii = 0; ii < item.objectArr.length; ii++) {
          const gobj = item.objectArr[ii];
          if (gobj._id && !oldIdArr.includes(gobj._id)) {
            oldIdArr.push(gobj._id);
          }
        }
      }
    });
    // old and new ID objects
    for (let i = 0; i < oldIdArr.length; i++) {
      const oldId = oldIdArr[i];
      const newId = LocalWidget._makeNewID();
      oldIdObjs[oldId] = i;
      newIdObjs[i] = newId;
    }
    widget.forEach((item) => {
      if (item._id) {
        item._id = newIdObjs[oldIdObjs[item._id]];
        if (item.obj_type === 'WBTextbox' || item.obj_type === 'WBTitle')
          item.obj_type = 'WBText';
      }
      if (item.obj_type === 'WBArrow') {
        if (item.connectorStart) {
          item.connectorStart._id =
            newIdObjs[oldIdObjs[item.connectorStart._id]];
        }
        if (item.connectorEnd) {
          item.connectorEnd._id = newIdObjs[oldIdObjs[item.connectorEnd._id]];
        }
      }
      if (item.lines && item.lines.length > 0) {
        for (let i = 0; i < item.lines.length; i++) {
          item.lines[i]._id = newIdObjs[oldIdObjs[item.lines[i]._id]];
        }
      }
      if (item.panelObj && item.panelObj !== undefined) {
        item.panelObj = newIdObjs[oldIdObjs[item.panelObj]];
      }
      if (
        (item.isPanel || item.obj_type === 'WBRectPanel') &&
        item.subObjList &&
        item.subObjList.length > 0
      ) {
        item.subObjs = {};
        for (let i = 0; i < item.subObjList.length; i++) {
          const newsoid = newIdObjs[oldIdObjs[item.subObjList[i]._id]];
          item.subObjs[newsoid] = true;
        }
      }
      if ((item.isPanel || item.obj_type === 'WBRectPanel') && item.subObjs) {
        const subobjId = Object.keys(item.subObjs);
        const tmpSubObjs = item.subObjs;
        item.subObjs = {};
        if (subobjId.length > 0) {
          for (let i = 0; i < subobjId.length; i++) {
            const newsoid = newIdObjs[oldIdObjs[subobjId[i]]];
            item.subObjs[newsoid] = tmpSubObjs[subobjId[i]];
          }
        }
      }
      if (
        item.obj_type === 'WBGroup' &&
        item.objectArr &&
        item.objectArr.length > 0
      ) {
        for (let ii = 0; ii < item.objectArr.length; ii++) {
          const gobjid = item.objectArr[ii]._id;
          if (gobjid) {
            const tmpnid = newIdObjs[oldIdObjs[gobjid]];
            item.objectArr[ii]._id = tmpnid;
            if (
              item.objectArr[ii].obj_type === 'WBTextbox' ||
              item.objectArr[ii].obj_type === 'WBTitle'
            )
              item.objectArr[ii].obj_type = 'WBText';
            item.objectArr[ii].whiteboardId = id;
          }
        }
      }
      item.whiteboardId = id;
      WidgetDataProvider.getProviderInstance().addWidget(item);
    });
    return true;

  }
  editTemplate(data) {
    return WidgetDataProvider.getProviderInstance().editTemplate(data);
  }
  deleteTemplate(boardId) {
    return WidgetDataProvider.getProviderInstance().deleteTemplate(boardId);
  }
  updateWidget(widgetId, item) {
    return WidgetDataProvider.getProviderInstance().updateWidget(widgetId, item);
  }

  copyPasteWidgets(data) {
    return WidgetDataProvider.getProviderInstance().addWidget(data);
  }

  removeWidget(widgetId) {
    try {
      check(widgetId, String);
      const toRemove = WidgetDataProvider.getProviderInstance().getWidgetID(widgetId);
      if (!toRemove) return 'not exists';
      toRemove.deletedBy = this.userId;
      toRemove.deletedAt = Date.now();
      toRemove.id = toRemove._id;
      delete toRemove._id;
      WidgetDataProvider.getProviderInstance().deleteWidgetID(toRemove.whiteboardId, widgetId);
      const i = WidgetDataProvider.getProviderInstance().addFromRemoveWidgetID(toRemove);
      return i;
    } catch (error) {

    }
  }

  removeWidgetArr(widgetArr) {
   
      check(widgetArr, Array);
      let i = 0;
      widgetArr.forEach((widgetId) => {
        check(widgetId, String);
        const toRemove = WidgetDataProvider.getProviderInstance().getWidgetID(widgetId);
        if (!toRemove) return 'not exists';
        toRemove.deletedBy = this.userId;
        toRemove.deletedAt = Date.now();
        toRemove.id = toRemove._id;
        delete toRemove._id;
        WidgetDataProvider.getProviderInstance().deleteWidgetID(toRemove.whiteboardId, widgetId);
        i += WidgetDataProvider.getProviderInstance().addFromRemoveWidgetID(toRemove);
      });
      return i;
 
  }

  insertWidgetArr(data) {
    data.forEach((item) => {
      WidgetDataProvider.getProviderInstance().addWidget(item);
    });
    return data.length;
  }

  insertWidget(data) {
    return WidgetDataProvider.getProviderInstance().addWidget(data);
  }

  updateWidgetArr(dataArr) {
    dataArr.forEach((item) => {
      check(item._id, String);
      Meteor.defer(() => { WidgetDataProvider.getProviderInstance().updateWidget(item._id, item); });
    });
    return dataArr.length;
  }

  getWidgetsByBoardId(whiteboardId) {
    return WidgetDataProvider.getProviderInstance().getWidgetsByBoardId(whiteboardId);
  }

  getStickyNotesWidgetsByBoardId(boardId, obj_types) {
    return WidgetDataProvider.getProviderInstance().getStickyNotesWidgetsByBoardId(
      boardId,
      obj_types
    );
  }
}

DDPRateLimiter.addRule({ type: 'method', name: 'updateWidget' }, 200, 1000);
DDPRateLimiter.addRule({ type: 'method', name: 'insertWidget' }, 10, 1000);
DDPRateLimiter.addRule({ type: 'method', name: 'updateWidgetArr' }, 100, 1000);
DDPRateLimiter.addRule({ type: 'method', name: 'removeWidget' }, 1000, 1000);
DDPRateLimiter.addRule({ type: 'method', name: 'removeWidgetArr' }, 1000, 1000);
