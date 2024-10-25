import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.baseUrl = 'prod.url';
  // config.security = {
  //   domainWhiteList:['https://lego.qiuyicc.com']
  // }
  // config.jwtExpires='2 days'
  // config.giteeOauthConfig = {
  //   redirectURL:'https://api.qiuyicc.com/api/users/passport/gitee/callback'
  // }
  // config.H5BaseUrl = 'https://h5.qiuyicc.com'
  config.mongoose = {
    url: 'mongodb://lego-mongo:27017/lego',
    options: {
      user:process.env.MONGO_DB_USERNAME,
      pass:process.env.MONGO_DB_PASSWORD,
    },
  };
  config.redis = {
    client:{
      port:6379,
      host:'lego-redis',
      password:process.env.REDIS_PASSWORD,
    }
  }
  return config;
};
