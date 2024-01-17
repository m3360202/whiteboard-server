import request from 'request';
import sizeOf from 'image-size';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import BoardDataProvider from '../data/BoardDataProvider';
import WidgetDataProvider from '../data/WidgetDataProvider';
import RoomsDataProvider from '../data/RoomsDataProvider';
import getWebsiteMetaData from '../webmethods/board/getWebsiteMetaData';
import SubscriptionsDataProvider from '../data/SubscriptionsDataProvider';
import UserDataProvider from '../data/UserDataProvider';
import { Board, LocalWidget, Settings,RecentBoard } from '../../imports/lib/data/collectionsServer';
import AWS from 'aws-sdk';
import axios from 'axios';
export default class BoardBusinessProvider {
  public width: any;
  public height: any;
  public name: any;
  public roomId: any;
  static provider = null;

  static getProviderInstance() {
    if (BoardBusinessProvider.provider == null) {
      BoardBusinessProvider.provider = new BoardBusinessProvider();
    }
    return BoardBusinessProvider.provider;
  }

  constructor() {}

  async getIconListByKey(searchKey, offset) {
    const targetList = [];
    const iconList = await this.getIconListAsync(searchKey, offset);
    JSON.parse(iconList).icons.forEach(o => {
      if (o.raster_sizes[7] && o.raster_sizes[8]) {
        targetList.push({
          previewUrl: o.raster_sizes[7].formats[0].preview_url,
          downloadUrl: o.raster_sizes[8].formats[0].download_url
        });
      }
    });
    return targetList;
  }

  async getIconListAsync(searchKey, offset) {
    const request = require('request');
    let settings = Settings.findOne({ type: 'widget' });
    const options = {
      method: 'GET',
      url: settings.IconApi, //'https://api.iconfinder.com/v4/icons/search',
      qs: {
        query: searchKey,
        count: '30',
        offset,
        premium: 0,
        vector: '1'
        // style: 'flat',
      },
      headers: {
        authorization:
          'Bearer PXZNX3pOPbLxvZirAAfVoUUxX4D3KvzVbQqK4yigrYnfm3j03Y9Q95qXXvo35T1r'
      }
    };

    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject();
          throw new Error(error);
        }
        resolve(body);
      });
    });
  }

  async restoreBackup(boardId, jsonUrl) {
    const stringState = await this.got(jsonUrl);
    const json = JSON.parse(stringState);
    console.log('restoreBackup', boardId, jsonUrl, json);
    WidgetDataProvider.getProviderInstance().removeWidgetByBoardId(boardId);
    json.forEach(row => {
      WidgetDataProvider.getProviderInstance().addWidget(row);
    });
  }

  async got(url) {
    const request = require('request');
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        resolve(body);
      });
    });
  }

  insertBackupBoard(data) {
    return BoardDataProvider.getProviderInstance().addBackupBoard(data);
  }
  favoriteBoard(boardId) {
    return BoardDataProvider.getProviderInstance().favoriteBoard(boardId);
  }
  getBoardBackup(boardId) {
    return BoardDataProvider.getProviderInstance().getBoardBackup(boardId);
  }

  checkOrAddRocketChatBoard(item) {
    if (BoardDataProvider.getProviderInstance().getBoardById({ _id: item._id }))
      return 'existed';

    item.users = [];
    item.thumbnail = '';
    item.createdBy = item.userId;
    item.timestamp = Date.now();
    item.lastUpdateBy = item.userId;
    item.lastUpdateTime = Date.now();
    return BoardDataProvider.getProviderInstance().addBoard(item);
  }

  async getRecentBoardListByKey(orgId, startIndex, limit, searchKey) {
    const userId = Meteor.userId();
    if (!userId) return;
    let searchValue = [];
    if (searchKey != 'none') {
      searchValue = [
        { $sort: { lastVisit: -1 } },
        { $skip: startIndex },
        { $limit: limit },
        {
          $match: {
            name: {
              $regex: searchKey,
              $options: 'i'
            }
          }
        }
      ];
    } else {
      searchValue = [
        { $sort: { lastVisit: -1 } },
        { $skip: startIndex },
        { $limit: limit }
      ];
    }
    const boards = BoardDataProvider.getProviderInstance().getRecentBoard(
      orgId,
      userId,
      startIndex,
      limit
    );
    return boards;
  }

  async getBoardListInRoomByKey(startIndex, limit, searchKey, roomId) {
    return BoardDataProvider.getProviderInstance().getBoardListInRoomByKey(
      startIndex,
      limit,
      roomId,
      searchKey
    );
  }

  async getImageListAsync(searchKey, page, key) {
    const request = require('request');
    let settings = Settings.findOne({ type: 'widget' });
    const options = {
      method: 'GET',
      url: settings.ImageApi, //'https://pixabay.com/api/',
      qs: {
        key,
        q: searchKey,
        image_type: 'photo',
        page,
        per_page: 30,
        safesearch: true
      }
    };
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject();
          throw new Error(error);
        }
        resolve(body);
      });
    });
  }

  async getImageListByKey(searchKey, page) {
    const key = '15160116-f0abfd662828cfe85033ad77e';
    const imageList = await this.getImageListAsync(searchKey, page, key);
    return imageList;
  }

  async uploadImageByUrl(options) {
    const imageData = await this.uploadImageByUrlAsync(options);
    //console.log('imageData2----', imageData);
    const widget = {
      angle: 0,
      scaleX: 240 / imageData.width,
      scaleY: 240 / imageData.width,
      userId: options.userId,
      user_id: options.user_id,
      whiteboardId: options.whiteboardId,
      timestamp: Date.now(),
      obj_type: 'WBImage',
      selectable: true,
      left: options.left,
      top: options.top,
      width: imageData.width,
      height: imageData.height,
      src: imageData.url,
      zIndex: Date.now() * 100
    };
    return widget;
  }

  async uploadWebsite(options) {
    options.userId = Meteor.userId();
    let imageUrl;
    let publishedDate;
    let width;
    let height;
    let title;
    let description;
    const result = await getWebsiteMetaData(options.url);
    imageUrl = result.image;
    title = result.title;
    description = result.description;

    if (result && imageUrl) {
      const optionsImage = {
        url: imageUrl,
        whiteboardId: options.whiteboardId,
        userId: Meteor.userId()
      };
      let imageData = await this.uploadImageByUrlAsync(optionsImage);
      if (!imageData) {
        imageData = {};
        imageData.url = '/fileIcons/weblink.png';
        imageData.width = 500;
        imageData.height = 500;
      }

      publishedDate = result.ogDate;

      width = 500;
      height = (500 / imageData.width) * imageData.height;

      var widget = {
        userId: Meteor.userId(),
        url: options.url,
        title,
        description,
        whiteboardId: options.whiteboardId,
        publishedDate: result.date,
        obj_type: 'WBUrlImage',
        timestamp: Date.now(),
        left: options.left,
        selectable: true,
        top: options.top,
        scaleX: 1,
        scaleY: 1,
        width,
        height,
        src: imageData.url,
        imageWidth: imageData.width,
        imageHeight: imageData.height,
        angle: 0,
        zIndex: Date.now() * 100,
        logo: result.logo,
        publisher: result.publisher
      };

      return widget;
    }

    publishedDate = '';
    width = 500;
    height = 500;
    imageUrl = '/fileIcons/weblink.png';

    var widget = {
      userId: Meteor.userId(),
      url: options.url,
      title,
      description,
      whiteboardId: options.whiteboardId,
      publishedDate,
      obj_type: 'WBUrlImage',
      timestamp: Date.now(),
      left: options.left,
      top: options.top,
      selectable: true,
      scaleX: 1,
      scaleY: 1,
      width,
      height,
      src: imageUrl,
      angle: 0,
      zIndex: Date.now() * 100
    };

    const id = WidgetDataProvider.getProviderInstance().addWidget(widget);
    widget._id = id;

    return id;
  }

  async uploadImageByUrlAsync(options, callback?) {
    const defaultOptions = {
      url: '',
      userId: '',
      user_id: '',
      whiteboardId: '',
      left: 0,
      top: 0
    };
    _.extend(defaultOptions, options);
    options = defaultOptions;

    if (options.authorization) {
      options.headers = {
        authorization: options.authorization
      };
    }

    return new Promise((resolve, reject) => {
      request
        .defaults({ encoding: null })
        .get(options, async (err, response, body) => {
          if (!response) {
            resolve(false);
          }

          if (response.headers['content-type'].search(/^image\//) === -1) {
            resolve(false);
          }

          if (err || response.statusCode !== 200) {
            resolve(false);
            return (
              callback && callback(null, { errRemark: response.statusCode })
            );
          }
          const buffer = new Buffer.from(body, 'binary');
          const imageInfo = sizeOf(buffer);
          const { width } = imageInfo;
          const { height } = imageInfo;
          let name = `${Random.id()}`;

          name = `${name}.${imageInfo.type}`;
          let photoKey = `images/${name}`;
          await this.uploadToR2(photoKey, body);
          resolve({
            url: 'https://files.boardx.us/' + photoKey,
            width,
            height
          });
        });
    });
  }
  async uploadToR2(photoKey, body) {
    let settings = Settings.findOne({ type: 'upload' });
    let bucket = settings.R2BucketName; //'boardx';
    let r2 = new AWS.S3({
      endpoint: settings.R2EndPoint,
      accessKeyId: settings.R2AccessKeyId,
      secretAccessKey: settings.R2SecretAccessKey,
      signatureVersion: 'v4'
    });
    let signature = await r2.getSignedUrlPromise('putObject', {
      Bucket: bucket,
      Key: photoKey,
      Expires: 3600
    });
    let response = await axios.put(signature, body, {
      headers: { 'Content-Type': 'image/png' }
    });
    let result = 'https://files.boardx.us/' + photoKey;
    console.log('result----', result);
    return result;

    //   .then(res => {
    //    let result = 'https://files.boardx.us/' + photoKey;
    //    console.log('result----', result);
    //    return result;
    //  }).catch(error => {
    //    //console.log('error----', error);
    //  })
  }
  moveBoardById(boardId, roomId) {
    return BoardDataProvider.getProviderInstance().updateBoardById(boardId, {
      roomId
    });
  }

  duplicateBoard(boardId) {
    const self = this;
    const { name } = Meteor.users.findOne(Meteor.userId());
    const whiteboard =
      BoardDataProvider.getProviderInstance().getBoardById(boardId);
    if (!Meteor.userId()) {
      throw Meteor.Error("user can't be null");
    }
    const widget = WidgetDataProvider.getProviderInstance().getWidgetsByBoardId(
      whiteboard._id
    );

    delete whiteboard._id;
    whiteboard.name += '-Copy';

    whiteboard.createdBy = Meteor.userId();
    whiteboard.userId = Meteor.userId();
    whiteboard.createdByName = name;
    whiteboard.lastUpdateByName = name;
    whiteboard.lastUpdateTime = Date.now();
    whiteboard.lastUpdateThum = Date.now();
    whiteboard.timestamp = Date.now();

    const id = BoardDataProvider.getProviderInstance().addBoard(whiteboard);
    whiteboard._id = id;

    const oldIdObjs = {};
    const newIdObjs = {};
    const oldIdArr = [];
    widget.forEach(item => {
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
    widget.forEach(item => {
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
    delete whiteboard.thumbnail;
    return whiteboard;
  }

  getBoardById(boardId) {
    return BoardDataProvider.getProviderInstance().getBoardById(boardId);
  }

  addWhiteboard(item) {
    if (!item) return 'false';
    item.users = [];
    item.thumbnail = '';
    item.createdBy = item.userId;
    item.timestamp = Date.now();
    item.lastUpdateBy = item.userId;
    item.lastUpdateTime = Date.now();
    const id = BoardDataProvider.getProviderInstance().addBoard(item);
    item._id = id;
    return item;
  }

  deleteBoardById(boardId, deletedInfo) {
    const board = BoardDataProvider.getProviderInstance().getBoardById(boardId);
    let ownerAdminList =
      SubscriptionsDataProvider.getProviderInstance().getOwnerAndAdminByRoomId(
        board.roomId
      );
    ownerAdminList = ownerAdminList.concat(board.createdBy);
    let isDeleted = false;

    ownerAdminList.map(id => {
      if (id === Meteor.userId()) {
        isDeleted = true;
        return BoardDataProvider.getProviderInstance().deleteBoardById(
          boardId,
          { deletedInfo }
        );
      }
    });
    if (!isDeleted) {
      throw new Meteor.Error(
        'permission error',
        'Cannot remove board belong to someone else '
      );
    }
    return true;
  }

  getPendingDeletedBoard(orgId) {
    return BoardDataProvider.getProviderInstance().getPendingDeletedBoard(
      orgId
    );
  }

  restoreDeletedBoard(boardId) {
    RecentBoard.update({ boardId: boardId }, { $unset: { deletedInfo: 1 } });
    return Board.update({ _id: boardId }, { $unset: { deletedInfo: 1 } });
  }

  updateBoardById(boardId, data) {
    return BoardDataProvider.getProviderInstance().updateBoardById(
      boardId,
      data
    );
  }
  getWhiteboardTimer(boardId) {
    return BoardDataProvider.getProviderInstance().getWhiteboardTimer(boardId);
  }
  updateBoardTimer(data) {
    return BoardDataProvider.getProviderInstance().updateBoardTimer(data);
  }
  renameBoardById(boardId, newName) {
    return BoardDataProvider.getProviderInstance().updateBoardById(boardId, {
      name: newName
    });
  }

  retagBoardById(boardId, tagsName) {
    return BoardDataProvider.getProviderInstance().updateBoardById(boardId, {
      tags: tagsName
    });
  }

  uploadThumbnail2toBoardById(boardId, thumbnail2URL) {
    return BoardDataProvider.getProviderInstance().updateBoardById(boardId, {
      thumbnail2: thumbnail2URL
    });
  }

  uploadDescriptiontoBoardById(boardId, description) {
    return BoardDataProvider.getProviderInstance().updateBoardById(boardId, {
      $set: { description }
    });
  }

  getWhiteboardByRoomId(roomId) {
    if (!Meteor.userId) return [];
    if (!roomId) return [];
    const whiteboardList1 =
      BoardDataProvider.getProviderInstance().getBoardListInRoomByKey(
        roomId,
        ''
      );

    let whiteboardList2 = [];
    const room = RoomsDataProvider.getProviderInstance().getByIdOrName(roomId);
    if (room) {
      roomId = room._id;
      whiteboardList2 =
        BoardDataProvider.getProviderInstance().getBoardListInRoomByKey(
          roomId,
          ''
        );
    }

    const whiteboard = _.uniq(
      _.union(whiteboardList1, whiteboardList2),
      false,
      w => w._id
    );

    return whiteboard;
  }

  getWhiteboardByRoomIdTags(roomId, tags) {
    if (!Meteor.userId) return [];
    if (!roomId) return [];

    const whiteboardList1 =
      BoardDataProvider.getProviderInstance().getBoardListInRoomByKey(
        roomId,
        ''
      );

    let whiteboardList2 = [];
    const room = RoomsDataProvider.getProviderInstance().getByIdOrName(roomId);
    if (room) {
      roomId = room._id;
      whiteboardList2 =
        BoardDataProvider.getProviderInstance().getBoardListInRoomByKey(
          roomId,
          ''
        );
    }

    const whiteboard = _.uniq(
      _.union(whiteboardList1, whiteboardList2),
      false,
      w => w._id
    );

    return whiteboard;
  }

  getRecentBoardsByUserId(orgId, keywords, startIndex, limit,user) {
    const userId = user.userId;
    if (!userId) return;
    const value = [
      { $sort: { lastVisit: -1 } },
      { $skip: startIndex },
      { $limit: limit }
    ];

    const boards = BoardDataProvider.getProviderInstance().getRecentBoard(
      orgId,
      keywords,
      userId,
      startIndex,
      limit
    );
    return boards;
  }

  getAnonymousUsernameList() {
    return [
      'visitor_001',
      'visitor_002',
      'visitor_003',
      'visitor_004',
      'visitor_005',
      'visitor_006',
      'visitor_007',
      'visitor_008',
      'visitor_009',
      'visitor_010',
      'visitor_011',
      'visitor_012',
      'visitor_013',
      'visitor_014',
      'visitor_015',
      'visitor_016',
      'visitor_017',
      'visitor_018',
      'visitor_019',
      'visitor_020'
    ];
  }

  isAnonymousUser() {
    if (!Meteor.user()) {
      return false;
    } else if (Meteor.userId().indexOf('vistor_') > -1) {
      return false;
    } else {
      return Meteor.user()?.username.indexOf('vistor_') > -1;
    }
  }

  exitBoard(whiteboardId, self) {
    UserDataProvider.getProviderInstance().deleteOnlineuserToBoard(
      whiteboardId,
      self.connection.id
    );
    UserDataProvider.getProviderInstance().addUserSessionLog({
      whiteboardId,
      userId: self.userId,
      connectionId: self.connection.id,
      sessionStart: Date.now(),
      type: 'end'
    });
  }

  getAnonymousUserAccount(boardId) {
    const currentUserList = [];
    const anonymoustList = this.getAnonymousUsernameList();

    UserDataProvider.getProviderInstance()
      .getOnlineUsersFind({ boardId })
      .forEach(r => {
        currentUserList.push(r.username);
      });

    for (const user of anonymoustList) {
      if (!currentUserList.includes(user)) {
        return { username: user, password: 'Visitor!23' };
      }
    }
    return { username: 'visitor_001', password: 'Visitor!23' };
  }

  checkIfSupportAnonymousVisitor(boardId) {
    const board = BoardDataProvider.getProviderInstance().getBoardById({
      _id: boardId
    });
    if (board && board.allowAnonymous) {
      return true;
    }
    return false;
  }

  checkActionPermission(boardId) {
    const userId = Meteor.userId();
    const board = BoardDataProvider.getProviderInstance().getBoardById({
      _id: boardId
    });

    if (!board) throw Meteor.Error('Board not found');
    const { roomId } = board;

    if (userId && board && board.roomId !== 'anonymous') {
      const subscription =
        SubscriptionsDataProvider.getProviderInstance().getRoomByIdOrName(
          userId,
          roomId
        );
      if (subscription) {
        return 'AUTHORIZED';
      }
    }

    // if anonymousenopassword, direct get in, no nee
    if (board.allowAnonymous) {
      // if the board is anonymous board, check if password set
      if (board.visitorPass === undefined || board.visitorPass === '') {
        return 'ANONYMOUSE_NO_PASSWORD';
      }
      return 'ANONYMOUSE_NEED_PASSWORD';
    }

    // prompt a message shows that the room is not authroized, please contact the room owner for accesss
    return 'NOT_AUTHORIZED';
  }

  getMyTemplates(orgId) {
    return BoardDataProvider.getProviderInstance().getMyTemplates(orgId);
  }
  getOrgTemplates(orgId) {
    return BoardDataProvider.getProviderInstance().getOrgTemplates(orgId);
  }
  getOfficialTemplates(orgId) {
    return BoardDataProvider.getProviderInstance().getOfficialTemplates(orgId);
  }
  getTeamFavoriteBoard(orgId) {
    return BoardDataProvider.getProviderInstance().getTeamFavoriteBoard(orgId);
  }
  getTeamsManagementTemplates(orgId) {
    return BoardDataProvider.getProviderInstance().getTeamsManagementTemplates(
      orgId
    );
  }
  batchImportOfficialTemplates(templatesData) {
    return BoardDataProvider.getProviderInstance().batchImportOfficialTemplates(
      templatesData
    );
  }
  readContentFromFile(object) {
    return BoardDataProvider.getProviderInstance().readContentFromFile(object);
  }

  getBoardFileManagement(boardId) {
    return BoardDataProvider.getProviderInstance().getBoardFileManagement(
      boardId
    );
  }
}
