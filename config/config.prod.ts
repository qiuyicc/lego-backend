import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.baseUrl = 'prod.url'
  config.security = {
    domainWhiteList:['https://lego.qiuyicc.com']
  }
  config.jwtExpires='2 days'
  config.giteeOauthConfig = {
    redirectURL:'https://api.qiuyicc.com/api/users/passport/gitee/callback'
  }
  config.H5BaseUrl = 'https://h5.qiuyicc.com'
  return config;
};
