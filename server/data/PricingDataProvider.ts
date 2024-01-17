// import { Promise } from 'meteor/promise';
// import { Users } from '../../app/models/server/index';
import {SystemPolling, PricingPlan, StripeLogs, SubscriptionRecord, SubscriptionRecordInvoice, CreditsRecords,Settings } from '../../imports/lib/data/collectionsServer';
import stripe from 'stripe';
import { Users } from '../../app/models/server/raw/index';

export default class PricingDataProvider {
  static provider = null;

  static getProviderInstance() {
    if (PricingDataProvider.provider == null) {
      PricingDataProvider.provider = new PricingDataProvider();
    }
    return PricingDataProvider.provider;
  }

  addPricingPlan(data) {
    return PricingPlan.insert(data);
  }

  findSubscriptionByuserId(userId) {
    let subscriptionInfo = PricingPlan.find({ 'userId': userId }, { fields: { userId: 1, subscriptionId: 1, memberIds: 1 } }).fetch()[0] || null;
    return subscriptionInfo;
  }

  deleteSubscriptionByuserId(userId) {
    return PricingPlan.remove({ userId });
  }

  updateSubscriptionMember(userId, memberIds) {
    PricingPlan.update({ userId }, { $set: { memberIds: memberIds } });
  }
  saveLog(data) {
    StripeLogs.insert(data);
  }
  //创建org订阅群集
  createSubscriptionRecord(data) {
    const newData = {
      orgId: data.orgId,
      memberList: data.memberList,
      subscriptionType: data.type,
      startTime: Date.now(),
      endTime: null,
      credits: 0,
      createUser: Meteor.userId(),
      lastEditUser: Meteor.userId(),
      state: false,
      stripeRecordId: null,
      subscriptionId: null,
      planId: null,
      customer: null
    }
    //检查是否有之前过期或无效的订阅
    const checkSubscriptionRecordByOrgId = SubscriptionRecord?.findOne({ orgId: data?.orgId });
    if (!checkSubscriptionRecordByOrgId) {
      const newSubscriptionRecord = SubscriptionRecord.insert(newData);
      return newSubscriptionRecord;
    }
    else {
      const newSubscriptionRecord = SubscriptionRecord.update({ _id: checkSubscriptionRecordByOrgId._id }, {
        $set: {
          preData: newData
        }
      });
      return newSubscriptionRecord;
    }
  }
  //创建org订阅群集
  async createSubscriptionRecordLink(data) {
    const newData = {
      orgId: data.orgId,
      memberList: data.memberList,
      subscriptionType: data.type,
      planType: data.planType,
      startTime: Date.now(),
      endTime: null,
      credits: 0,
      createUser: data.userId,
      lastEditUser: data.userId,
      state: false,
      stripeRecordId: null,
      subscriptionId: null,
      planId: null,
      customer: null,
      quantity: data.quantity,
      amount:data.amount
    }

    let stripe;
    let planId;
    const paymentSettings = Settings.findOne({type:'payment'});
    if (data.isTest) {
      stripe = require('stripe')(paymentSettings.test_secret);

      if (data.planType === 'month' && data.type === 'Business') {
        planId = 'price_1MRnyFD1FiAI3FNgTXyMiAgN';
      }
      if (data.planType === 'year' && data.type === 'Business') {
        planId = 'price_1MGeKoD1FiAI3FNgQWnlN5S5';
      }
      if (data.planType === 'month' && data.type === 'Pro') {
        planId = 'price_1MXLZyD1FiAI3FNgx3hqtLeP';
      }
      if (data.planType === 'year' && data.type === 'Pro') {
        planId = 'price_1MXLbYD1FiAI3FNgKlqpkXpD';
      }
    }
    else {
      stripe = require('stripe')(paymentSettings.live_secret);
      if (data.planType === 'month' && data.type === 'Business') {
        planId = 'price_1MPcVVD1FiAI3FNglHy9Xqcv';
      }
      if (data.planType === 'year' && data.type === 'Business') {
        planId = 'price_1MRnoID1FiAI3FNgKkDEc7Px';
      }
      if (data.planType === 'month' && data.type === 'Pro') {
        planId = 'price_1O7U3FD1FiAI3FNgLbU7n6lj';
      }
      if (data.planType === 'year' && data.type === 'Pro') {
        planId = 'price_1MXLduD1FiAI3FNgPjsxfqyH';
      }
    }
    const checkSubscriptionRecordByOrgId = SubscriptionRecord?.findOne({ orgId: data?.orgId });
  
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: planId, quantity: data.quantity }],allow_promotion_codes: true,metadata: {customer: checkSubscriptionRecordByOrgId?checkSubscriptionRecordByOrgId.customer:null,}
    });
    //检查是否有之前过期或无效的订阅

    if (!checkSubscriptionRecordByOrgId) {
      SubscriptionRecord.insert(newData);
      const newSubscriptionRecord = SubscriptionRecord?.findOne({ orgId: data?.orgId });
      let link = paymentLink.url + '?client_reference_id=' + newSubscriptionRecord._id;
      return { msg: 'success', error: '', data: link };
    }
    else if (checkSubscriptionRecordByOrgId && checkSubscriptionRecordByOrgId.state === false && checkSubscriptionRecordByOrgId.endTime < Date.now()) {
      //判断过期的已失效的订阅
      SubscriptionRecord.remove({ _id: checkSubscriptionRecordByOrgId._id });
      SubscriptionRecord.insert(newData);
      const newSubscriptionRecord = SubscriptionRecord?.findOne({ orgId: data?.orgId });
      let link = paymentLink.url + '?client_reference_id=' + newSubscriptionRecord._id;
      return { msg: 'success', error: '', data: link };
    }
    else if (checkSubscriptionRecordByOrgId && checkSubscriptionRecordByOrgId.state === false && checkSubscriptionRecordByOrgId.endTime > Date.now()) {
      //判断没有过期的已取消的订阅
      SubscriptionRecord.update({ orgId: data.orgId }, { $set: { preData: newData,action:'retrieves' } });
      let link = paymentLink.url + '?client_reference_id=' + checkSubscriptionRecordByOrgId._id;
      return { msg: 'success', error: '', data: link };
    }
    else if (checkSubscriptionRecordByOrgId && checkSubscriptionRecordByOrgId.state === true && checkSubscriptionRecordByOrgId.subscriptionType == 'Pro' && newData.subscriptionType == 'Business') {
      //判断升级订阅
      let credits = newData.quantity * 200000;
      let upgradeData = {...newData,credits:credits};
      SubscriptionRecord.update({ orgId: data.orgId }, { $set: { preData: upgradeData, action: 'upgrade' } });
      let amount = 0;
      let chargePlanId = data.isTest ? 'price_1MRzIVD1FiAI3FNgG9RIReNl' : 'price_1MRzFhD1FiAI3FNgf7xN0V1k';
      if (newData.planType == 'year') {
        amount = (newData.quantity * 159).toFixed(2) - checkSubscriptionRecordByOrgId.amount;
      }
      if (newData.planType == 'month') {
        amount = (newData.quantity * 19.9).toFixed(2) - checkSubscriptionRecordByOrgId.amount;
      }
      const paymentLinkcharge = await stripe.paymentLinks.create({
        line_items: [{ price: chargePlanId, quantity: amount * 100}],allow_promotion_codes: true,metadata: {customer: checkSubscriptionRecordByOrgId.customer }
      });
      let link = paymentLinkcharge.url + '?client_reference_id=' + checkSubscriptionRecordByOrgId._id;
      return { msg: 'success', error: '', data: link };
    }
    else {
      //判断更改用户，不改变套餐类型，且当前用户数量大于等于调整后数量
      if (checkSubscriptionRecordByOrgId.quantity >= newData.quantity) {
          //更新订阅，订阅价格下个月生效
        await stripe.subscriptions.update(
          checkSubscriptionRecordByOrgId.subscriptionId,
            {quantity: newData.quantity}
          )
          SubscriptionRecord.update({ orgId: newData.orgId }, { $set: { memberList:newData.memberList,amount:newData.amount,quantity: newData.quantity, } });
        return { msg: 'success', error: '', data: '' }
      } else {
        //判断更改用户，不改变套餐类型，且当前用户数量小于调整后数量，补价差
        let credits = 0;
        if (newData.subscriptionType == 'Pro') {
          credits = (newData.quantity-checkSubscriptionRecordByOrgId.quantity) * 100000 + checkSubscriptionRecordByOrgId.credits;
        }
        if (newData.subscriptionType == 'Business') {
          credits = (newData.quantity-checkSubscriptionRecordByOrgId.quantity) * 200000 + checkSubscriptionRecordByOrgId.credits;
        }
        let upgradeData = {...newData,
          credits:credits,
          stripeRecordId:checkSubscriptionRecordByOrgId.stripeRecordId,
          subscriptionId:checkSubscriptionRecordByOrgId.subscriptionId,
          customer:checkSubscriptionRecordByOrgId.customer,
          amout:newData.amount
        };
      SubscriptionRecord.update({ orgId: data.orgId }, { $set: { preData: upgradeData, action: 'upgrade' } });
      let amount = newData.amount - checkSubscriptionRecordByOrgId.amount;
      let chargePlanId = data.isTest ? 'price_1MRzIVD1FiAI3FNgG9RIReNl' : 'price_1MRzFhD1FiAI3FNgf7xN0V1k';
      const paymentLinkcharge = await stripe.paymentLinks.create({
        line_items: [{ price: chargePlanId, quantity: amount}],allow_promotion_codes: true,metadata: {customer: checkSubscriptionRecordByOrgId.customer}
      });
      let link = paymentLinkcharge.url + '?client_reference_id=' + checkSubscriptionRecordByOrgId._id;
      return { msg: 'success', error: '', data: link };
      }
    }
  }
  //取消订阅
  unSubscriptionRecord(orgId, isTest) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const nextMonth = currentMonth + 1;
    const endOfMonthTimestamp = new Date(now.getFullYear(), nextMonth, 0).getTime();
    const endOfYearTimestamp = new Date(now.getFullYear() + 1, 0, 0).getTime();
    let stripe;
    const paymentSettings = Settings.findOne({type:'payment'});
    //订阅有效期到本月月底，当前orgGroup的credits保留
    let currentRecord = SubscriptionRecord.findOne({ orgId: orgId });
    if (currentRecord.planType == 'month') {
      SubscriptionRecord.update({ orgId: orgId }, { $set: { endTime: endOfMonthTimestamp, state: false } });
    }
    if (currentRecord.planType == 'year') {
      SubscriptionRecord.update({ orgId: orgId }, { $set: { endTime: endOfYearTimestamp, state: false } });
    }

    if (isTest) {
      stripe = require('stripe')(paymentSettings.test_secret);
    } else {
      stripe = require('stripe')(paymentSettings.live_secret);
    }
    let timeStamp = Math.floor(Date.now() / 1000);
    SystemPolling.update({pollingSource:'stripeApi'},{ $set: { lastPollingTime: timeStamp , 
      lastSubscribePollingTime: timeStamp  } })
    let record = SubscriptionRecord.findOne({ orgId: orgId })
    if (record && record.subscriptionId) {
      stripe.subscriptions.del(record.subscriptionId);
    }
    return true;
  }
  //org界面获取订阅信息
  async getSubscriptionRecordByOrgId(data) {
    let orgId = data.orgId;
    let user = data.user;
    let result = SubscriptionRecord.findOne({ orgId: orgId });
    if (result) {
      if (result.memberList.includes(user.userId)) {
        let check = this.checkIfSubscriptionRecordExpired(orgId);
        return await check?check:result;
      }
      else {
        return {};
      }
    } else {
      return {};
    }

  }
  //用户board内获取订阅信息
  getSubscriptionRecordByUserId(orgId,user) {
    this.checkIfSubscriptionRecordExpired(orgId)
    let group = SubscriptionRecord.findOne({ orgId: orgId });
    if (group && group.memberList && group.memberList.includes(user.userId)) {
      return group ;
    }
    else {
      return null;
    }
  }
  //升级订阅套餐
  upgradeSubscriptionRecord(id, plan,user) {
    //补上本月价差10w credits，并更新生效日期，操作人
    SubscriptionRecord.update(id, { $set: { subscriptionType: plan, startTime: Date.now(), lastEditUser: user.userId, state: true } });
  }
  //检查当前订阅是否存在取消订阅后过期
  async checkIfSubscriptionRecordExpired(orgId) {
    let group = SubscriptionRecord.findOne({ orgId: orgId });
    let now = Date.now();
    if (group && group.subscriptionType !== 'none' && group.endTime) {
      //判断取消订阅且已经过期
      if (group.endTime < now && group.state === true) {
         SubscriptionRecord.remove({ orgId: orgId });//订阅已取消，且订阅过期，删除当前订阅状态和orgcredits
         return false;
      }
    }
    if (group &&  group.state === true){
       let stripe;
       const paymentSettings = Settings.findOne({type:'payment'});
      if (paymentSettings.WebSite !== 'https://app.boardx.com.cn/') {
        stripe = require('stripe')(paymentSettings.test_secret);
      } else {
        stripe = require('stripe')(paymentSettings.live_secret);
      }
      const subscription = await stripe.subscriptions.retrieve(
        group.subscriptionId
      );
      const now = Date.now();
      const startTime = new Date(group.startTime);
      startTime.setMonth(startTime.getMonth() + 1);
      const nextMonthTimestamp = startTime.getTime();
      if(subscription.status == 'active'){
        if( now>nextMonthTimestamp){
          const creditsNow = group.quantity * 100000  + group.credits;

          SubscriptionRecord.update({_id:group._id}, { $set: { startTime: nextMonthTimestamp,credits: creditsNow } });
          return SubscriptionRecord.findOne({ orgId: orgId });
        }
        else{ return group;}
      }
      else{
        SubscriptionRecord.update({_id:group._id}, { $set: { endTime: nextMonthTimestamp,state:false } });
        return SubscriptionRecord.findOne({ orgId: orgId });
      }
    }
    return;
  }
  //每个月订阅扣费后团队 credits 刷新
  getSubscriptionCredits(id) {
    //从Stripe Webhooks请求到这个接口
    let credits = 0;
    let group = SubscriptionRecord.findOne({ _id: id });
    if (group.subscriptionType == 'Business') {
      credits = group.quantity * 200000;
    }
    if (group.subscriptionType == 'Pro') {
      credits = group.quantity * 100000;
    }
    //团队增加credits
    SubscriptionRecord.update(id, { $set: { credits: group } });
    //插入团队增加credits record
    CreditsRecords.insert({
      action: 'subscribe Business purchase credits',
      creditsAdd: group,
      timeStamp: Date.now()
    });
  }
  //获取账单历史记录
  getSubscriptionRecordInvoiceHistory(id) {
    return SubscriptionRecordInvoice.find(id).fetch();
  }
  //更新订阅套餐信息
  updatePlan(data) {
    SubscriptionRecord.update(data.id, { $set: { subscriptionType: data.plan, startTime: Date.now(), lastEditUser: data.user.userId, state: true, subscriptionId: data.subscriptionId, planId: data.planId } });
  }
  //获取团队credits消费记录
  getSubscriptionRecordCreditsConsumeHistory(id) {
    return CreditsRecords.find({ SubscriptionRecordId: id, action: 'org member use credits' }).fetch();
  }
  getPurchaseInvoiceListByUserId(userId) {
    return SubscriptionRecordInvoice.find({ orgId: userId },{ sort: { createdcreatedAt: -1 } }).fetch()
  }
  //获取团队账单
  async getInvoice(data) {
    if(!data.planId){
      return [];
    }
    else{
      return SubscriptionRecordInvoice.find({ subId: data.planId },{ sort: { created: -1 } }).fetch();
    }
   
  }
    //检查是否余额充足
  async checkIfCreditsIsEnough(data) {
      this.checkIfSubscriptionRecordExpired(data.orgId);
      let userInfo = await Users.findOne(data.user.userId);
      let group = this.getSubscriptionRecordByUserId(data.orgId,data.user);

      if(userInfo.credits >0 || (group && group.credits>0)){
        return { msg: 'ok', statue: 1 };
      }
      else{
        return { error: 'error', msg: 'token is not enough', statue: 2 };
      }
    }
  //credits消费逻辑
  async creditsConsume(data) {
    //判断当前是否有订阅且订阅过期
    let orgId =data.orgId;
    let credits = data.credits;
    let user = data.user;
    this.checkIfSubscriptionRecordExpired(orgId);
    let groupCredits = 0;
    let myCredits = 0;
    let group = this.getSubscriptionRecordByUserId(orgId,user);
    if (group && group.credits) {
      groupCredits = group.credits;//获取团队credits余额
    }
    let userInfo = await Users.findOne(user.userId);
    myCredits = userInfo.credits > 0 ? userInfo.credits : 0;
    if (credits > (groupCredits + myCredits)) {
      //团队加个人余额不足
    
      //return { error: 'error', msg: 'token is not enough', statue: 2 };
      //临时处理方式，全部归0，允许使用一次
      if(groupCredits>0){
        SubscriptionRecord.update(group._id, { $set: { credits: 0 } });
      }
      Users.update({ _id: user.userId }, { $set: { credits: 0 } });
    }
    else {
      if (group && groupCredits >= credits) {
        //优先扣除团队订阅的余额
        console.log('groupCredits', groupCredits);
        console.log('credits', credits);
        let creditsRemain = groupCredits - credits;
        console.log('creditsRemain', creditsRemain);
        //更新团队订阅数据信息
        SubscriptionRecord.update(group._id, { $set: { credits: creditsRemain } });
        //插入credits变动信息
        CreditsRecords.insert({
          SubscriptionRecordId: group._id,
          action: 'org member use credits',
          creditsConsume: credits,
          member: user.userId,
          timeStamp: Date.now()
        });
        return { msg: 'ok', statue: 1 };
      }

      else if (groupCredits === 0) {
        //扣除个人订阅的余额
        console.log('myCredits', myCredits);
        console.log('credits', credits);
        let creditsRemain = myCredits - credits;
        console.log('creditsRemain', creditsRemain);
        let userId = user.userId;
        Users.update({ _id: userId }, { $set: { credits: creditsRemain } });
        //插入credits变动信息
        CreditsRecords.insert({
          action: 'user use credits',
          creditsConsume: credits,
          user: user.userId,
          timeStamp: Date.now()
        });
        return { msg: 'ok', statue: 1 };
      }
      else {
        //优先扣除团队订阅的余额
        console.log('groupCredits', groupCredits);
        console.log('credits', credits);
        let needConsumeCredits = credits - groupCredits;//全部扣除团队余额，不足的余额从个人中扣除
        console.log('needConsumeCredits', needConsumeCredits);
        //更新团队订阅数据信息
        SubscriptionRecord.update(group._id, { $set: { credits: 0 } });
        //插入团队credits变动信息
        CreditsRecords.insert({
          SubscriptionRecordId: group._id,
          action: 'org member use credits',
          creditsConsume: groupCredits,
          member: user.userId,
          timeStamp: Date.now()
        });
        //扣除个人订阅的余额
        console.log('myCredits', myCredits);
        let creditsRemain = myCredits - needConsumeCredits;
        console.log('myPrusecreditsRemain', creditsRemain);
        let userId = user.userId;
        Users.update({ _id: userId }, { $set: { credits: creditsRemain } });
        //插入个人credits变动信息
        CreditsRecords.insert({
          action: 'user use credits',
          creditsConsume: credits,
          user: user.userId,
          timeStamp: Date.now()
        });
        return { msg: 'ok', statue: 1 };
      }
    }
  }
}
