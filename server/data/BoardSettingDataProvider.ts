import { BoardSetting } from '../../imports/lib/data/collectionsServer';

export default class BoardSettingDataProvider {
  static provider = null;

  static getProviderInstance() {
    if (BoardSettingDataProvider.provider == null) {
      BoardSettingDataProvider.provider = new BoardSettingDataProvider();
    }
    return BoardSettingDataProvider.provider;
  }

  getBoardSetting() {
    return BoardSetting.find();
  }

  addBoardSetting(data) {
    BoardSetting.remove({ id: { $ne: '' } });
    return BoardSetting.insert(data);
  }
}
