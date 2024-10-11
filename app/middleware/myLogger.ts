import { Context, Application,EggAppConfig } from 'egg';
import { appendFileSync } from 'node:fs';
// @ts-ignore
export default (options: EggAppConfig['myLogger'], app: Application) => {
  return async (ctx: Context, next: () => Promise<any>) => {
    const startTime = new Date().getTime();
    const requestTime = new Date();
    await next();
    const endTime = new Date().getTime();
    const time = endTime - startTime;
    if (options.allowedMethod.includes(ctx.method)) {
      const logTime = `${requestTime} -- ${ctx.method} -- ${ctx.url} --${time}`;
      appendFileSync('./log.txt', logTime + '\n');
    }
  };
};
