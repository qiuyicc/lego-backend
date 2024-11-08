import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();
export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;
  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1727344437992_7867';

  // add your egg config in here
  config.middleware = ['customError'];
  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: ['http://localhost:5173'],
  };
  config.view = {
    defaultViewEngine: 'nunjucks',
  };
  config.logger = {
    consoleLevel: 'DEBUG',
    level: 'DEBUG',
  };
  config.oss = {
    client:{
      accessKeyId:process.env.ACCESS_KEY_ID || '',
      accessKeySecret:process.env.ACCESS_KEY_SECRET || '',
      bucket:'my-lego-backend',
      endpoint:'oss-cn-chengdu.aliyuncs.com',
      timeout: '60s'
    }
  }
  const aliCloudConfig = {
    accessKeyId:process.env.ACCESS_KEY_ID,
    accessKeySecret:process.env.ACCESS_KEY_SECRET,
    endpoint:"dysmsapi.aliyuncs.com"
  }
  const giteeOauthConfig = {
    cid:process.env.CLIENT_ID,
    secret:process.env.CLIENT_SECRET,
    redirectURL:'http://localhost:7001/api/users/passport/gitee/callback',
    authURL:'https://gitee.com/oauth/token?grant_type=authorization_code',
    giteeUserAPI:'https://gitee.com/api/v5/user'
  }
  // config.cors = {
  //   origin:'http://localhost:5173',
  //   allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  // }
  // config.mongoose = {
  //   url:'mongodb://localhost:27017/test',
  // }
  config.mongoose = {
    url: 'mongodb://127.0.0.1:27017/lego',
  };
  config.bcrypt = {
    saltRounds: 10,
  };
  config.session = {
    encrypt: false,
  };
  config.multipart = {
    // mode: 'file',
    // tmpdir: join(appInfo.baseDir, 'uploads'), // 设置上传文件临时目录
    whitelist:['.png','.jpg','.gif','.webp','.jpeg'],
    fileSize: '5MB'
  };
  config.static = {
    dir: [
      { prefix: '/public', dir: join(appInfo.baseDir, 'app/public') },
      { prefix: '/uploads', dir: join(appInfo.baseDir, 'uploads') }, // 设置静态文件目录
    ],
  };
  config.jwt = {
    enable: true,
    secret: process.env.JWT_SECRET || '',
    match:[
      '/api/users/getUserInfo',
      '/api/works',
      '/api/utils',
      '/api/channels'
    ]
  };
  config.redis = {
    client: {
      port: 6379,
      host: '127.0.0.1',
      password: '123456',
      db: 0,
    },
  };
  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
    myLogger: {
      allowedMethod: ['POST'],
    },
    baseUrl: 'default.url',
    aliCloudConfig,
    giteeOauthConfig,
    H5BaseUrl:'http://localhost:7001/api/pages',
    jwtExpires:'10h'
    // mongoose:{
    //   url:'mongodb://localhost:27017/test'
    // }
  };

  // the return config will combines to EggAppConfig
  return {
    ...(config as {}),
    ...bizConfig,
  };
};
