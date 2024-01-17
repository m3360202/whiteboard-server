import s from 'underscore.string';

import { settings } from '../../../app/settings';
import { validateCustomFields } from './validateCustomFields';
import { saveCustomFieldsWithoutValidation } from './saveCustomFieldsWithoutValidation';

export const saveCustomFields = function (userId, formData) {
  if (s.trim(settings.get('Accounts_CustomFields')) !== '') {
    validateCustomFields(formData);
    return saveCustomFieldsWithoutValidation(userId, formData);
  }
};
