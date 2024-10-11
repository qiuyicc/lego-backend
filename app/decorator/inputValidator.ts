import { GlobalErrorTypes } from '../error/index';
import { Controller } from 'egg';

export default function checkPermission(
  validatorRules: any,
  errType: GlobalErrorTypes,
) {
  return function (prototype, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const that = this as Controller;
      //@ts-ignore
      const { ctx,app } = that;
      const errors = app.validator.validate(validatorRules, ctx.request.body)
      if(errors){
        return ctx.helper.error({ctx,errType,error:errors})
      } 
      await originalMethod.apply(this, args);
    };
  };
}
