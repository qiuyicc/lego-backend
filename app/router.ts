import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router, } = app;
  // const jwt = app.middleware.jwt({
  //   secret: app.config.jwt.secret,
  // });
  router.prefix('/api')
  router.get('/',controller.home.index)
  router.post('/users/create', controller.user.createUserControllerByEmail);
  router.get('/users/getUserInfo', controller.user.showUser);
  router.post('/users/login', controller.user.login);

  router.post('/users/generateCode', controller.user.sendVerifyCode);
  router.post('/users/loginByPhoneCode', controller.user.loginByPhone);

  router.get('/users/passport/gitee', controller.user.oauth);
  router.get(
    '/users/passport/gitee/callback',
    controller.user.oauthByGitee
  );
 
  router.post('/works', controller.work.createWork);
  router.post('/works/copy/:id', controller.work.copyWork)
  router.get('/works', controller.work.myList);
  router.get('/works/:id', controller.work.myWork)
  router.get('/templates', controller.work.templateList);
  router.get('/templates/:id', controller.work.template)
  router.patch('/works/:id', controller.work.update);
  router.delete('/works/:id', controller.work.delete);
  router.post('/works/publish/:id', controller.work.publishWork);
  router.post(
    '/works/publish-template/:id',
    controller.work.publishTemplate
  );

  // router.post('/api/utils/upload', controller.utils.fileUploadByStream);
  router.post('/api/utils/uploadToOss', controller.utils.uploadToOSS);
  router.post('/api/utils/uploadToBusBoy', controller.utils.testBusBoy);
  router.post(
    '/api/utils/uploadMultiple',
    controller.utils.uploadMultipleByBusboy
  );

  router.get('/pages/:id',controller.utils.renderH5Page)

  router.post('/channels', controller.work.createChannels)
  router.get('/channels/:id', controller.work.getWorkChannelsById)
  router.patch('/channels/:id', controller.work.updateChannels)
  router.delete('/channels/:id', controller.work.deleteChannels)
};
