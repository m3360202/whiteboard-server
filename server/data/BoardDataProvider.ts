import { Promise } from 'meteor/promise';
import {
  Board,
  BoardBackup,
  FavoriteBoard,
  RecentBoard,
  BoardTimer,
  FileManagement
} from '../../imports/lib/data/collectionsServer';
import { Rooms } from '../../app/models/server';
import { all } from 'cypress/types/bluebird';
import _ from 'underscore';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import mammoth from 'mammoth';

export default class BoardDataProvider {
  // standard: add/update/get/delete
  static provider = null;

  static getProviderInstance() {
    if (BoardDataProvider.provider == null) {
      BoardDataProvider.provider = new BoardDataProvider();
    }
    return BoardDataProvider.provider;
  }

  getBoardById(boardId) {
    return Board.findOne({_id:boardId});
  }

  getBoardFromID(id) {
    return Board.find(id);
  }

  getTeamFavoriteBoard(orgId) {
    const lookup = [
      {
        $lookup: {
          from: 'board',
          localField: 'boardId',
          foreignField: '_id',
          as: 'boards'
        }
      },
      { $match: { userId: Meteor.userId(), favorite: true } }
    ];
    let userAllFavoriteBoardList = Promise.await(
      FavoriteBoard.rawCollection().aggregate(lookup).toArray()
    );

    let orgAllRoom = Rooms.find({ orgId: orgId }).fetch();

    let teamAllBoardList = [];

    userAllFavoriteBoardList.forEach(item => {
      item.boards[0]['favoriteBoard'] = this.getfavoriteByBoardId(
        item.boards[0]._id
      );
      if (item.boards[0].orgId === orgId) {
        teamAllBoardList.push(item.boards[0]);
      } else {
        orgAllRoom.forEach(room => {
          if (room._id === item.boards[0].roomId) {
            teamAllBoardList.push(item.boards[0]);
          }
        });
      }
    });

    return teamAllBoardList;
  }

  favoriteBoard(boardId) {
    const boardFavoriteInfo = FavoriteBoard.findOne({
      boardId: boardId,
      userId: Meteor.userId()
    });
    if (!boardFavoriteInfo) {
      const data = {
        userId: Meteor.userId(),
        boardId: boardId,
        addTime: new Date(),
        favorite: true
      };
      FavoriteBoard.insert(data);
      return true;
    } else {
      if (boardFavoriteInfo.favorite === true) {
        FavoriteBoard.update(boardFavoriteInfo._id, {
          $set: { favorite: false }
        });
        return false;
      } else {
        FavoriteBoard.update(boardFavoriteInfo._id, {
          $set: { favorite: true }
        });
        return true;
      }
    }
  }

  addBoard(board) {
    board.createtime = new Date();
    return Board.insert(board);
  }

  updateBoardById(boardId, updateValue) {
    console.log('updateValue', updateValue);
    if (Object.keys(updateValue).includes('name')) {
      RecentBoard.update({ boardId }, { $set: { name: updateValue.name } });
    }
    if (Object.keys(updateValue).includes('thumbnail')) {
      RecentBoard.update(
        { boardId },
        { $set: { thumbnail: updateValue.thumbnail } }
      );
    }
    return Board.update(boardId, { $set: updateValue });
  }

  getWhiteboardTimer(data) {
    return BoardTimer.findOne({ boardId: data.boardId }) || {};
  }
  updateBoardTimer(updateValue) {
    console.log('updateValue', updateValue);
    const boardTimer = BoardTimer.findOne({ boardId: updateValue.boardId });
    if (boardTimer) {
      return BoardTimer.update(boardTimer._id, { $set: updateValue });
    } else {
      const boardTimer = BoardTimer.insert({
        boardId: updateValue.boardId,
        timerOwner: Meteor.userId(),
        timerStartTime: null,
        totalTime: null,
        timerStatus: 0,
        pauseTime: 0,
        timerMode: true,
        leftTime: 0
      });
      console.log('boardTimer', boardTimer);
      return BoardTimer.update(boardTimer, { $set: updateValue });
    }
  }

  addBackupBoard(data) {
    BoardBackup.insert(data);
    return BoardBackup.find({ boardId: data.boardId }).fetch();
  }

  getBoardBackup(boardId) {
    return BoardBackup.find({ boardId }).fetch();
  }

  deleteBoardById(boardId, updateValue) {
    Board.update(boardId, { $set: updateValue });
    return RecentBoard.update({ boardId }, { $set: updateValue });
  }

  joinedStringForRecentBoardRoomOrg = [
    {
      $unset: [
        'createdBy',
        'createdByName',
        'lastUpdateTime',
        'name',
        'roomId',
        'thumbnail',
        'orgId',
        'orgName'
      ]
    },
    {
      $lookup: {
        from: 'board',
        localField: 'boardId',
        foreignField: '_id',
        as: 'board'
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ['$board', 0] }, '$$ROOT']
        }
      }
    },
    { $project: { board: 0 } },
    {
      $addFields: {
        boardName: '$name'
      }
    },
    { $project: { name: 0 } },
    {
      $unset: ['lastUpdateByName']
    },
    {
      $lookup: {
        from: 'boardx_room',
        localField: 'roomId',
        foreignField: '_id',
        as: 'rooms'
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ['$rooms', 0] }, '$$ROOT']
        }
      }
    },
    {
      $project: {
        rooms: 0
      }
    },
    {
      $unset: [
        'groupId',
        'fname',
        't',
        'msgs',
        'usersCount',
        'u',
        'customFields',
        'broadcast',
        'encrypted',
        'ts',
        'ro',
        '_updatedAt',
        'lastMessage',
        'lm',
        'jitsiTimeout',
        'orgName'
      ]
    },
    {
      $addFields: {
        roomName: '$name'
      }
    },
    { $project: { name: 0 } },
    {
      $lookup: {
        from: 'boardx_organization',
        localField: 'orgId',
        foreignField: '_id',
        as: 'orgs'
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ['$orgs', 0] }, '$$ROOT']
        }
      }
    },
    {
      $project: {
        orgs: 0
      }
    },
    {
      $addFields: {
        orgName: '$name'
      }
    },
    { $project: { name: 0 } },
    {
      $lookup: {
        from: 'users',
        localField: 'lastUpdateBy',
        foreignField: '_id',
        as: 'boardModifier'
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ['$boardModifier', 0] }, '$$ROOT']
        }
      }
    },
    {
      $project: {
        boardModifier: 0
      }
    },
    {
      $unset: [
        'createdAt',
        'services',
        'emails',
        'profile',
        '_updatedAt',
        'roles',
        'active',
        'status',
        'statusConnection',
        'statusText',
        'username',
        'utcOffset',
        'lastLogin',
        'settings',
        'language',
        '__rooms',
        'inviteToken',
        'statusDefault',
        'avatarETag',
        'avatarOrigin',
        'requirePasswordChange',
        'type',
        'avatar'
      ]
    },
    {
      $addFields: {
        lastUpdateByName: '$name'
      }
    },
    { $project: { name: 0 } },
    {
      $addFields: {
        name: '$boardName'
      }
    },
    { $project: { boardName: 0 } },
    { $unset: '_id' },
    { $addFields: { _id: '$boardId' } }
  ];
  getRecentBoard(porgId, keywords, puserId, startIndex, limit) {
    console.log('getRecentBoard', porgId, keywords, puserId, startIndex, limit)
    let allBoards;
    if (!keywords) {
      allBoards = RecentBoard.find(
        {
          orgId: porgId,
          userId: puserId,
          deletedInfo: { $exists: false },
          isTeamsTemplate: { $ne: true },
        },
        { sort: { lastVisit: -1 }, skip: startIndex, limit: limit },
      ).fetch();
      // console.log('allBoards',allBoards,porgId, keywords, puserId, startIndex, limit)
    } else {
      const lookup = [
        {
          $lookup: {
            from: 'boardx_subscription',
            let: { roomId: '$roomId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$rid', '$$roomId'] }
                }
              },
              {
                $project: {
                  _id: 1,
                  u: 1
                  // 其他需要的属性
                }
              }
            ],
            as: 'subscriptions'
          }
        },
        {
          $match: {
            $or: [
              { 'subscriptions.u._id': puserId },
              { subscriptions: { $size: 0 } }
            ],
            orgId: porgId,
            name: { $regex: keywords, $options: 'i' },
            deletedInfo: { $exists: false },
            isTeamsTemplate: { $ne: true }
          }
        },
        {
          $sort: {
            lastUpdateTime: -1
          }
        },
        {
          $skip: startIndex
        },
        {
          $limit: limit
        }
      ];

      allBoards = Promise.await(
        Board.rawCollection().aggregate(lookup).toArray()
      );
    }

    allBoards.forEach(item => {
      if (item.boardId) {
        item['favoriteBoard'] = this.getfavoriteByBoardId(item.boardId);
      }
    });
    let action;
    if (startIndex == 0) {
      action = 'firstLoad';
    } else {
      action = keywords ? 'search' : 'fetch';
    }

    return { data: allBoards, action: action, keywords: keywords };
  }

  getPendingDeletedBoard(porgId) {
    // const stringForOrgId = [{ $match: { orgId: porgId } }];
    // const stringForFilterPendingDeletedBoard = [
    //   { $match: { deletedInfo: { $exists: true } } },
    // ];

    // var jointString = new Array();
    // jointString = stringForOrgId;
    // jointString = jointString.concat(stringForFilterPendingDeletedBoard);
    // jointString = jointString.concat(this.joinedStringForBoardRoomOrgUser);

    // const joinedBoardRoomOrgResult = Promise.await(
    //   Board.rawCollection().aggregate(jointString).toArray(),
    // );
    // return joinedBoardRoomOrgResult;
    return Board.find({
      orgId: porgId,
      deletedInfo: { $exists: true }
    }).fetch();
  }

  updateRecentBoard(boardId, updateValue, upsert) {
    return RecentBoard.update(boardId, updateValue, upsert);
  }

  joinedStringForRoomBoardList = [
    {
      $addFields: {
        boardName: '$name'
      }
    },
    { $project: { name: 0 } },
    {
      $unset: ['lastUpdateByName', 'name']
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastUpdateBy',
        foreignField: '_id',
        as: 'boardModifier'
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ['$boardModifier', 0] }, '$$ROOT']
        }
      }
    },
    {
      $project: {
        boardModifier: 0
      }
    },
    {
      $unset: [
        'createdAt',
        'services',
        'emails',
        'profile',
        '_updatedAt',
        'roles',
        'active',
        'status',
        'statusConnection',
        'statusText',
        'username',
        'utcOffset',
        'lastLogin',
        'settings',
        'language',
        '__rooms',
        'inviteToken',
        'statusDefault',
        'avatarETag',
        'avatarOrigin',
        'requirePasswordChange',
        'type',
        'avatar'
      ]
    },
    {
      $addFields: {
        lastUpdateByName: '$name'
      }
    },
    { $project: { name: 0 } },
    {
      $addFields: {
        name: '$boardName'
      }
    },
    { $project: { boardName: 0 } },
    { $sort: { lastUpdateTime: -1 } }
  ];

  getBoardListInRoomByKey(startIndex, limit, proomId, value) {
    let boardList;
    if (!value) {
      boardList = Board.find(
        { roomId: proomId, deletedInfo: null },
        { sort: { lastVisit: -1 }, skip: startIndex, limit: limit }
      ).fetch();
    } else {
      boardList = Board.find(
        {
          roomId: proomId,
          deletedInfo: null,
          name: { $regex: value, $options: 'i' }
        },
        { sort: { lastVisit: -1 }, skip: startIndex, limit: limit }
      ).fetch();
    }

    const favoriteBoardList = FavoriteBoard.find({
      userId: Meteor.userId()
    }).fetch();
    boardList.forEach(item => {
      if (item._id) {
        item['favoriteBoard'] = favoriteBoardList.find(
          favoriteItem => favoriteItem.boardId === item._id
        );
      }
    });

    boardList.sort((a, b) => a.lastUpdateTime - b.lastUpdateTime);

    return { data: boardList, action: value.length > 0 ? 'search' : 'fetch' };
  }
  getMyTemplates(orgId) {
    console.log('getMyTemplates', orgId, Meteor.userId());
    const templateRoomId = 'pEjM37SPro3QyJsn4';
    let result = Board.find({
      onlyMe: 1,
      roomId: templateRoomId,
      createBy: Meteor.userId(),
      deletedInfo: { $exists: false }
    }).fetch();
    return result;
  }
  getOrgTemplates(orgId) {
    console.log('getOrgTempletes', orgId);
    const templateRoomId = 'pEjM37SPro3QyJsn4';
    return Board.find({
      onlyMe: 2,
      roomId: templateRoomId,
      orgId: orgId,
      deletedInfo: { $exists: false }
    }).fetch();
  }
  getOfficialTemplates(orgId) {
    const templateRoomId = 'pEjM37SPro3QyJsn4';
    return Board.find({
      onlyMe: { $exists: false },
      roomId: templateRoomId,
      deletedInfo: { $exists: false }
    }).fetch();
  }

  getTeamsManagementTemplates(orgId) {
    let teamsTemplateList = Board.find({
      roomId: 'none',
      orgId: orgId,
      isTeamsTemplate: true,
      deletedInfo: { $exists: false }
    }).fetch();

    teamsTemplateList.forEach(item => {
      if (item._id) {
        item['favoriteBoard'] = this.getfavoriteByBoardId(item._id);
      }
    });
    return teamsTemplateList;
  }

  batchImportOfficialTemplates(templatesData) {
    try {
      const bulkInsertData = templatesData.map(item => ({
        insertOne: {
          document: item
        }
      }));
      Board.rawCollection().bulkWrite(bulkInsertData, {
        ordered: false
      });
      return true;
    } catch (error) {
      // 处理错误，例如记录日志或返回错误信息
      console.error('插入数据时发生错误:', error);
      return false;
    }
  }

  getfavoriteByBoardId(boardId) {
    return FavoriteBoard.findOne({ boardId: boardId, userId: Meteor.userId() });
  }

  async readDocFromURL(url) {
    let docData = await axios.get(url, {
      responseType: 'arraybuffer' // 这非常重要
    }).catch(function (error) {
      console.log(error);
      return;
    });

    return new Promise((resolve, reject) => {
      mammoth.extractRawText({ buffer: new Buffer.from(docData.data) })
        .then(function (result) {
          var text = result.value;	// 文本内容
          var messages = result.messages; // 可能会存在的错误信息
          resolve(text);
        })
        .catch(err => reject(err));
    })
  }

  async readContentFromFile(object) {
    if (object && object.obj_type === 'WBFile' && object.name.indexOf('.pdf') > -1) {
      if (object.src) {
        const response = await axios.get(object.src, { responseType: 'arraybuffer' });
        const tempFilePath = os.tmpdir() + '/' + object.name;
        fs.writeFileSync(tempFilePath, response.data);
        const loader = new PDFLoader(tempFilePath, {
          splitPages: false,
        });

        const docs = await loader.load();

        if (docs && docs.length > 0) {
          const docsContent = docs[0].pageContent.replace(/\n/g, '');

          FileManagement.insert({
            widgetId: object.id,
            boardId: object.boardId,
            userId: Meteor.userId(),
            fileSrc: object.src,
            text: docsContent,
          });

        }
        return true;
      } else {
        return { error: 'no file src' }
      }

    }
    if (object && object.obj_type === 'WBFile' && object.name.indexOf('.doc') > -1) {
      this.readDocFromURL(object.src).then(docs => {
        if (docs && docs.length > 0) {
          FileManagement.insert({
            widgetId: object.id,
            boardId: object.boardId,
            userId: Meteor.userId(),
            fileSrc: object.src,
            text: docs
          });
        }
      }).catch(err => console.log(err));
    }
    if(object && object.obj_type === 'WBUrlImage'){
      const { htmlToText } = require('html-to-text');
      axios.get(object.url).then(response => {
    const html = response.data;
    const docs = htmlToText(html, {
      wordwrap: 130,
      ignoreHref: true,
      ignoreImage:true,
      preserveNewlines:true,
    });
    if(docs && docs.length>0){
      FileManagement.insert({
        widgetId: object.id,
        boardId: object.boardId,
        userId: Meteor.userId(),
        fileSrc: object.src,
        text:docs
      });
    }
  })
  .catch(error => {
    console.log('Error:', error);
  });
    }
  }

  getBoardFileManagement(boardId) {
    const fileManagementData =  FileManagement.find({ boardId: boardId }).fetch();

    let textArr = [];

    for(let i=0;i<fileManagementData.length;i++){
      if (fileManagementData[i].text) {
        textArr.push(fileManagementData[i].text.replace(/\n/g, ''));
      }
    }

    return textArr;
  }
}
