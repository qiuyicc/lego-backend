import { IBoot, Application } from 'egg';
import { get } from 'http';

export default class AppBoot implements IBoot {
  private readonly app: Application;
  constructor(app: Application) {
    this.app = app;
    (app as any).sessionMap = {};
    (app as any).sessionStore = {
      async get(key: string) {
        app.logger.info(`get session ${key}`);
        return (app as any).sessionMap[key];
      },
      async set(key: string, value: any) {
        app.logger.info(`set session ${(key)}--${value}`);
        (app as any).sessionMap[key] = value;
      },
      async destroy(key: string) {
        app.logger.info(`destroy session ${key}`);
        delete (app as any).sessionMap[key];
      }
    };
    // this.app = app;
    // const { url } = this.app.config.mongoose;
    // assert(url, 'config.mongoose.url is required');
    // const db = createConnection(url);
    // db.on('connected',()=>{
    //     app.logger.info('Mongoose connection open to ' + url);
    // })
    // //@ts-ignore
    // app.mongoose = db;
  }
  configWillLoad() {
    // 此时config文件已被读取合并，但是还并未生效
    //这是应用层修改配置的最后时机
    // console.log(this.app.config.baseUrl);
    // console.log(this.app.config.coreMiddleware);//egg默认中间件
    // this.app.config.coreMiddleware.push('myLogger'); //可以在此添加中间件
  }
  configDidLoad(): void {
    //配置插件加载完成
  }
  async didLoad() {
    //异步
    //所有的插件都已加载完毕
  }
  async willReady(): Promise<void> {
    //异步
    //应用准备就绪
    //  const dir = join(this.app.config.baseDir, 'app/model');
    //  this.app.loader.loadToApp(dir,'model', {
    //   caseStyle: 'upper',
    //  })
  }
  async didReady(): Promise<void> {
    //异步
    //应用启动完成
    // const ctx = this.app.createAnonymousContext(); //创建上下文
    // this.app.middleware 应用启动后真正的运行的中间件
    // console.log('app is ready',this.app.middleware);
    
  }
}
