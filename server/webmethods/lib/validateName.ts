
export const validateName = function(name: string): boolean {
	const blockedNames = '';
	if (!blockedNames || typeof blockedNames !== 'string') {
		return true;
	}

	if (blockedNames.split(',').includes(name.toLowerCase())) {
		return false;
	}

	return true;
};
