import './importPackages';
import './renderMeta';
import './initialize/index';
import '../app/lib/server/startup/settings';
import './initialize/access';
import './api/BoardController';
import './api/ChatController';
import './api/EmailController';
import './api/OrgController';
import './api/RoomsController';
import './api/SubscriptionsController';
import './api/UserController';
import './api/SystemController';
import './api/WidgetController';
import './api/OpenAI';
import './api/whisperAI';
import './api/ghost';
import './api/PricingController';
import './api/PermissionController';
import './webhooksForStripe';
// import { DDP } from 'meteor/ddp';
//socket_io(Meteor.settings.public.websocket);

Accounts.urls.resetPassword = function (token) {
  return Meteor.absoluteUrl(`reset-password/${token}`);
};
console.log('Node.js version:', process.version);
Meteor.startup(() => {
  //DDP.connect(Meteor.settings.public.websocket)
  Accounts.emailTemplates.siteName = 'BoardX';
  Accounts.emailTemplates.from = 'BoardX Team <noreply@www.boardx.us>';
  Accounts.config({
    sendVerificationEmail: true,
  });

  // Monti.connect(process.env.MONTI_APP_ID, process.env.MONTI_APP_SECRET);


  //io(Meteor.settings.public.websocket);
 
});
