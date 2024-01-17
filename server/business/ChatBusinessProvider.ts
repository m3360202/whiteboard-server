import ChatDataProvider from '../data/ChatDataProvider';
export default class ChatBusinessProvider {
  public _id: any;
  public days: any;
  public maxUses: any;
  static provider = null;

  static getProviderInstance() {
    if (ChatBusinessProvider.provider == null) {
      ChatBusinessProvider.provider = new ChatBusinessProvider();
    }
    return ChatBusinessProvider.provider;
  }
  constructor() {

  }

  
  getAudioToText(data) {
    return ChatDataProvider.getProviderInstance().getAudioToText(data);
  }
}
