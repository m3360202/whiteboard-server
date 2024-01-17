/* eslint-disable no-unused-vars */

import ALY from 'aliyun-sdk';

const bucket = 'boardx';
const oss = new ALY.OSS({
  accessKeyId: 'LTAI4GAZPKWSJGCYHUFne4av',
  secretAccessKey: '3u5I9ddFT8hrQSpac1gMw0bxpmEbkG',
  // endpoint: "https://file.boardx.us",
  endpoint: 'https://oss-us-east-1.aliyuncs.com',
  apiVersion: '2013-10-15',
});

const ossURL = 'https://boardx.oss-us-east-1.aliyuncs.com';

export default function () {}
