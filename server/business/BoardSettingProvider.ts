import BoardSettingDataProvider from '../data/BoardSettingDataProvider';

export default class BoardSettingProvider {
  static provider = null;
  static getProviderInstance() {
    if (BoardSettingProvider.provider == null) {
      BoardSettingProvider.provider = new BoardSettingProvider();
    }
    return BoardSettingProvider.provider;
  }

  getBoardSetting() {
    // return BoardSetting.find();
  }

  addBoardSetting(data) {
    // BoardSetting.remove({ id: { $ne: '' } });
    // return BoardSetting.insert(data);
  }
}
