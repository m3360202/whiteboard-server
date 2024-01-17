import { Meteor } from 'meteor/meteor';

import { Settings } from '../../imports/lib/data/collectionsServer';

Meteor.methods({
  getSettings(type) {
    if (type == 'all') {
      const paymentSettings = Settings.findOne({ type: 'payment' });
      const widgetSettings = Settings.findOne({ type: 'widget' });
      const uploadSettings = Settings.findOne({ type: 'upload' });
      const websiteSettings = Settings.findOne({ type: 'website' });
      const aiSettings = Settings.findOne({ type: 'ai' });
      return { paymentSettings: paymentSettings, widgetSettings: widgetSettings, uploadSettings: uploadSettings, websiteSettings: websiteSettings, aiSettings: aiSettings }
    }
    else {
      return Settings.findOne({ type: type });
    }

  }
});
