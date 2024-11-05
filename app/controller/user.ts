import { Controller } from 'egg';

const userCreateRules = {
  username: 'email',
  password: {
    type: 'password',
    min: 6,
  },
};
const userSendPhoneCodeRules = {
  phoneNumber: {
    type: 'string',
    format: /^1[3-9]\d{9}$/,
    message: '请输入正确的手机号码',
  },
  vertifyCode: {
    type: 'string',
    min: 4,
    max: 4,
    message: '请输入正确的验证码',
  },
};
const userPhoneRules = {
  phoneNumber: {
    type: 'string',
    format: /^1[3-9]\d{9}$/,
    message: '请输入正确的手机号码',
  },
};
export const userErrorMessages = {
  userValidateFail: {
    errno: '101001',
    message: '您输入的数据格式不正确',
  },
  createUserAlreadyExist: {
    errno: '101002',
    message: '用户已存在',
  },
  loginCheckFail: {
    errno: '101003',
    message: '用户不存在或者密码错误',
  },
  loginValidateFail: {
    errno: '101004',
    message: '登录验证失败',
  },
  sendVerifyCodeFail: {
    errno: '101005',
    message: '请勿频繁发送验证码',
  },
  loginVertifyCodeFail: {
    errno: '101006',
    message: '验证码错误',
  },
  PhoneOrVertifyCodeFial: {
    errno: '101007',
    message: '手机号或验证码错误',
  },
  sendVertifyCodeError: {
    errno: '101008',
    message: '发送验证码失败',
  },
  giteeOauthFail: {
    errno: '101009',
    message: 'gitee授权失败',
  },
};

export default class UserController extends Controller {
  //验证用户输入
  validateUserInput(rules) {
    const { ctx, app } = this;
    const errors = app.validator.validate(rules, ctx.request.body);
    return errors;
  }
  //发送验证码
  async sendVerifyCode() {
    const { ctx, app } = this;
    const { phoneNumber } = ctx.request.body;
    const errorRes = this.validateUserInput(userPhoneRules);

    if (errorRes) {
      return ctx.helper.error({
        ctx,
        errType: 'userValidateFail',
        error: errorRes,
      });
    }
    //检查redis中是否有发送记录
    const preVertifyCode = await app.redis.get(
      `phoneVertifyCode-${phoneNumber}`
    );
    //如果有记录，则返回错误
    if (preVertifyCode) {
      return ctx.helper.error({ ctx, errType: 'sendVerifyCodeFail' });
    }
    //生成短信验证码
    const vertifyCode = Math.floor(Math.random() * 9000 + 1000).toString();
    //发送阿里云短信
    //判断是否为生产环境
    if (app.config.env === 'prod') {
      const result = await this.service.user.sendSMS(phoneNumber, vertifyCode);

      if (result.body?.code !== 'OK') {
        return ctx.helper.error({ ctx, errType: 'sendVertifyCodeError' });
      }
    }

    //保存验证码到redis
    await app.redis.set(
      `phoneVertifyCode-${phoneNumber}`,
      vertifyCode,
      'ex',
      60
    );
    return ctx.helper.success({
      ctx,
      message: '验证码发送成功',
      res: app.config.env === 'prod' ? { vertifyCode } : null,
    });
  }


  //手机登录
  async loginByPhone() {
    const { ctx, app } = this;
    const { phoneNumber, vertifyCode } = ctx.request.body;
    const errorRes = this.validateUserInput(userSendPhoneCodeRules);
    if (errorRes) {
      return ctx.helper.error({
        ctx,
        errType: 'PhoneOrVertifyCodeFial',
        error: errorRes,
      });
    }
    //检查验证码
    const preVertifyCode = await app.redis.get(
      `phoneVertifyCode-${phoneNumber}`
    );
    if (!preVertifyCode || preVertifyCode !== vertifyCode) {
      return ctx.helper.error({ ctx, errType: 'loginVertifyCodeFail' });
    }
    //登录
    const token = await ctx.service.user.loginByPhoneNumber(phoneNumber);
    return ctx.helper.success({ ctx, res: { token } });
  }

  //创建用户
  async createUserControllerByEmail() {
    const { ctx, service, app } = this;
    //ctx.validate(userCreateRules)
    const errorRes = this.validateUserInput(userCreateRules);
    if (errorRes) {
      return ctx.helper.error({
        ctx,
        errType: 'userValidateFail',
        error: errorRes,
      });
    }
    const result = await service.user.findByUserName(ctx.request.body.username);
    if (result) {
      return ctx.helper.error({ ctx, errType: 'createUserAlreadyExist' });
    }
    const userData = await service.user.createUserServiceByEmail(
      ctx.request.body
    );
    ctx.helper.success({ ctx, res: userData });
  }
  //登录
  async login() {
    const { ctx, service, app } = this;
    const errorRes = this.validateUserInput(userCreateRules);
    //检查用户输入
    if (errorRes) {
      return ctx.helper.error({
        ctx,
        errType: 'userValidateFail',
        error: errorRes,
      });
    }
    const { username, password } = ctx.request.body;
    //检查用户是否存在
    const user = await service.user.findByUserName(username);
    if (!user) {
      return ctx.helper.error({ ctx, errType: 'loginCheckFail' });
    }
    // 验证密码
    const verifyResult = await ctx.compare(password, user!.password);
    if (!verifyResult) {
      return ctx.helper.error({ ctx, errType: 'loginCheckFail' });
    } else {
      // ctx.cookies.set('username',user.username,{encrypt:true}) //设置cookie并启动加密
      // ctx.cookies.get('username',{encrypt:true})//获取cookie并解密
      // ctx.session.username = user.username; //设置session
      const token = app.jwt.sign(
        { username: user.username,_id: user._id },
        app.config.jwt.secret,
        { expiresIn: '10h' }
      );
      return ctx.helper.success({ ctx, res: { token }, message: '登录成功' });
    }
  }

  //获取用户信息
  async showUser() {
    const { ctx, app, service } = this;
    // const { username } = ctx.session;
    // if (!username) {
    //   return ctx.helper.error({ ctx, errType: 'loginValidateFail' });
    // }
    // const user = await service.user.findByUserId(ctx.params.id);
    // ctx.helper.success({ ctx, res: username });
    const userData = await service.user.findByUserName(ctx.state.user.username);
    return ctx.helper.success({ ctx, res: userData!.toJSON() });
  }
  //跳转到oauth页面
  async oauth() {
    const { ctx, app, service } = this;
    const { cid, redirectURL } = app.config.giteeOauthConfig;
    ctx.redirect(
      `https://gitee.com/oauth/authorize?client_id=${cid}&redirect_uri=${redirectURL}&response_type=code`
    );
  }
  //跳转回来后获取token
  async oauthByGitee() {
    const { ctx } = this;
    const { code } = ctx.request.query;
    try {
      const token = await ctx.service.user.loginByGitee(code);
      if (token) {
        await ctx.render('success.nj', { token });
        // ctx.helper.success({ ctx, res: { token } })
      }
    } catch (error) {
      ctx.helper.error({ ctx, errType: 'giteeOauthFail' });
    }
  }
}
