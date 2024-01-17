const Board = new Mongo.Collection('board');
const BoardBackup = new Mongo.Collection('boardBackup');
const BoardComment = new Mongo.Collection('comment');
const BoardSetting = new Mongo.Collection('boardSetting');

const DeletedWiget = new Mongo.Collection('deletedWidget');
const FavoriteBoard = new Mongo.Collection('favoriteBoard');
const LocalWidget = new Mongo.Collection(null);

const Organization = new Mongo.Collection('boardx_organization');
const OrganizationMember = new Mongo.Collection('boardx_organization_member');

const OnlineUsers = new Mongo.Collection('onlineUsers');
const OnlineUsersData = new Mongo.Collection('onlineUserData');
const RecentBoard = new Mongo.Collection('recentBoard');
const RoomMember = new Mongo.Collection('subscription');
const UserSessionLog = new Mongo.Collection('userSessionLog');
const UserTags = new Mongo.Collection('userTags');
const Widget = new Mongo.Collection('widget');
const BoardHashcode = new Mongo.Collection('boardHashcode');
const AIAssistLog = new Mongo.Collection('aiAssistLog');

const PaymentOrders = new Mongo.Collection('paymentOrders');
const TestLogs = new Mongo.Collection('testLogs');
const PricingPlan = new Mongo.Collection('pricingPlan');
const SystemPolling = new Mongo.Collection('systemPolling');
const StripeLogs = new Mongo.Collection('stripeLogs');
const TokensLog = new Mongo.Collection('tokensLog');
const CreditsRecords = new Mongo.Collection('CreditsRecords');
const SubscriptionRecord = new Mongo.Collection('SubscriptionRecord');
const SubscriptionOrder= new Mongo.Collection('SubscriptionOrder');
const SubscriptionRecordInvoice = new Mongo.Collection('SubscriptionRecordInvoice');
const AICommand = new Mongo.Collection('aiCommand');
const AIAgent = new Mongo.Collection('aiAgent');
const UserCustomAIAgent = new Mongo.Collection('userCustomAIAgent');
const TeamsAiCommand = new Mongo.Collection('teamsAiCommand');
const AICommandUserCustom = new Mongo.Collection('aiCommandUserCustom');
const FavoriteAICommand = new Mongo.Collection('favoriteAICommand');
const AICustomStyleCommand = new Mongo.Collection('aiCustomStyleCommand');
const CustomizeAiImgCommand = new Mongo.Collection('customizeAiImgCommand');
const AIModel = new Mongo.Collection('aiModel');
const AIModelTrained = new Mongo.Collection('aiModelTrained');
const FileManagement = new Mongo.Collection('fileManagement');
const Settings = new Mongo.Collection('Settings')
const EmailVerify = new Mongo.Collection('emailVerify');

const RoleItems = new Mongo.Collection('roleItems');
const PermissionItems = new Mongo.Collection('permissionItems');

const AIChat = new Mongo.Collection('aiChat');
const AIChatSession = new Mongo.Collection('aiChatSession');
const BoardAiContext = new Mongo.Collection('boardAiContext');
const RoomAiContext = new Mongo.Collection('roomAiContext');
const TeamAiContext = new Mongo.Collection('teamAiContext');
const BoardArticle = new Mongo.Collection('boardArticle');
const BatchJob = new Mongo.Collection('batchJob');

const BoardTimer = new Mongo.Collection('boardTimer');

const TestLog = new Mongo.Collection('testLog');

const UserLogin = new Mongo.Collection('userLogin');

export {
  Board,
  BoardArticle,
  BoardBackup,
  BoardComment,
  BoardSetting,
  FavoriteBoard,
  Widget,
  TestLogs,
  TestLog,
  Organization,
  OrganizationMember,
  RoomMember,
  OnlineUsers,
  RecentBoard,
  UserSessionLog,
  DeletedWiget,
  LocalWidget,
  PaymentOrders,
  PricingPlan,
  TokensLog,
  StripeLogs,
  Settings,
  SubscriptionRecord,
  SubscriptionOrder,
  SubscriptionRecordInvoice,
  CreditsRecords,
  BoardHashcode,
  AIAssistLog,
  SystemPolling,
  AICommand,
  TeamsAiCommand,
  EmailVerify,
  FavoriteAICommand,
  AICustomStyleCommand,
  CustomizeAiImgCommand,
  AIModel,
  AIModelTrained,
  RoleItems,
  PermissionItems,
  AIChat,
  AICommandUserCustom,
  BoardAiContext,
  RoomAiContext,
  TeamAiContext,
  UserTags,
  AIChatSession,
  BatchJob,
  BoardTimer,
  OnlineUsersData,
  FileManagement,
  UserLogin,
  AIAgent,
  UserCustomAIAgent,
};
