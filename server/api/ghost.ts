import GhostAdminAPI from '@tryghost/admin-api';
import { Meteor } from 'meteor/meteor';
import axios from 'axios';
import AWS from 'aws-sdk';
import {
  BoardArticle,
  Settings
} from '../../imports/lib/data/collectionsServer';

function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

async function processJson(orgId, json) {
  // 定义函数处理嵌套数组或对象
  const processNested = async value => {
    // 判断值的类型是否是对象或数组，如果是则递归调用处理函数
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          await processNested(value[i]);
        }
      } else {
        for (let key in value) {
          if (
            key === 'src' &&
            typeof value[key] === 'string' &&
            value[key].startsWith('data:image')
          ) {
            // 如果当前属性是 "src"，且值是以 data:image 开头的字符串，则进行 base64 解析并上传到服务器
            const buffer = Buffer.from(value[key].split(',')[1], 'base64');
            let name = generateUUID() + '.png';
            let picKey = orgId + '/ghost/image' + name;
            const pic = await uploadToR2(picKey, buffer);
            value[key] = pic;
          } else {
            // 其它属性递归处理嵌套值
            await processNested(value[key]);
          }
        }
      }
    }
  };

  // 调用函数递归处理 JSON 对象
  await processNested(json);

  return json;
}
async function processHTML(orgId, html) {
  const imgs = [];
  const regex = /<img [^>]*src="([^"]*)"[^>]*>/g;
  let match;

  while ((match = regex.exec(html))) {
    const src = match[1];
    if (src.startsWith('data:image')) {
      imgs.push(src);
    }
  }

  const promises = imgs.map(async img => {
    const buffer = Buffer.from(img.split(',')[1], 'base64');
    let key = orgId + '/ghost/image';
    const pic = await uploadToR2(key, buffer);
    html = html.replace(`src="${img}"`, `src="${pic}"`);
  });

  return Promise.all(promises).then(() => html);
}

async function uploadToR2(photoKey, body) {
  const settings = Settings.findOne({ type: 'upload' });
  const bucket = settings.R2BucketName;
  const r2 = new AWS.S3({
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
  return result;
}

async function getGhostMembers() {
  return new Promise((resolve, reject) => {
    const api = new GhostAdminAPI({
      url: 'https://share.boardx.us',
      key: '637fee7a70ac70074d789906:ac9850894b6501008e09d7a5beff7a2f650f7a01f92bfedd4ebacf1f300d443c',
      version: 'v5.0'
    });
    api.members
      .browse()
      .then(res => {
        resolve(res);
      })
      .catch(e => {
        console.log('error of getGhostMembers-------', e);
      });
  });
}

Meteor.methods({

  postArticle: async sendData => {
    return new Promise(async(resolve,reject) => {
    const user = sendData.user;
    const api = new GhostAdminAPI({
      url: sendData.ghost.ghostUrl,
      key: sendData.ghost.ghostKey,
      version: 'v5.0'
    });
    // let htmlConvert = await processHTML(sendData.orgInfo.orgId, sendData.data);
    //let markdown = '<!--kg-card-begin: html--><link  rel="stylesheet" href="https://files.boardx.us/styles.css">' + htmlConvert + '<!--kg-card-end: html-->';
    const converter = require('@tryghost/html-to-mobiledoc');
    const mobiledoc = converter.toMobiledoc(sendData.data);
    let author ;
    api.users.read({ slug: sendData.author }).then(res => { 
      author = res;
      const data = {
        title: sendData.title +  '  -' +  user.name,
        mobiledoc: JSON.stringify(mobiledoc),
        tags: sendData.tagData,
        authors: [author],
        primary_author: author,
        author_id: author.id,
        status: 'draft'
      };
      api.posts.add(data).then(res => {
          if (res.id) {
            resolve({ msg: 'ok', status: 1 });
          }
        })
        .catch(e => {
          reject({ msg: 'fail', status: 0 });
        });
      }).catch(e => { 
        reject({ msg: 'fail', status: 0 });
      });    
    });
  },
  getGhostTags: async sendData => {
    return new Promise((resolve, reject) => {
      const api = new GhostAdminAPI({
        url: sendData.ghostUrl,
        key: sendData.ghostKey,
        version: 'v5.0'
      });
      api.tags
        .browse({ limit: 99 })
        .then(res => {
          if (res) {
            if (res.length > 0) {
              let arr = [];
              res.forEach(t => {
                if (t.id && t.name && t.slug) {
                  let children = {
                    id: t.id,
                    name: t.name,
                    slug: t.slug
                  };
                  arr.push(children);
                }
              });
              resolve(arr);
            } else {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        })
        .catch(e => {
          reject(false);
        });
    });
  },
  getLinkedinCode: async (data) => {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    axios.post('https://www.linkedin.com/oauth/v2/accessToken', data, { headers: headers}).then((res)=>{
      return res;
    }).catch((error)=>{
      console.log('error',error);
      return false;
    })
  },
  saveArticle: async data => {
    let user = data.user;
    let getArticle = BoardArticle.findOne({
      boardId: data.boardId,
      editor: user.userId;
    });
    let htmlConvert = await processJson(data.orgId, JSON.parse(data.data));
    if (getArticle) {
      let lastEditTimestamp = Date.now();
      BoardArticle.update(
        { boardId: data.boardId, editor: user.userId },
        {
          $set: {
            lastEditTimestamp: lastEditTimestamp,
            article: JSON.stringify(htmlConvert)
          }
        }
      );
      return JSON.stringify(htmlConvert);
    } else {
      let insertData = {
        boardId: data.boardId,
        editor: user.userId,
        lastEditTimestamp: Date.now(),
        article: JSON.stringify(htmlConvert)
      };
      BoardArticle.insert(insertData);
      return insertData;
    }
  },
  removeArticle: async data => {
    let user = data.user;
    BoardArticle.remove({ boardId: data.boardId, editor: user.userId });
    return true;
  },
  getArticle: async data => {
    let user = data.user;
    let result = BoardArticle.findOne({
      boardId: data.boardId,
      editor: user.userId
    });
    return result ? result : {};
  },
  updateGhostMembersInfo: async userData => {
    // 获取ghost所有的members
    const ghostMembers = await getGhostMembers();
    let updateMemberData = [];
    let newUserList = [];
    // 遍历所有的members
    for (let member of ghostMembers) {
      for (const user of userData) {
        if (
          member.email === user.email 
        ) {
          if (user.tags && user.tags.length > 0) {
            let newLabels = [];

            for (const tag of user.tags) {
              newLabels.push({
                name: tag,
                id: member.id,
                created_at: new Date(member.updated_at),
                updated_at: new Date(member.updated_at),
                slug: tag
              });
            }
            member = {
              ...member,
              name: user.name,
              labels: [...newLabels]
            };
          }
          updateMemberData.push(member);
        }
        newUserList.push(user);
      }
    }

    newUserList = newUserList.filter(
      u => !(u.userName.includes('vistor_') || u.name.includes('vistor'))
    );

    // 更新members
    const api = new GhostAdminAPI({
      url: 'https://share.boardx.us',
      key: '637fee7a70ac70074d789906:ac9850894b6501008e09d7a5beff7a2f650f7a01f92bfedd4ebacf1f300d443c',
      version: 'v5.0'
    });

    const updatePromises = updateMemberData.map(member => {
      return api.members
        .edit({
          id: member.id,
          name: member.name,
          labels: member.labels
        })
        .then(member => {
          return { member, updateMemberData };
        })
        .catch(error => {
          console.error('Error updating member:', error);
          throw error;
        });
    });

    const addPromises = newUserList.map(user => {
      return api.members
        .add({ email: user.email })
        .then(member => {
          return { member, newUserList };
        })
        .catch(error => {
          console.error('Error add member:', error);
          throw error;
        });
    });

    return Promise.all([...updatePromises, ...addPromises]);
  }
});
