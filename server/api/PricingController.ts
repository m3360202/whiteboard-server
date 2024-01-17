import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import PricingBusinessProvider from '../business/PricingBusinessProvider';
import PricingDataProvider from '../data/PricingDataProvider';
import { Settings, PaymentOrders, SystemPolling, TokensLog, SubscriptionRecord,SubscriptionRecordInvoice } from '../../imports/lib/data/collectionsServer';
import { Users } from '../../app/models/server/raw/index';

const proPriceId = "price_1L0qedD1FiAI3FNg8iOIuvaQ";
const proPriceIdYearly = "price_1L6NfrD1FiAI3FNgq1A798ey";
const businessPriceId = "price_1L0FQ4D1FiAI3FNgbwFRD3mV";
const businessPriceIdYearly = "price_1L6Nh2D1FiAI3FNgYNofKmig";


const Stripe = require('stripe');
const paymentSettings = Settings.findOne({type:'payment'});
if (Meteor.absoluteUrl().indexOf('app.boardx.us') > -1) {
  var stripe = Stripe(paymentSettings.live_secret);
} else {
  var stripe = Stripe(paymentSettings.test_secret);
}

const getPriceId = (planTitle: string, subCycle: string) => {
  let priceId = '';

  if (planTitle == "Premium") {
    priceId = (subCycle == "monthly")
      ? proPriceId : proPriceIdYearly;
  } else {
    priceId = (subCycle == "monthly")
      ? businessPriceId : businessPriceIdYearly;
  }
  return priceId;
}


Meteor.methods({
  getOrgMemberList2(orgId) {
    check(orgId, String);
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().getOrgMemberList(orgId);
  },
  async checkCardToken(data) {
    this.unblock();
    try {
      const token = await stripe.tokens.create({
        card: {
          number: data.number,
          exp_month: data.exp_month,
          exp_year: data.exp_year,
          cvc: data.cvc,
        },
      });
      return 'valid';

    } catch (error) {
      console.log(error.message)
      return error.message
    }
  },
  async createSubscription(data) {
    this.unblock();
    console.log('createSubscription data', data)
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.name,
      address: data.address
    });

    const customerId = customer.id;

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: data.number,
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        cvc: data.cvc,
      },
      billing_details: {
        address: data.address,
        name: data.name,
        email: data.email
      },
    });

    const paymentId = paymentMethod.id;

    try {
      await stripe.paymentMethods.attach(paymentId, {
        customer: customerId,
      });
    } catch (error) {
      console.log(error.message)
    }

    let updateCustomerDefaultPaymentMethod = await stripe.customers.update(
      customerId,
      {
        invoice_settings: {
          default_payment_method: paymentId,
        },
      }
    );

    let priceId: string = getPriceId(data.planTitle, data.plan);

    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity: data.quantity }],
        expand: ['latest_invoice.payment_intent', 'pending_setup_intent', 'plan.product'],
      });

      return subscription;
    } catch (error) {
      console.log(error.message)
    }
  },
  addPricingPlan(data) {
    this.unblock();
    if (data) {
      return PricingDataProvider.getProviderInstance().addPricingPlan(data);
    }
  },
  async purchaseCallback(data) {
    this.unblock();
    let user = data.user;
    var SystemPollingSetting = SystemPolling.findOne({ pollingSource: 'stripeApi' });
    var gtTime;

    let arr = [];
    if (SystemPollingSetting) {
      if (SystemPollingSetting.lastPollingTime) {
        gtTime = SystemPollingSetting.lastPollingTime; //取得上一次同步时间
      }
      else {
        gtTime = 1;
      }
    } else {
      gtTime = 1;
      let sysPollingData = {
        lastSubscribePollingTime: 1,
        lastPollingTime: 1,
        pollingSource: 'stripeApi'
      }
      SystemPolling.insert(sysPollingData);
      SystemPollingSetting = SystemPolling.findOne();
    }

    let transactions = await stripe.events.list({
      limit: 30,
      created: { 'gt': gtTime },
      type: 'checkout.session.completed'
    });
    if (transactions && transactions.data && transactions.data.length > 0) {
      transactions.data.forEach(async (item) => {
        if (data.mode == 'livemode') {
          if (item.data.object.client_reference_id && item.livemode) {
            let tokens = 0;
            if (item.data.object.amount_total == 60) {
              if(data.currentPlan == 'Pro'){
                tokens = 25000;
              }
              else{
                tokens = 31250;
              }
            }
            if (item.data.object.amount_total == 1000) {
              if(data.currentPlan == 'Pro'){
                tokens = 31250;
              }
              else{
                tokens = 25000;
              }
            }
            if (item.data.object.amount_total == 2500) {
              if(data.currentPlan == 'Pro'){
                tokens = 100000;
              }
              else{
                tokens = 80000;
              }
            }
            if (item.data.object.amount_total == 5000) {
             
              if(data.currentPlan == 'Pro'){
                tokens = 250000;
              }
              else{
                tokens = 200000;
              }
            }
            if (item.data.object.amount_total == 10000) {
              
              if(data.currentPlan == 'Pro'){
                tokens = 500000;
              }
              else{
                tokens = 625000;
              }
            }
            const tokenData = {
              userId: item.data.object.client_reference_id,
              action: 'purchase ai tokens',
              purchaseSource: 'stripe website',
              tokens: tokens,
              purchaseTime: item.created,
              orderId: item.id
            }
            let tlog = TokensLog.findOne({ orderId: item.id });
            if (!tlog) {
              TokensLog.insert(tokenData);
            }
            Users.update({ _id: item.data.object.client_reference_id }, { $inc: { credits: tokens } });
            if (user.email) {
              //主动发送一次Invoicing
              stripe.paymentIntents.create({
                amount: item.data.object.amount_total,
                currency: item.data.object.currency,
                payment_method_types: ['card'],
                receipt_email: user.email,
              });
            }
            //插入invoice
            const invoice = await stripe.invoices.retrieve(item.data.object.invoice);
            const dataInvoice = {
              userId:item.data.object.client_reference_id,
              editor:user.userName,
              type:'purchase',
              createdAt:item.data.object.created,
              amount:item.data.object.amount_total,
              invoiceUrl:invoice.hosted_invoice_url,
              invoicePdf:invoice.invoice_pdf
            }
            SubscriptionRecordInvoice.insert(dataInvoice);
            let order = PaymentOrders.findOne({ id: item.id });
            if (!order) {
              PaymentOrders.insert(item);
            }
            let timeStamp = Math.floor(Date.now() / 1000);
            SystemPolling.update(SystemPollingSetting._id, { $set: { lastPollingTime: timeStamp} })
          }
        }
        if (data.mode == 'testmode') {
          if (item.data.object.client_reference_id && !item.livemode) {
            let tokens = 0;
            if (item.data.object.amount_total == 60) {
              if(data.currentPlan == 'Pro'){
                tokens = 25000;
              }
              else{
                tokens = 31250;
              }
            }
            if (item.data.object.amount_total == 1000) {
              if(data.currentPlan == 'Pro'){
                tokens = 31250;
              }
              else{
                tokens = 25000;
              }
            }
            if (item.data.object.amount_total == 2500) {
              if(data.currentPlan == 'Pro'){
                tokens = 100000;
              }
              else{
                tokens = 80000;
              }
            }
            if (item.data.object.amount_total == 5000) {
             
              if(data.currentPlan == 'Pro'){
                tokens = 250000;
              }
              else{
                tokens = 200000;
              }
            }
            if (item.data.object.amount_total == 10000) {
              
              if(data.currentPlan == 'Pro'){
                tokens = 500000;
              }
              else{
                tokens = 625000;
              }
            }
            const tokenData = {
              userId: item.data.object.client_reference_id,
              action: 'purchase ai tokens',
              purchaseSource: 'stripe website',
              tokens: tokens,
              purchaseTime: item.created,
              orderId: item.id
            }
            let tlog = TokensLog.findOne({ orderId: item.id });
            if (!tlog) {
              TokensLog.insert(tokenData);
            }
            Users.update({ _id: item.data.object.client_reference_id }, { $inc: { credits: tokens } });
            if (user && user.email) {
              //主动发送一次Invoicing
              stripe.paymentIntents.create({
                amount: item.data.object.amount_total,
                currency: item.data.object.currency,
                payment_method_types: ['card'],
                receipt_email: user.email,
              });
            }
            //插入invoice
            const invoice = await stripe.invoices.retrieve(item.data.object.invoice);
            const dataInvoice = {
              userId:item.data.object.client_reference_id,
              editor:user.userName,
              type:'purchase',
              createdAt:item.data.object.created,
              amount:item.data.object.amount_total,
              invoiceUrl:invoice.hosted_invoice_url,
              invoicePdf:invoice.invoice_pdf
            }
            SubscriptionRecordInvoice.insert(dataInvoice);
           
            let order = PaymentOrders.findOne({ id: item.id });
            if (!order) {
              PaymentOrders.insert(item);
            }
            let timeStamp = Math.floor(Date.now() / 1000);
            SystemPolling.update(SystemPollingSetting._id, { $set: { lastPollingTime: timeStamp } })
          }
        }

      })
    }
    return transactions;
  },
  async subscribeCallback(data) {
    this.unblock();
    let user = data.user;
    var SystemPollingSetting = SystemPolling.findOne({ pollingSource: 'stripeApi' });
    var gtTime;
    let arr = [];
    if (SystemPollingSetting) {
      if (SystemPollingSetting.lastSubscribePollingTime) {
        gtTime = SystemPollingSetting.lastSubscribePollingTime; //取得上一次同步时间
      }
      else {
        gtTime = 1;
      }
    } else {
      gtTime = 1;
      let sysPollingData = {
        lastSubscribePollingTime: 1,
        lastPollingTime: 1,
        pollingSource: 'stripeApi'
      }
      SystemPolling.insert(sysPollingData);
      SystemPollingSetting = SystemPolling.findOne();
    }

    let transactions = await stripe.events.list({
      limit: 30,
      created: { 'gt': gtTime },
      type: 'checkout.session.completed'
    });
    if (transactions && transactions.data && transactions.data.length > 0) {
      transactions.data.forEach(async (item) => {
        if (item.data.object.client_reference_id) {
          let originSubscriptionRecord = SubscriptionRecord.findOne({ _id: item.data.object.client_reference_id });
          let credits = 0;
          //更改订阅状态为有效
          if (originSubscriptionRecord) {
            if (originSubscriptionRecord.preData && originSubscriptionRecord.preData.quantity && originSubscriptionRecord.action != 'retrieves') {
              if (originSubscriptionRecord.preData.subscriptionType == 'Business') {
                credits = originSubscriptionRecord.preData.quantity * 200000;
                //判断升级
                if (originSubscriptionRecord.action == 'upgrade') {
                  let newprice;
                  if (item.livemode) {
                    newprice = originSubscriptionRecord.preData.planType == 'year' ? 'price_1MRnoID1FiAI3FNgKkDEc7Px' : 'price_1MPcVVD1FiAI3FNglHy9Xqcv';
                  }
                  else {
                    newprice = originSubscriptionRecord.preData.planType == 'year' ? 'price_1MGeKoD1FiAI3FNgQWnlN5S5' : 'price_1MRnyFD1FiAI3FNgTXyMiAgN';
                  }
                  //更新订阅，订阅价格下个月生效
                  stripe.subscriptions.update(
                    originSubscriptionRecord.subscriptionId,
                    {
                      price: newprice,
                      quantity: originSubscriptionRecord.preData.quantity,
                      customer: originSubscriptionRecord.preData.customer,
                    }
                  )
                }
              }

              SubscriptionRecord.update(item.data.object.client_reference_id, {
                $set: {
                  amount: originSubscriptionRecord.preData.amount,
                  memberList: originSubscriptionRecord.preData.memberList,
                  state: true,
                  startTime: Date.now(),
                  lastEditUser: user.userId,
                  credits: originSubscriptionRecord.preData.credits,
                  subscriptionId: originSubscriptionRecord.preData.subscriptionId,
                  subscriptionType: originSubscriptionRecord.preData.type,
                  planType: originSubscriptionRecord.preData.planType,
                  quantity: originSubscriptionRecord.preData.quantity,
                  endTime: null,
                  preData: null,
                  action:null,
                }
              });
            } else {
              if (originSubscriptionRecord.subscriptionType == 'Business') {
                credits = originSubscriptionRecord.quantity * 200000;
              }
              if (originSubscriptionRecord.subscriptionType == 'Pro') {
                credits = originSubscriptionRecord.quantity * 100000;
              }
               if(originSubscriptionRecord.action == 'retrieves'){
                SubscriptionRecord.update(item.data.object.client_reference_id, {
                  $set: {
                    amount: originSubscriptionRecord.preData.amount,
                    memberList: originSubscriptionRecord.preData.memberList,
                    state: true,
                    startTime: Date.now(),
                    lastEditUser: user.userId,
                    credits: credits,
                    subscriptionId: item.data.object.subscription,
                    stripeRecordId: item.data.object.id,
                    planType: originSubscriptionRecord.preData.planType,
                    quantity: originSubscriptionRecord.preData.quantity,
                    endTime: null,
                    preData: null,
                    action:null
                  }
                });
          
                stripe.subscriptions.update(
                  item.data.object.subscription,
                  {
                    customer: originSubscriptionRecord.customer,
                  }
                );
               }else{
                SubscriptionRecord.update(item.data.object.client_reference_id, {
                  $set: {
                    amount: item.data.object.amount_total,
                    state: true,
                    startTime: Date.now(),
                    lastEditUser: user.userId,
                    credits: credits,
                    subscriptionId: item.data.object.subscription,
                    customer: item.data.object.customer,
                    stripeRecordId: item.data.object.id,
                    preData:null,
                    action:null
                  }
                });
               }
            }
            // 处理invoice
            const checkout = await stripe.checkout.sessions.retrieve(item.data.object.id);
            if(checkout.payment_intent){
              const paymentIntents = await stripe.paymentIntents.retrieve(checkout.payment_intent);
              const charges = await stripe.charges.retrieve(paymentIntents.charges.data[0].id);
              const checkInvoice =SubscriptionRecordInvoice.findOne({chargeid:charges.id});
              if(!checkInvoice){
                const dataInvoice = {
                  subId:item.data.object.client_reference_id,
                  editor:user.userName,
                  amount:item.data.object.amount_total,
                  receipt_url:charges.receipt_url,
                  created:item.data.object.created,
                  chargeid:charges.id,
                  type:'subscription'
                }
                SubscriptionRecordInvoice.insert(dataInvoice);
              }
            }else{
              if(checkout.subscription){
               const subscription = await stripe.subscriptions.retrieve(checkout.subscription);
               const latestInvoiceId = subscription.latest_invoice;
               const subscriptionInvoice = await stripe.invoices.retrieve(latestInvoiceId);
               const charges = await stripe.charges.retrieve(subscriptionInvoice.charge);
               const checkInvoice =SubscriptionRecordInvoice.findOne({chargeid:charges.id});
               if(!checkInvoice){
                const dataInvoice = {
                  subId:item.data.object.client_reference_id,
                  editor:user.userName,
                  amount:item.data.object.amount_total,
                  receipt_url:charges.receipt_url,
                  created:item.data.object.created,
                  chargeid:charges.id,
                  type:'subscription'
                }
                SubscriptionRecordInvoice.insert(dataInvoice);
               }
              }
            }
            
          
            if (user && user.email) {
              //主动发送一次Invoicing
             await stripe.paymentIntents.create({
                amount: item.data.object.amount_total,
                currency: item.data.object.currency,
                payment_method_types: ['card'],
                receipt_email: user.email,
              });
            }
            arr.push(item);
            let order = PaymentOrders.findOne({ id: item.id });
            if (!order) {
              PaymentOrders.insert(item);
            }
          }
        }
      })
      let timeStamp = Math.floor(Date.now() / 1000);
      SystemPolling.update({pollingSource:'stripeApi'},{ $set: { lastPollingTime: timeStamp , 
        lastSubscribePollingTime: timeStamp  } })
    }
    return transactions;
  },
  async getPurchaseLink(data){
    this.unblock();
    let planId ;
    if (data.mode === 'testmode' ) {
      planId = 'price_1MgMf9D1FiAI3FNgKbvL5P8b';
    }
    if (data.mode === 'livemode' && data.type === 1) {
      planId = 'price_1LjY8TD1FiAI3FNgbsrSNYyx';
    }
    if (data.mode === 'livemode' && data.type === 2) {
      planId = 'price_1MWtslD1FiAI3FNgRCQkAltX';
    }
    if (data.mode === 'livemode' && data.type === 3) {
      planId = 'price_1LnaHhD1FiAI3FNgoLA1IhMk';
    }
    if (data.mode === 'livemode' && data.type === 4) {
      planId = 'price_1LnaIqD1FiAI3FNgveJJvPEp';
    }
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: planId,quantity: 1}],customer_creation:'always',invoice_creation:{enabled:true}});
      return paymentLink;
  },

  findSubscriptionByuserId(userId) {
    this.unblock();
    return PricingDataProvider.getProviderInstance().findSubscriptionByuserId(userId);
  },
  async retrieveSubscriptionInformation(data) {
    this.unblock();
    const subscriptionId = data.subscriptionId;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: [
        'latest_invoice',
        'customer.invoice_settings.default_payment_method',
        'items.data.price.product',
      ],
    });

    const upcoming_invoice = await stripe.invoices.retrieveUpcoming({
      subscription: subscriptionId,
    });

    const item = subscription.items.data[0];
    return {
      subscriptionId: subscription.id,
      customerId: subscription.customer.id,
      subCycle: subscription.plan.interval,
      amount: subscription.plan.amount,
      card: subscription.customer.invoice_settings.default_payment_method.card,
      product_description: item.price.product.name,
      current_price: item.price.id,
      current_quantity: item.quantity,
      latest_invoice: subscription.latest_invoice,
      upcoming_invoice: upcoming_invoice,
    }

  },
  async retrieveUpcomingInvoice(data) {
    this.unblock();
    const new_price = getPriceId(data.planTitle, data.subCycle);

    const quantity = data.quantity;
    const subscriptionId = data.subscriptionId;

    var params = {};
    params['customer'] = data.customerId;
    var subscription;

    if (subscriptionId != null) {
      params['subscription'] = subscriptionId;
      subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const current_price = subscription.items.data[0].price.id;

      if (current_price == new_price) {
        params['subscription_items'] = [
          {
            id: subscription.items.data[0].id,
            quantity: quantity,
          },
        ];
      } else {
        params['subscription_items'] = [
          {
            id: subscription.items.data[0].id,
            deleted: true,
          },
          {
            price: new_price,
            quantity: quantity,
          },
        ];
      }
    } else {
      params['subscription_items'] = [
        {
          price: new_price,
          quantity: quantity,
        },
      ];
    }

    const invoice = await stripe.invoices.retrieveUpcoming(params);

    let response = {};

    if (subscriptionId != null) {
      const current_period_end = subscription.current_period_end;
      var immediate_total = 0;
      var next_invoice_sum = 0;

      invoice.lines.data.forEach((invoiceLineItem) => {
        if (invoiceLineItem.period.end == current_period_end) {
          immediate_total += invoiceLineItem.amount;
        } else {
          next_invoice_sum += invoiceLineItem.amount;
        }
      });

      response = {
        immediate_total: immediate_total,
        next_invoice_sum: next_invoice_sum,
        invoice: invoice,
      };
    } else {
      response = {
        invoice: invoice,
      };
    }
    return response;
  },
  async updateSubscription(data) {
    this.unblock();
    const subscriptionId = data.subscriptionId;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const current_price = subscription.items.data[0].price.id;

    const new_price: string = getPriceId(data.planTitle, data.subCycle);

    const quantity = data.quantity;
    var updatedSubscription;

    if (current_price == new_price) {
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            quantity: quantity,
          },
        ],
      });
    } else {
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            deleted: true,
          },
          {
            price: new_price,
            quantity: quantity,
          }
        ],
        expand: ['plan.product'],
      });
    }
    // var invoice = await stripe.invoices.create({
    //   customer: subscription.customer,
    //   subscription: subscription.id
    // });

    // console.log('invoice ', invoice)
    // invoice = await stripe.invoices.pay(invoice.id);

    console.log('updatedSubscription', updatedSubscription);
    return updatedSubscription;
  },
  updateSubscriptionMember(data) {
    this.unblock();
    console.log('data is', data)
    return PricingDataProvider.getProviderInstance().updateSubscriptionMember(data.userId, data.memberIds);
  },
  async cancelSubscription(data) {
    this.unblock();
    console.log(data)
    try {
      const deletedSubscription = await stripe.subscriptions.del(data.subscriptionId);

      return PricingDataProvider.getProviderInstance().deleteSubscriptionByuserId(data.userId)

    } catch (error) {
      console.log(error.message)
    }
  },
  async updateCustomer(data) {
    this.unblock();
    console.log('updateCustome data is', data)
    const customerId = data.customerId;

    const customer = await stripe.customers.update(
      customerId,
      {
        email: data.email,
        name: data.name,
        address: data.address
      }
    );
    console.log('customer', customer);
    return customer;
  },
  async updatePaymentMethod(data) {
    this.unblock();
    const customerId = data.customerId;

    const customer = await stripe.customers.retrieve(customerId);

    const paymentId = customer.invoice_settings.default_payment_method;
    console.log('paymentId', paymentId)


    const paymentMethod = await stripe.paymentMethods.update(
      paymentId,
      {
        billing_details: {
          address: address,
          name: data.name,
          email: data.email,
          phone: '415-111-1111'
        },
        card: {
          exp_month: data.exp_month,
          exp_year: data.exp_year

        },
      }
    );


    return paymentMethod;

  },
  changeSubscriptionPlan(orgId, item) {
    this.unblock();
    const currentPlan = SubscriptionRecord.findOne({ orgId: orgId });
    const subscriptionId = currentPlan.subscriptionId;
    const planId = currentPlan.planId;
    const updateSubscription = async (subscriptionId, planId) => {
      try {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          items: [{ plan: planId }],
        });
        return subscription;
      } catch (error) {
        throw error;
      }
    };

    // Usage
    updateSubscription(subscriptionId, planId)
      .then((subscription) => {
        console.log("Subscription updated:", subscription);
      })
      .catch((error) => {
        console.log("Error updating subscription:", error);
      });
  },
  createSubscriptionRecord(data) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().createSubscriptionRecord(data);
  },

  createSubscriptionRecordLink(data) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().createSubscriptionRecordLink(data);
  },
  unSubscriptionRecord(orgId, isTest) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().unSubscriptionRecord(orgId, isTest);
  },
  getSubscriptionRecordByOrgId(data) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().getSubscriptionRecordByOrgId(data);
  },
  getSubscriptionRecordByUserId(orgId) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().getSubscriptionRecordByUserId(orgId);
  },
  upgradeSubscriptionRecord(id) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().upgradeSubscriptionRecord(id);
  },
  checkIfSubscriptionRecordExpired(orgId) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().checkIfSubscriptionRecordExpired(orgId);
  },
  getSubscriptionCredits(id) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().getSubscriptionCredits(id);
  },
  getSubscriptionRecordInvoiceHistory(id) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().getSubscriptionRecordInvoiceHistory(id);
  },
  getSubscriptionRecordCreditsConsumeHistory(id) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().getSubscriptionRecordCreditsConsumeHistory(id);
  },
  creditsConsume(data) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().creditsConsume(data);
  },
  updatePlan(data) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().updatePlan(data);
  },
  getInvoice(data) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().getInvoice(data);
  },
  saveLog(data) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().saveLog(data);
  },
  checkIfCreditsIsEnough(orgId) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().checkIfCreditsIsEnough(orgId);
  },
  getPurchaseInvoiceListByUserId(userId) {
    this.unblock();
    return PricingBusinessProvider.getProviderInstance().getPurchaseInvoiceListByUserId(userId);
  }
});
