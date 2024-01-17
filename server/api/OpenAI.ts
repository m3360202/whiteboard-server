import { Meteor } from 'meteor/meteor';
import fetch from 'node-fetch';
import {
  AIAssistLog,
  AICommand,
  AIAgent,
  TeamsAiCommand,
  AICommandUserCustom,
  FavoriteAICommand,
  CustomizeAiImgCommand,
  AICustomStyleCommand,
  AIModel,
  AIModelTrained,
  AIChat,
  Settings,
  AIChatSession,
  BoardAiContext,
  RoomAiContext,
  TeamAiContext,
  UserCustomAIAgent,
} from '../../imports/lib/data/collectionsServer';
import PricingBusinessProvider from '../business/PricingBusinessProvider';

import { Users } from '../../app/models/server/raw/index';

import { getEncoding, encodingForModel } from 'js-tiktoken';

const { Configuration, OpenAIApi } = require("openai");

const encoding = getEncoding('cl100k_base');

const settings = Settings.findOne({type:'ai'});

const configuration = new Configuration({
  apiKey: settings.apiKey,
});
const openai = new OpenAIApi(configuration);

const AIModelTrainedUploadFile = async modelTrainedData => {
  const fs = require('fs');
  let jsonlData = '';
  for (const item of modelTrainedData) {
    jsonlData += JSON.stringify(item) + '\n';
  }
  fs.writeFileSync('mydata.jsonl', jsonlData);

  const response = await openai.createFile(
    fs.createReadStream('mydata.jsonl'),
    'fine-tune'
  );

  return response.data;
};

const textToImageAsync = (commandData, text, imageBase64) => {
  return new Promise(async (resolve, reject) => {
    var axios = require('axios');
    const FormData = require('form-data');
    const buffer = Buffer.from(imageBase64, 'base64');
    const formData = new FormData();
    formData.append('init_img', buffer);

    var options = {
      method: 'POST',
      url: 'https://boardxml-boardx-ml-api-5qegsdywfq-uc.a.run.app/agent/stability/image',
      params: {
        prompt: text,
        width: commandData.width ? String(commandData.width) : '512',
        height: commandData.height ? String(commandData.height) : '512',
        cfg_scale: '7',
        start_schedule: '0.4',
        steps: '30',
        seed: String(Math.floor(Math.random() * 7000 + 1)),
        // seed: '5346',
        samples: commandData.num ? String(commandData.num) : '1'
      },
      headers: {
        'x-api-key': 'api-key-vs45H!fU89fdfg',
        'content-type': formData.getHeaders()
      },
      responseType: 'arraybuffer',
      data: formData
    };

    const engineId = 'stable-diffusion-v1-6';
    const apiHost = 'https://api.stability.ai';
    const apiKey = 'sk-k1QzWHA9TXiUDmGgwLEmpjANIggNOLKjPGTgb0w8RFezFwlB';
    const response = await fetch(
      `${apiHost}/v1/generation/${engineId}/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: text
            }
          ],
          cfg_scale: 7,
          clip_guidance_preset: 'FAST_BLUE',
          width: commandData.width ? Number(commandData.width) : 512,
          height: commandData.height ? Number(commandData.height) : 512,
          samples: commandData.num ? Number(commandData.num) : 1,
          steps: 50
        })
      }
    );

    if (!response.ok) {
      reject(`Non-200 response: ${await response.text()}`);
      throw new Error(`Non-200 response: ${await response.text()}`);
    }

    interface GenerationResponse {
      artifacts: Array<{
        base64: string;
        seed: number;
        finishReason: string;
      }>;
    }

    const responseJSON = (await response.json()) as GenerationResponse;
    resolve(responseJSON.artifacts);
  });
}

const imageToTextAsync = (image) => {
  return new Promise((resolve, reject) => {
    var axios = require('axios');
    var options = {
      method: 'POST',
      url: 'https://boardxml-boardx-ml-api-5qegsdywfq-uc.a.run.app/agent/replicate/image2prompt',
      headers: {
        'x-api-key': 'api-key-vs45H!fU89fdfg',
        'content-type': 'multipart/form-data; boundary=---011000010111000001101001'
      },
      data: { init_img: image }
    };

    axios.request(options).then(function (response) {
      resolve(response.data);
    }).catch(function (error) {
      console.error(error);
    });

  });
}

const updateUsageOfAI = (commandId) => {
  AICommand.update({ _id: commandId }, { $inc: { usedTimes: 1 } });
}

async function reduceCredit(credit, orgId,user) {
  const data = { orgId: orgId, credits: credit,user }
  PricingBusinessProvider.getProviderInstance().creditsConsume(data);
}

async function convertSpeechToText(audioFile){
  var axios = require('axios');
  const API_KEY = settings.apiKey;
  const WHISPER_API_URL = 'https://api.openai.com/v1/speech-to-text/async-create';
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
  
  const data = {
    prompt: `Convert the following speech to text:\n${audioFile}\n\n`,
    model: 'davinci',
    max_tokens: 1024,
  };
  
  const response = await axios.post(WHISPER_API_URL, data, { headers });
  return response.data.choices[0].text;
};

Meteor.methods({
  async 'ai.AIChat.InsertMsg'(
    message: string,
    chatSession: object,
    orgId: string,
    type: string,
  ) {
    this.unblock();
    const user = this.userId;
    if (!user) return;

    const timeSubmitted = new Date();

    const ObjectID = new Mongo.Collection(null);

    const chatId = ObjectID._makeNewID();

    const chatData = {
      _id: chatId,
      createdAt: timeSubmitted,
      chatSessionId: chatSession._id,
      message: message,
      userId: user,
      type: type,
    };

    await AIChat.insert(chatData);

    return chatData._id;
  },
  async 'ai.AIChat.UpdateMsg'(
    chatId: string,
    message: string,
    userInfo: Object,
    orgId: string,
  ) {
    this.unblock();
    const user = this.userId;
    if (!user) return;

    console.warn('message', message);

    AIChat.update(chatId, { $set: { message: message } });

    const tokens = encoding.encode(message);

    console.warn('tokens', tokens.length);
    const data = {
      orgId: orgId,
      credits: tokens.length,
      user: userInfo,
    };

    await PricingBusinessProvider.getProviderInstance().creditsConsume(data);

    const newUserData = await Users.findOne({ _id: userInfo.userId });

    return { credits: newUserData.credits };
  },
  async 'ai.SendUserChat'(
    prompt: string,
    chatSession: object,
    msgType: string,
    fileData: Object,
  ) {
    console.log('ai.AIChat2', prompt, chatSession, msgType, fileData);
    this.unblock();
    const user = this.userId;
    const timeSubmited = new Date();
    if (!user) return;
    let msgData;
    if (msgType === 'voice') {
      msgData = {
        createdAt: timeSubmited,
        chatSessionId: chatSession._id,
        message: prompt,
        userId: user,
        type: 'user',
        msgType: msgType,
        ...fileData,
      };
    } else if (msgType === 'file') {
      msgData = {
        createdAt: timeSubmited,
        chatSessionId: chatSession._id,
        message: prompt,
        userId: user,
        type: 'user',
        msgType: msgType,
        ...fileData,
      };
    } else {
      msgData = {
        createdAt: timeSubmited,
        chatSessionId: chatSession._id,
        message: prompt,
        userId: user,
        type: 'user',
      };
    }
    let chat = AIChat.insert(msgData);
    return chat;
  },
  async 'ai.updateAIChatMsgInfo'(agree, disagree, chatAIMessage) {
    console.log('ai.updateAIChat', agree, disagree, chatAIMessage);
    this.unblock();
    const user = this.userId;
    const timeSubmited = new Date().getTime();
    if (!user) return;
    return AIChat.update(
      { _id: chatAIMessage._id, type: 'AI' },
      {
        $set: {
          agree: agree,
          disagree: disagree,
          updateMsgInfoTime: timeSubmited,
        },
      },
    );
  },
  'ai.AIChatSession.add'(newAIChatdata) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIChatSession.insert(newAIChatdata);
  },
  'ai.AIChatSession.update'(aiChatSessionId, updateData) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIChatSession.update(aiChatSessionId, { $set: updateData });
  },
  'ai.AIChatSession.getAll'(orgId) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIChatSession.find({ userId: user, orgId }).fetch()?.reverse();
  },
  'ai.Command.getAll': function () {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    let AICommandAllData = AICommand.find({}).fetch();
    AICommandAllData.forEach((item) => {
      if (item._id) {
        item['favoriteCommand'] = getFavoriteCommand(item._id);
      }
    });
    return AICommandAllData;
  },
  'ai.Agent.getAll': function () {
    this.unblock();
 
    const user = this.userId;
    if (!user) return [];
    let AIAgentAllData = AIAgent.find({}).fetch();
    // console.log('ai.Agent.getAll',AIAgentAllData);
    return AIAgentAllData;
  },
  'ai.UserCustomAIAgent.get': function () {
    this.unblock();
    const user = this.userId;
    // console.log('ai.UserCustomAIAgent.get', user);
    if (!user) return;
    let UserCustomAIAgentData = UserCustomAIAgent.find({userId: user}).fetch();

    return UserCustomAIAgentData;
  },
  'teams.AiCommand.getAll': function (orgId) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    let teamsAICommandAllData = TeamsAiCommand.find({ orgId }).fetch();
    teamsAICommandAllData.forEach((item) => {
      if (item._id) {
        item['favoriteCommand'] = getFavoriteCommand(item._id);
      }
    });
    return teamsAICommandAllData;
  },
  'ai.CommandUserCustom.getAll': function () {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    let AICommandUserCustomAllData = AICommandUserCustom.find({}).fetch();
    return AICommandUserCustomAllData;
  },
  'ai.Model.getAll': function () {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    let AIModelAllData = AIModel.find({}).fetch();

    return AIModelAllData;
  },
  'ai.ModelTrained.getAll': function (modelId) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    let AIModelTrainedAllData = AIModelTrained.find({
      modelId: modelId,
    }).fetch();

    return AIModelTrainedAllData;
  },
  'ai.CustomStyleCommand.getAll': function () {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    let AICustomStyleCommandAllData = AICustomStyleCommand.find({}).fetch();
    AICustomStyleCommandAllData.forEach((item) => {
      if (item._id) {
        item['favoriteCommand'] = getFavoriteCommand(item._id);
      }
    });
    return AICustomStyleCommandAllData;
  },
  'ai.Command.add': function (command) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AICommand.insert(command);
  },
  'ai.Agent.add': function (AgentData) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIAgent.insert(AgentData);
  },
  'ai.UserCustomAIAgent.add': function (UserCustomAIAgentData) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return UserCustomAIAgent.insert(UserCustomAIAgentData);
  },
  'teams.AiCommand.add': function (command) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return TeamsAiCommand.insert(command);
  },
  'teams.AiCommand.addMany': function (commandData) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    try {
      const bulkInsertData = commandData.map((item) => ({
        insertOne: {
          document: item,
        },
      }));
      TeamsAiCommand.rawCollection().bulkWrite(bulkInsertData, {
        ordered: false,
      });
      return true;
    } catch (error) {
      // 处理错误，例如记录日志或返回错误信息
      console.error('插入数据时发生错误:', error);
      return false;
    }
  },
  'ai.CommandUserCustom.add': function (command) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AICommandUserCustom.insert(command);
  },
  'ai.Model.add': function (modelData) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIModel.insert(modelData);
  },
  'ai.ModelTrained.add': function (modelTrainedData) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    if (modelTrainedData instanceof Array) {
      modelTrainedData.forEach((item) => {
        AIModelTrained.insert(item);
      });
      return true;
    }
    return AIModelTrained.insert(modelTrainedData);
  },
  'ai.CustomStyleCommand.add': function (command) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AICustomStyleCommand.insert(command);
  },
  'ai.Command.update': function (command) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    delete command.id;
    return AICommand.update({ _id: command._id }, { $set: command });
  },
  'ai.Agent.update': function (AgentData) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIAgent.update({ _id: AgentData._id }, { $set: AgentData });
  },
  'ai.UserCustomAIAgent.update': function (UserCustomAIAgentData) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return UserCustomAIAgent.update(
      { _id: UserCustomAIAgentData._id },
      { $set: UserCustomAIAgentData },
    );
  },
  'teams.AiCommand.update': function (command) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    delete command.id;
    return TeamsAiCommand.update({ _id: command._id }, { $set: command });
  },
  'ai.Model.update': function (modelData) {
    console.log(this);
    this.unblock();
    const user = this.userId;
    if (!user) return;
    delete modelData.id;

    return AIModel.update({ _id: modelData._id }, { $set: modelData });
  },
  'ai.CustomStyleCommand.update': function (command) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    delete command.id;
    return AICustomStyleCommand.update({ _id: command._id }, { $set: command });
  },
  'ai.Command.delete': function (_id) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AICommand.remove({ _id: _id });
  },
  'ai.Agent.delete': function (_id) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIAgent.remove({ _id: _id });
  },
  'ai.UserCustomAIAgent.delete': function (_id) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return UserCustomAIAgent.remove({ _id: _id });
  },
  'teams.AiCommand.delete': function (_id) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return TeamsAiCommand.remove({ _id: _id });
  },
  'ai.Model.delete': function (_id) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIModel.remove({ _id: _id });
  },
  'ai.ModelRowTrained.delete': function (trainedDataId) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    if (trainedDataId instanceof Array) {
      trainedDataId.forEach((item) => {
        AIModelTrained.remove({ _id: item._id });
      });
      return true;
    }
    return AIModelTrained.remove({ _id: trainedDataId });
  },
  'ai.ModelAllTrained.delete': function (modelId) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AIModelTrained.remove({ modelId: modelId });
  },
  'ai.CustomStyleCommand.delete': function (_id) {
    this.unblock();
    const user = this.userId;
    if (!user) return;
    return AICustomStyleCommand.remove({ _id: _id });
  },
  'ai.textToImage': async function (
    commandData: any,
    prompt: string,
    imageBase64: string,
    user: any,
  ) {
    this.unblock();

    if (!user) return;
    const image = await textToImageAsync(commandData, prompt, imageBase64);
    let credit = 256;
    if (commandData.num === '1') {
      if (commandData.width === commandData.height && commandData.width < 512) {
        credit = 64;
      } else if (
        commandData.width === commandData.height &&
        commandData.width === 512
      ) {
        credit = 256;
      } else if (
        commandData.width !== commandData.height &&
        commandData.width >= 512 &&
        commandData.width < 1024
      ) {
        credit = 512;
      } else if (commandData.width >= 1024) {
        credit = 1024;
      }
    } else {
      if (commandData.width < 1024) {
        credit = commandData.width;
      } else if (commandData.width >= 1024) {
        credit = commandData.width * 2;
      }
    }
    reduceCredit(credit, commandData.orgId, user);
    updateUsageOfAI(commandData._id);
    // Meteor.call('saveAIAssistLog', {
    //   prompt,
    //   promptId: commandData._id,
    //   createdTime: new Date().getTime(),
    //   type: 'textToImage',
    // });
    return { image, credit };
  },
  'ai.imageToText': async function (
    commandData: any,
    image: string,
    user: any,
  ) {
    this.unblock();
    if (!user) return;
    const text = await imageToTextAsync(image);
    updateUsageOfAI(commandData._id);
    Meteor.call('saveAIAssistLog', {
      image,
      promptId: commandData._id,
      createdTime: new Date().getTime(),
      type: 'imageToText',
    });
    reduceCredit(500, commandData.orgId, user);
    return text;
  },
  'ai.submittedModelDataTraining': async function (
    modelData: any,
    modelTrainedData: any,
  ) {
    this.unblock();
    const trainingFile = await AIModelTrainedUploadFile(modelTrainedData);

    const response = await openai.createFineTune({
      training_file: trainingFile.id,
      model: modelData.model ? modelData.model : 'ada',
    });
    if (response.status === 200) {
      const newModelData = {
        ...modelData,
        status: 'Submitted',
        modelTrainingInfo: {
          fineTuneId: response.data.id,
          status: response.data.status,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
        },
      };

      AIModel.update({ _id: modelData._id }, { $set: newModelData });
      return true;
    } else {
      throw new Error('submittedModelDataTraining error');
    }
  },
  'ai.cancelCurrentModelTraining': async function (modelFineTuneId: any) {
    this.unblock();
    const response = await openai.cancelFineTune(modelFineTuneId);
    if (response.status === 200) {
      AIModel.update(
        { 'modelTrainingInfo.fineTuneId': modelFineTuneId },
        {
          $set: {
            status: 'Draft',
            'modelTrainingInfo.status': response.data.status,
          },
        },
      );
      return true;
    } else {
      throw new Error('cancelCurrentModelTraining error');
    }
  },
  'ai.getFineTuneStatus': async function () {
    this.unblock();
    const AIModelSubmitTrainingData = AIModel.find({
      status: 'Submitted',
    }).fetch();

    AIModelSubmitTrainingData.forEach(async (modelData) => {
      const response = await openai.retrieveFineTune(
        modelData.modelTrainingInfo.fineTuneId,
      );
      if (response.status === 200) {
        if (response.data.status === 'succeeded') {
          const trainedTime = formattingTime();
          AIModel.update(
            { 'modelTrainingInfo.fineTuneId': response.data.id },
            {
              $set: {
                status: 'Trained',
                trainedTime: trainedTime,
                'modelTrainingInfo.status': response.data.status,
                'modelTrainingInfo.fine_tuned_model':
                  response.data.fine_tuned_model,
              },
            },
          );
        } else if (response.data.status === 'failed') {
          AIModel.update(
            { 'modelTrainingInfo.fineTuneId': response.data.id },
            {
              $set: {
                status: response.data.status,
                'modelTrainingInfo.status': response.data.status,
                'modelTrainingInfo.fine_tuned_model':
                  response.data.fine_tuned_model,
              },
            },
          );
        }
      } else {
        throw new Error('getFineTuneStatus error');
      }
    });
  },
  'ai.getAIFineTuneModel': async function () {
    this.unblock();
    const response = await openai.listFineTunes();
    if (response.status === 200) {
      return response.data.data;
    } else {
      throw new Error('getAIFineTuneModel error');
    }
  },
  saveAIAssistLog: async function (fields) {
    const userId = Meteor.userId();
    AIAssistLog.insert({ userId, ...fields });
  },
  saveAIAssistLogAndReduceCredit: async function (AIAssistData) {
    try {
      this.unblock();

      const userId = Meteor.userId();

      AIAssistLog.insert({ userId, ...AIAssistData });

      const data = {
        orgId: AIAssistData.orgId,
        credits: AIAssistData.totalTokens,
        user: AIAssistData.user,
      };

      await PricingBusinessProvider.getProviderInstance().creditsConsume(data);

      const newUserData = await Users.findOne({
        _id: AIAssistData.user.userId,
      });

      return { credits: newUserData.credits };
    } catch (error) {
      // 处理异常情况，例如记录日志或返回错误信息
      console.error('Error in saveAIAssistLogAndReduceCredit:', error);
      throw new Meteor.Error('internal-error', 'An internal error occurred.');
    }
  },
  getMyAIAssistLog: async function (log) {
    const userId = Meteor.userId();
    return AIAssistLog.find({ userId }).fetch();
  },
  favoriteAICommand: function (commandId, userId) {
    const commandFavoriteInfo = FavoriteAICommand.findOne({
      commandId: commandId,
      userId: userId,
    });
    if (!commandFavoriteInfo) {
      const data = {
        userId: userId,
        commandId: commandId,
        addTime: new Date().getTime(),
        favorite: true,
      };
      FavoriteAICommand.insert(data);
      return true;
    } else {
      if (commandFavoriteInfo.favorite === true) {
        FavoriteAICommand.update(commandFavoriteInfo._id, {
          $set: { favorite: false },
        });
        return false;
      } else {
        FavoriteAICommand.update(commandFavoriteInfo._id, {
          $set: { favorite: true },
        });
        return true;
      }
    }
  },
  addCustomizeImgCommand: function (data) {
    const newData = {
      customizeImgCommandId: data._id,
      userId: Meteor.userId(),
    };
    return CustomizeAiImgCommand.insert(newData);
  },
  updateCustomizeImgCommand: function (commandId, newImgCommandData) {
    return CustomizeAiImgCommand.update(
      { _id: commandId },
      { $set: newImgCommandData },
    );
  },
  getUserCustomizeImgCommand: function (userId) {
    const lookup = [
      {
        $lookup: {
          from: 'aiCustomStyleCommand',
          localField: 'customizeImgCommandId',
          foreignField: '_id',
          as: 'customizeImgCommand',
        },
      },
      { $match: { userId: userId } },
    ];

    const result = Promise.await(
      CustomizeAiImgCommand.rawCollection().aggregate(lookup).toArray(),
    );

    let newCustomizeAiImgCommandList = [];
    for (let i = 0; i < result.length; i++) {
      if (result[i].customizeImgCommand[0]) {
        newCustomizeAiImgCommandList.push(result[i].customizeImgCommand[0]);
      }
    }
    return newCustomizeAiImgCommandList;
  },

  saveBoardAiContextContent: function (data) {
    if (!data) {
      // 检查输入数据是否为空
      console.error('数据为空，无法保存。');
      return;
    }
    if (data._id) {
      try {
        // 更新数据
        BoardAiContext.update({ _id: data._id }, { $set: data });
      } catch (error) {
        console.error('更新数据时出现错误:', error);
      }
    } else {
      try {
        // 插入新数据
        BoardAiContext.insert(data);
      } catch (error) {
        console.error('插入数据时出现错误:', error);
      }
    }
  },
  getBoardAiContextContent: function (boardId) {
    const result = BoardAiContext.findOne({ boardId: boardId });
    return result;
  },
  saveRoomAiContextContent: function (data) {
    if (!data) {
      // 检查输入数据是否为空
      console.error('数据为空，无法保存。');
      return;
    }
    if (data._id) {
      try {
        // 更新数据
        RoomAiContext.update({ _id: data._id }, { $set: data });
      } catch (error) {
        console.error('更新数据时出现错误:', error);
      }
    } else {
      try {
        // 插入新数据
        RoomAiContext.insert(data);
      } catch (error) {
        console.error('插入数据时出现错误:', error);
      }
    }
  },
  getRoomAiContextContent: function (roomId) {
    const result = RoomAiContext.findOne({ roomId: roomId });
    return result;
  },
  saveTeamAiContextContent: function (data) {
    if (!data) {
      // 检查输入数据是否为空
      console.error('数据为空，无法保存。');
      return;
    }
    if (data._id) {
      try {
        // 更新数据
        TeamAiContext.update({ _id: data._id }, { $set: data });
      } catch (error) {
        console.error('更新数据时出现错误:', error);
      }
    } else {
      try {
        // 插入新数据
        TeamAiContext.insert(data);
      } catch (error) {
        console.error('插入数据时出现错误:', error);
      }
    }
  },
  getTeamAiContextContent: function (teamId) {
    const result = TeamAiContext.findOne({ teamId: teamId });
    return result;
  },
});

function getFavoriteCommand(commandId) {
  return FavoriteAICommand.findOne({ commandId: commandId, userId: Meteor.userId() });
}

function getFilterResult(response) {
  // console.log(response)
  var output_label = response.data.choices[0].text;

  // This is the probability at which we evaluate that a "2" is likely real
  // vs. should be discarded as a false positive
  var toxic_threshold = -0.355;

  if (output_label == "2") {
    // If the model returns "2", return its confidence in 2 or other output-labels
    var logprobs = response.data["choices"][0]["logprobs"]["top_logprobs"][0];

    // If the model is not sufficiently confident in "2",
    // choose the most probable of "0" or "1"
    // Guaranteed to have a confidence for 2 since this was the selected token.
    if (logprobs["2"] < toxic_threshold) {
      var logprob_0 = logprobs.get("0", null);
      var logprob_1 = logprobs.get("1", null);

      // If both "0" and "1" have probabilities, set the output label
      // to whichever is most probable
      if ((logprob_0 !== null) && (logprob_1 !== null)) {
        if (logprob_0 >= logprob_1) {
          output_label = "0";
        }
        else {
          output_label = "1";
        }
      }
      // If only one of them is found, set output label to that one
      else if (logprob_0 !== null) {
        output_label = "0";
      }
      else if (logprob_1 !== null) {
        output_label = "1";
      }

      // If neither "0" or "1" are available, stick with "2"
      // by leaving output_label unchanged.
    }
  }

  // if the most probable token is none of "0", "1", or "2"
  // this should be set as unsafe
  if (!(output_label in ["0", "1", "2"])) {
    output_label = "2";
  }

  return output_label;
}

function formattingTime() {
  const date = new Date();
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  return formatter.format(date);
}

DDPRateLimiter.addRule(
  { type: 'method', name: 'ai.textToImage' },
  30,
  1000,
);