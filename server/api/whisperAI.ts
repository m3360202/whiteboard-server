import { Meteor } from 'meteor/meteor';
import axios from 'axios';
import AWS from 'aws-sdk';
import https from 'https';
import {
  Settings,
  BatchJob,
  Widget,
  AIChat
} from '../../imports/lib/data/collectionsServer';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import os from 'os';
import mammoth from 'mammoth';

const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
// 获取音频流
function getAudioStream(audioUrl, retries = 50) {
  return new Promise((resolve, reject) => {
    https
      .get(audioUrl, res => {
        const fileStream = fs.createWriteStream('audio.mp3');
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          try {
            const readStream = fs.createReadStream('audio.mp3');
            resolve(readStream);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', err => {
        if (retries > 0) {
          console.log(
            `Failed to download audio. ${retries} retries left.`,
            err
          );
          getAudioStream(audioUrl, retries - 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(
            new Error(
              `Failed to download audio after ${retries} retries. ${err}`
            )
          );
        }
      });
  });
}
async function translateText(resultUrl, attempts = 0) {
  const maxAttempts = 60; // 设置最大递归次数
  let config = {
    method: 'get',
    url: resultUrl,
    headers: {
      Authorization: 'Token 0a0ad1c1eb969733595072bffcc4b99d73a79b95',
      'Content-Type': 'application/json'
    }
  };
  try {
    const result = await axios.get(config.url, { headers: config.headers });
    if (result.status === 200) {
      let isDone = result.data.completed_at;
      if (isDone === null) {
        // 判断当前递归次数是否已超过最大递归次数
        if (attempts < maxAttempts) {
          console.log('Waiting for translation to complete...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          return translateText(resultUrl, attempts + 1); // 递归调用，并增加递归计数器
        } else {
          console.log(`Translation took too long (${maxAttempts} attempts).`);
          return null;
        }
      } else {
        const translation = result.data.output.transcription;
        console.log(`Translation: ${translation}`);
        return result.data.output.transcription;
      }
    } else {
      console.log(`There was an error: ${result.statusText}`);
    }
  } catch (error) {
    console.error(error);
  }
}

async function addBatchJob(newTextWidget) {
  return BatchJob.insert(newTextWidget);
}

async function updateBatchJobStatus(predictionId, updatedData) {
  return BatchJob.update(
    { predictionId: predictionId },
    { $set: updatedData }
  );
}

async function readDocFromURL(url) {
  let docxFileresponse: any = await axios
    .get(url, {
      responseType: 'arraybuffer', // 这非常重要
    })
    .catch(function (error) {
      console.log(error);
      return;
    });

  const docxFileBuffer = Buffer.from(docxFileresponse.data);

  return new Promise((resolve, reject) => {
    mammoth
      .extractRawText({ buffer: docxFileBuffer })
      .then(function (result) {
        var text = result.value ? result.value.replace(/\n/g, '') : ' '; // 文本内容
        var messages = result.messages; // 可能会存在的错误信息
        resolve(text);
      })
      .catch((err) => reject(err));
  });
}

Meteor.methods({
  'ai.audioToTextOpenAi': async (key, userChatId) => {
    const settings = Settings.findOne({ type: 'upload' });
    const aiSettings = Settings.findOne({ type: 'ai' });
    const configuration = new Configuration({
      apiKey: aiSettings.apiKey,
    });
    const bucket = settings.R2BucketName;
    const r2 = new AWS.S3({
      endpoint: settings.R2EndPoint,
      accessKeyId: settings.R2AccessKeyId,
      secretAccessKey: settings.R2SecretAccessKey,
      signatureVersion: 'v4',
    });
    const signature = await r2.getSignedUrlPromise('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: 3600,
    });
    const fileData = await axios.get(signature);
    const audioUrl = fileData.config.url;
    const openai = new OpenAIApi(configuration);
    let stream = await getAudioStream(audioUrl);

    const resp = await openai.createTranscription(stream, 'whisper-1');
    let result = resp;
    AIChat.update(userChatId, { $set: { message: result.data.text } });
    return result.data.text;
  },

  'ai.fileToTextOpenAi': async (fileData, userChatId) => {
    const fileExtension = fileData.fileName.match(/\.(.+)$/);

    const extension = fileExtension
      ? fileExtension[1].toLocaleLowerCase()
      : undefined;

    if (!extension) return { error: 'file error' };
    
    if (extension === 'pdf') {
      if (fileData.fileUrl) {
        const pdfFileResponse = await axios.get(fileData.fileUrl, {
          responseType: 'arraybuffer',
        });

        const tempFilePath = os.tmpdir() + '/' + fileData.fileName;

        fs.writeFileSync(tempFilePath, pdfFileResponse.data);

        const loader = new PDFLoader(tempFilePath, {
          splitPages: false,
        });

        const docs = await loader.load();

        if (docs && docs.length > 0) {
          const docsContent = docs[0].pageContent.replace(/\s+/g, ' ');
          AIChat.update(userChatId, { $set: { message: docsContent } });
        }
        return true;
      } else {
        return { error: 'no file src' };
      }
    }

    if (extension === 'doc' || extension === 'docx') {
      readDocFromURL(fileData.fileUrl)
        .then((docs) => {
          AIChat.update(userChatId, { $set: { message: docs } });
        })
        .catch((err) => console.log(err));
    }

  },

  'ai.audioToTexts': async (url) => {
    const aiSettings = Settings.findOne({ type: 'ai' });
    const configuration = new Configuration({
      apiKey: aiSettings.apiKey,
    });
    const audioUrl = url;
    const openai = new OpenAIApi(configuration);
    let stream = await getAudioStream(audioUrl);

    const resp = await openai.createTranscription(stream, 'whisper-1');
    let result = resp;
    return result.data.text;
  },
  'ai.audioToText': async (key, textWidget) => {
    let config = {
      method: 'post',
      url: 'https://api.replicate.com/v1/predictions',
      headers: {
        Authorization: 'Token 0a0ad1c1eb969733595072bffcc4b99d73a79b95',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        version:
          'b6e7ea7aef18444c29d974fee51ffc1e47e1699cfaf4e5cde0ba47a8db74f3b6',
        input: {
          audio: key,
          model: 'medium', //Allowed values:tiny, base, small, medium, large
          transcription: 'plain text', //Allowed values:plain text, srt, vtt
          translate: false, //Translate the text to English when set to True
          temperature: 0, //temperature to use for sampling 0
          suppress_tokens: '-1',
          condition_on_previous_text: true,
          temperature_increment_on_fallback: 0.2,
          compression_ratio_threshold: 2.4,
          logprob_threshold: -1,
          no_speech_threshold: 0.6,
        },
      }),
    };

    // create prediction and add Batch Job
    axios
      .post(config.url, config.data, { headers: config.headers })
      .then((res) => {
        const newTextWidget = {
          ...textWidget,
          status: res.data.status,
          createdAt: res.data.created_at,
          predictionId: res.data.id,
        };
        addBatchJob(newTextWidget);
      })
      .catch((e) => {
        console.log('ai.audioToText', e);
        return e;
      });
  },
  'ai.getAudioToTextStatus': async () => {
    // 监测 prediction 的状态
    // https://api.replicate.com/v1/predictions/mh27qmd7yvf3hhtznnqg35qpfi
    // https://api.replicate.com/v1/predictions/tqxz3j6wvvczzix7uv3yqq3rce
    // https://api.replicate.com/v1/predictions/nwcnsngak5ckxpoztiz367prie
    let config = {
      method: 'get',
      url: 'https://api.replicate.com/v1/predictions/',
      headers: {
        Authorization: 'Token 0a0ad1c1eb969733595072bffcc4b99d73a79b95',
        'Content-Type': 'application/json',
      },
    };

    const batchJobData = await BatchJob.find({
      status: { $ne: 'succeeded' },
    }).fetch();

    if (batchJobData && batchJobData.length === 0) return null;

    try {
      const results = await Promise.all(
        batchJobData.map(async (batchJob) => {
          const response = await axios.get(config.url + batchJob.predictionId, {
            headers: config.headers,
          });
          const predictions = response.data;
          const newTextWidget = {
            ...batchJob,
            startedAt: predictions.started_at,
            status: predictions.status,
            completedAt: predictions.completed_at,
            text: predictions.output ? predictions.output.transcription : '',
          };
          updateBatchJobStatus(batchJob.predictionId, newTextWidget);

          if (predictions.status === 'succeeded') {
            let audioWidget = Widget.findOne({
              _id: newTextWidget.audioWidgetId,
            });
            if (!audioWidget) {
              return null;
            }

            Widget.update(
              { _id: newTextWidget.audioWidgetId },
              { $set: { status: predictions.status } },
            );

            return {
              audioWidget: audioWidget,
              audioWidgetId: newTextWidget.audioWidgetId,
              status: predictions.status,
              textWidget: newTextWidget,
            };
          } else {
            return null;
          }
        }),
      );
      return results.filter((result) => result !== null);
    } catch (error) {
      console.log('ai.getAudioToTextStatus', error);
      // 处理错误的逻辑
      throw error; // 可以选择抛出错误继续向上层传递
    }
  },

  'ai.audioToTextResult': async (resultUrl) => {
    let config = {
      method: 'get',
      url: resultUrl,
      headers: {
        Authorization: 'Token 0a0ad1c1eb969733595072bffcc4b99d73a79b95',
        'Content-Type': 'application/json',
      },
    };

    let result = await axios.get(config.url, { headers: config.headers });
    return result.data;
  },
});
