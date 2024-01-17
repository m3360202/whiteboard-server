import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { SettingsBase } from '../../lib/settings';
import { SettingValue } from '../../../../definition/ISetting';

class Settings extends SettingsBase {
	dict = new ReactiveDict('settings');
	get(_id: string | RegExp): any {
		if (_id instanceof RegExp) {
			throw new Error('RegExp Settings.get(RegExp)');
		}
		return this.dict.get(_id);
	}

	private _storeSettingValue(record: { _id: string; value: SettingValue }, initialLoad: boolean): void {
		Meteor.settings[record._id] = record.value;
		this.dict.set(record._id, record.value);
		this.load(record._id, record.value, initialLoad);
	}

	init(): void {
		let initialLoad = true;
		initialLoad = false;
	}
}

export const settings = new Settings();

settings.init();
