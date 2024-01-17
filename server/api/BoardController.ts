import { Meteor } from 'meteor/meteor';
import BoardBusinessProvider from '../business/BoardBusinessProvider';

Meteor.methods({
  async getIconListByKey(searchKey, offset) {
    this.unblock();
    const targetList =
      await BoardBusinessProvider.getProviderInstance().getIconListByKey(
        searchKey,
        offset
      );
    return targetList;
  },

  publishWhiteboardActivity(whiteboardId, message) {
    this.unblock();
    check(whiteboardId, String);
    check(message, Array);
    return BoardBusinessProvider.getProviderInstance().publishWhiteboardActivity(
      whiteboardId,
      message
    );
  },

  async restoreBackup(boardId, backupData) {
    const self = this;
    self.unblock();
    check(boardId, String);
    const jsonUrl = backupData.stateJsonSrc;
    check(jsonUrl, String);

    await BoardBusinessProvider.getProviderInstance().restoreBackup(
      boardId,
      jsonUrl
    );
    return true;
  },

  insertBackupBoard(data) {
    check(data.boardId, String);
    const self = this;
    self.unblock();
    return BoardBusinessProvider.getProviderInstance().insertBackupBoard(data);
  },

  getBoardBackup(boardId) {
    const self = this;
    self.unblock();
    return BoardBusinessProvider.getProviderInstance().getBoardBackup(boardId);
  },
  favoriteBoard(boardId) {
    this.unblock();
    check(boardId, String);
    return BoardBusinessProvider.getProviderInstance().favoriteBoard(boardId);
  },
  checkOrAddRocketChatBoard(item) {
    this.unblock();
    check(item._id, String);
    return BoardBusinessProvider.getProviderInstance().checkOrAddRocketChatBoard(
      item
    );
  },

  async getRecentBoardListByKey(orgId, startIndex, limit, searchKey) {
    console.log('getRecentBoardListByKey');
    this.unblock();
    check(orgId, String);
    check(searchKey, String);
    return await BoardBusinessProvider.getProviderInstance().getRecentBoardListByKey(
      orgId,
      startIndex,
      limit,
      searchKey
    );
  },

  async getBoardListInRoomByKey(startIndex, limit, searchKey, roomId, orgId) {
    this.unblock();
    console.log(
      'getBoardListInRoomByKey',
      startIndex,
      limit,
      searchKey,
      roomId
    );
    if (!roomId) {
      return [];
    }
    return await BoardBusinessProvider.getProviderInstance().getBoardListInRoomByKey(
      startIndex,
      limit,
      searchKey,
      roomId
    );
  },

  async getImageListByKey(searchKey, page) {
    this.unblock();
    return await BoardBusinessProvider.getProviderInstance().getImageListByKey(
      searchKey,
      page
    );
  },

  getCurrentTime() {
    this.unblock();
    return Date.now();
  },

  async uploadImageByUrl(options) {
    this.unblock();
    return await BoardBusinessProvider.getProviderInstance().uploadImageByUrl(
      options
    );
  },

  async uploadWebsite(options) {
    this.unblock();
    return await BoardBusinessProvider.getProviderInstance().uploadWebsite(
      options
    );
  },

  // ---------main.js

  updateBoardById(boardId, data) {
    this.unblock();
    check(boardId, String);
    check(data, Object);

    return BoardBusinessProvider.getProviderInstance().updateBoardById(
      boardId,
      data
    );
  },

  updateBoardTimer(data) {
    this.unblock();
    check(data, Object);

    return BoardBusinessProvider.getProviderInstance().updateBoardTimer(
      data
    );
  },
  moveBoardById(boardId, roomId) {
    this.unblock();
    check(boardId, String);
    check(roomId, String);
    return BoardBusinessProvider.getProviderInstance().moveBoardById(
      boardId,
      roomId
    );
  },

  duplicateBoard(boardId) {
    this.unblock();
    check(boardId, String);
    return BoardBusinessProvider.getProviderInstance().duplicateBoard(boardId);
  },

  getBoardById(boardId) {
    console.log('getBoardById', boardId);
    this.unblock();
    check(boardId, String);
    return BoardBusinessProvider.getProviderInstance().getBoardById(boardId);
  },

  addWhiteboard(item) {
    console.log('addwhiteboard', item);
    check(item.userId, String);
    check(item.name, String);
    check(item.roomId, String);
    check(item.createdByName, String);
    // check(item, Object);
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().addWhiteboard(item);
  },

  deleteBoardById(boardId, deletedInfo) {
    this.unblock();
    check(boardId, String);
    return BoardBusinessProvider.getProviderInstance().deleteBoardById(
      boardId,
      deletedInfo
    );
  },

  getPendingDeletedBoard(orgId) {
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().getPendingDeletedBoard(
      orgId
    );
  },

  restoreDeletedBoard(boardId) {
    this.unblock();
    check(boardId, String);
    return BoardBusinessProvider.getProviderInstance().restoreDeletedBoard(
      boardId
    );
  },

  renameBoardById(boardId, newName) {
    this.unblock();
    check(boardId, String);
    check(newName, String);
    return BoardBusinessProvider.getProviderInstance().renameBoardById(
      boardId,
      newName
    );
  },

  retagBoardById(boardId, tagsName) {
    this.unblock();
    check(boardId, String);
    check(tagsName, Array);
    return BoardBusinessProvider.getProviderInstance().retagBoardById(
      boardId,
      tagsName
    );
  },

  uploadThumbnail2toBoardById(boardId, thumbnail2URL) {
    console.log('uploadThumbnail2toBoardById', boardId, thumbnail2URL);
    this.unblock();
    check(boardId, String);
    check(thumbnail2URL, String);
    return BoardBusinessProvider.getProviderInstance().uploadThumbnail2toBoardById(
      boardId,
      thumbnail2URL
    );
  },

  uploadDescriptiontoBoardById(boardId, description) {
    this.unblock();
    check(boardId, String);
    check(description, String);
    return BoardBusinessProvider.getProviderInstance().uploadDescriptiontoBoardById(
      boardId,
      description
    );
  },

  getWhiteboardByRoomId(roomId) {
    console.log('getWhiteboardByRoomId');
    this.unblock();
    check(roomId, String);
    return BoardBusinessProvider.getProviderInstance().getWhiteboardByRoomId(
      roomId
    );
  },

  getWhiteboardByRoomIdTags(roomId, tags) {
    console.log('getWhiteboardByRoomIdTags');
    this.unblock();
    check(roomId, String);
    return BoardBusinessProvider.getProviderInstance().getWhiteboardByRoomIdTags(
      roomId,
      tags
    );
  },

  getRecentBoardsByUserId(orgId, keywords, startIndex, limit,user) {
    this.unblock();
    check(orgId, String);
    return BoardBusinessProvider.getProviderInstance().getRecentBoardsByUserId(
      orgId,
      keywords,
      startIndex,
      limit,
      user
    );
  },

  isAnonymousUser() {
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().isAnonymousUser();
  },

  exitBoard(whiteboardId) {
    this.unblock();
    const self = this;
    BoardBusinessProvider.getProviderInstance().exitBoard(whiteboardId, self);
    return true;
  },

  getAnonymousUserAccount(boardId) {
    console.log('getAnonymousUserAccount');
    this.unblock();
    check(boardId, String);
    return BoardBusinessProvider.getProviderInstance().getAnonymousUserAccount(
      boardId
    );
  },

  checkIfSupportAnonymousVisitor(boardId) {
    console.log('checkIfSupportAnonymousVisitor');
    this.unblock();
    check(boardId, String);
    return BoardBusinessProvider.getProviderInstance().checkIfSupportAnonymousVisitor(
      boardId
    );
  },

  checkPermission(boardId) {
    this.unblock();
    check(boardId, String);
    return BoardBusinessProvider.getProviderInstance().checkPermission(boardId);
  },

  getMyTemplates(orgId) {
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().getMyTemplates(orgId);
  },
  getOrgTemplates(orgId) {
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().getOrgTemplates(orgId);
  },
  getOfficialTemplates(orgId) {
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().getOfficialTemplates(
      orgId
    );
  },

  getTeamFavoriteBoard(orgId) {
    console.log('getTeamFavoriteBoard');
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().getTeamFavoriteBoard(
      orgId
    );
  },

  getTeamsManagementTemplates(orgId) {
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().getTeamsManagementTemplates(
      orgId
    );
  },

  batchImportOfficialTemplates(templatesData) {
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().batchImportOfficialTemplates(
      templatesData
    );
  },
  getWhiteboardTimer(boardId){
    return BoardBusinessProvider.getProviderInstance().getWhiteboardTimer(boardId);
 },
 readContentFromFile(object) {
  return BoardBusinessProvider.getProviderInstance().readContentFromFile(object);
 },

 getBoardFileManagement(boardId) {
    this.unblock();
    return BoardBusinessProvider.getProviderInstance().getBoardFileManagement(
      boardId
    );
  }
});

DDPRateLimiter.addRule(
  { type: 'method', name: 'publishWhiteboardActivity' },
  1000,
  1000,
);
DDPRateLimiter.addRule({ type: 'method', name: 'getBoardBackup' }, 10, 1000);
DDPRateLimiter.addRule(
  { type: 'method', name: 'checkOrAddRocketChatBoard' },
  10,
  1000,
);
DDPRateLimiter.addRule({ type: 'method', name: 'checkPermission' }, 10, 1000);
