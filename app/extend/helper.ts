import { Context } from 'egg';
import { userErrorMessages } from '../controller/user';
import { workErrorMessage } from '../controller/work';
import { uploadErrorMessage } from '../controller/utils'
interface ResType {
  ctx: Context;
  res?: any;
  message?: string;
}

export interface ErrType {
  ctx: Context;
  errType: keyof (typeof userErrorMessages & typeof workErrorMessage & typeof uploadErrorMessage);
  error?: any;
}

const globalErrorMessages = {
  ...userErrorMessages,
  ...workErrorMessage,
  ...uploadErrorMessage,
}

export default {
  success({ ctx, res, message }: ResType) {
    ctx.body = {
      errno: 200,
      data: res ? res : null,
      message: message ? message : '请求成功',
    };
    ctx.status = 200;
  },
  error({ ctx, errType, error }: ErrType) {
    const { errno, message } = globalErrorMessages[errType];
    ctx.body = {
      errno,
      message,
      ...(error && { error }),
    };
    ctx.status = 200;
  },
};
