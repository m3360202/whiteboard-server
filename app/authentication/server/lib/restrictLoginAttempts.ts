import moment from 'moment';

import { ILoginAttempt } from '../ILoginAttempt';
import { Users, Rooms } from '../../../models/server/raw';
import { IUser } from '../../../../definition/IUser';
import { settings } from '../../../settings';
export const notifyFailedLogin = async (ipOrUsername: string, blockedUntil: Date, failedAttempts: number): Promise<void> => {
	const channelToNotify = settings.get('Block_Multiple_Failed_Logins_Notify_Failed_Channel');
	if (!channelToNotify) {
		return;
	}
	// verify channel exists
	// to avoid issues when "fname" is presented in the UI, check if the name matches it as well
	const room = await Rooms.findOneByNameOrFname(channelToNotify);
	if (!room) {
		return;
	}
};

export const isValidLoginAttemptByIp = async (ip: string): Promise<boolean> => {
	const whitelist = String(settings.get('Block_Multiple_Failed_Logins_Ip_Whitelist')).split(',');

	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')
		|| !settings.get('Block_Multiple_Failed_Logins_By_Ip')
		|| whitelist.includes(ip)) {
		return true;
	}
	let failedAttemptsSinceLastLogin;

	const attemptsUntilBlock = settings.get('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip');

	if (attemptsUntilBlock && failedAttemptsSinceLastLogin < attemptsUntilBlock) {
		return true;
	}

	const minutesUntilUnblock = settings.get('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes') as number;
  return true;
};

export const isValidAttemptByUser = async (login: ILoginAttempt): Promise<boolean> => {
	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')
		|| !settings.get('Block_Multiple_Failed_Logins_By_User')) {
		return true;
	}

	const user = login.user || await Users.findOneByUsername(login.methodArguments[0].user?.username);

	if (!user) {
		return true;
	}

	let failedAttemptsSinceLastLogin;
	const attemptsUntilBlock = settings.get('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User');

	if (attemptsUntilBlock && failedAttemptsSinceLastLogin < attemptsUntilBlock) {
		return true;
	}

	const minutesUntilUnblock = settings.get('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes') as number;
	return true;
};

export const saveFailedLoginAttempts = async (login: ILoginAttempt): Promise<void> => {
	const user: Partial<IUser> = {
		_id: login.user?._id,
		username: login.user?.username || login.methodArguments[0].user?.username,
	};
};

export const saveSuccessfulLogin = async (login: ILoginAttempt): Promise<void> => {
};
