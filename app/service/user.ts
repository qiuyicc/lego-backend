import { Service } from 'egg';
import { UserProps } from '../model/user';
import * as $Dysmsapi from '@alicloud/dysmsapi20170525';

interface GiteeUserDataType {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}

export default class UserService extends Service {
  public async createUserServiceByEmail(payload: UserProps) {
    const { ctx } = this;
    const { username, password } = payload;
    const hashPassword = await ctx.genHash(password); //生成hash密码
    const userCreateData: Partial<UserProps> = {
      username,
      password: hashPassword,
      email: username,
    };
    const user = await ctx.model.User.create(userCreateData);
    return user;
  }
  async findByUserName(username: string) {
    return this.ctx.model.User.findOne({ username });
  }
  async findByUserId(id: string) {
    const result = await this.ctx.model.User.findById(id);
    if (result) {
      return result;
    }
  }
  async loginByPhoneNumber(phoneNumber: string) {
    const { ctx, app } = this;
    const user = await this.findByUserName(phoneNumber);
    //如果用户存在，则直接返回token
    if (user) {
      const token = await app.jwt.sign(
        { username: user.username,_id: user._id },
        app.config.jwt.secret,
        { expiresIn: app.config.jwtExpires }
      );
      return token;
    }
    //如果用户不存在，则创建用户
    const userCreateData: Partial<UserProps> = {
      username: phoneNumber,
      phoneNumber,
      nickName: `lego_${phoneNumber.slice(-4)}`,
      type: 'phone',
    };
    const newUser = await ctx.model.User.create(userCreateData);
    const token = await app.jwt.sign(
      { username: newUser.username, _id: newUser._id },
      app.config.jwt.secret,
      { expiresIn: app.config.jwtExpires }
    );
    return token;
  }
  async sendSMS(phoneNumber: string, vertifyCode: string) {
    const { app } = this;
    const sendSmsRequest = new $Dysmsapi.SendSmsRequest({
      phoneNumbers: phoneNumber,
      signName: '秋忆CC的知识库',
      templateCode: 'SMS_474145227',
      templateParam: `{"code":"${vertifyCode}"}`,
    });
    const result = await app.AliClient.sendSms(sendSmsRequest);
    return result;
  }
  //get access token from gitee
  async getAccessToken(code: string) {
    const { ctx, app } = this;
    const { cid, secret, redirectURL, authURL } = app.config.giteeOauthConfig;
    const { data } = await ctx.curl(authURL, {
      method: 'POST',
      headers:{
        'Content-Type': 'application/json',
      },
      dataType: 'json',
      data: {
        code,
        client_id: cid,
        redirect_uri: redirectURL,
        client_secret: secret,
      },
    });
    return data.access_token;
  }
  async getGiteeUserInfo(accessToken: string) {
    const { ctx, app } = this;
    const { giteeUserAPI } = app.config.giteeOauthConfig;
    const { data } =await ctx.curl<GiteeUserDataType>(`${giteeUserAPI}?access_token=${accessToken}`, {
      method: 'GET',
      dataType: 'json',
    })
    return data;
  }
  async loginByGitee(code: string) {
    const { ctx, app } = this;
    const accessToken = await this.getAccessToken(code);
    const giteeUserInfo = await this.getGiteeUserInfo(accessToken);
    //检查用户是否存在
    const { id, name, avatar_url, email } = giteeUserInfo;
    const stringId = id.toString();
    const user = await this.findByUserName(`Gitee_${stringId}`)//创建Gitee_id的用户名,防止与其他平台的用户名冲突
    if (user) {
      const token = app.jwt.sign({ username: user.username, _id: user._id }, app.config.jwt.secret,{ expiresIn: app.config.jwtExpires });
      return token;
    }
    const userCreateData: Partial<UserProps> = {
      oauthID:stringId,
      provider: 'gitee',
      username: `Gitee_${stringId}`,
      picture: avatar_url,
      nickName:name,
      email,
      type: 'oauth',
    }
    const newUser = await ctx.model.User.create(userCreateData);
    const token = app.jwt.sign({ username: newUser.username, _id: newUser._id }, app.config.jwt.secret,{ expiresIn: app.config.jwtExpires });
    return token;
  }
}
