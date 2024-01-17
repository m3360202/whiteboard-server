import PricingDataProvider from '../data/PricingDataProvider';

export default class PricingBusinessProvider {
  static provider = null;

  static getProviderInstance() {
    if (PricingBusinessProvider.provider == null) {
      PricingBusinessProvider.provider = new PricingBusinessProvider();
    }
    return PricingBusinessProvider.provider;
  }

  constructor() {
  }
  createSubscriptionRecord(data) {
    return PricingDataProvider.getProviderInstance().createSubscriptionRecord(data);
  }
  createSubscriptionRecordLink(data) {
    return PricingDataProvider.getProviderInstance().createSubscriptionRecordLink(data);
  }
  unSubscriptionRecord(orgId,isTest) {
    return PricingDataProvider.getProviderInstance().unSubscriptionRecord(orgId,isTest);
  }
  getSubscriptionRecordByOrgId(data) {
    return PricingDataProvider.getProviderInstance().getSubscriptionRecordByOrgId(data);
  }
  getSubscriptionRecordByUserId(orgId) {
    return PricingDataProvider.getProviderInstance().getSubscriptionRecordByUserId(orgId);
  }
  upgradeSubscriptionRecord(id) {
    return PricingDataProvider.getProviderInstance().upgradeSubscriptionRecord(id);
  }
  checkIfSubscriptionRecordExpired(orgId) {
    return PricingDataProvider.getProviderInstance().checkIfSubscriptionRecordExpired(orgId);
  }
  getSubscriptionCredits(id) {
    return PricingDataProvider.getProviderInstance().getSubscriptionCredits(id);
  }
  getSubscriptionRecordInvoiceHistory(id) {
    return PricingDataProvider.getProviderInstance().getSubscriptionRecordInvoiceHistory(id);
  }
  getSubscriptionRecordCreditsConsumeHistory(id) {
    return PricingDataProvider.getProviderInstance().getSubscriptionRecordCreditsConsumeHistory(id);
  }
  creditsConsume(data) {
    return PricingDataProvider.getProviderInstance().creditsConsume(data);
  }
 updatePlan(data) {
    return PricingDataProvider.getProviderInstance().updatePlan(data);
  }
  getInvoice(data) {
    return PricingDataProvider.getProviderInstance().getInvoice(data);
  }
  saveLog(data) {
    return PricingDataProvider.getProviderInstance().saveLog(data);
  }
  checkIfCreditsIsEnough(orgId) {
    return PricingDataProvider.getProviderInstance().checkIfCreditsIsEnough(orgId);
  }
  getPurchaseInvoiceListByUserId(userId) {
    return PricingDataProvider.getProviderInstance().getPurchaseInvoiceListByUserId(userId);
  }
}
