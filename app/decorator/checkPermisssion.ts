import { GlobalErrorTypes } from '../error/index';
import { Controller } from 'egg';
import defineRules from '..//roles/roles'
import { subject } from '@casl/ability';
import { permittedFieldsOf } from '@casl/ability/extra';
import { difference,assign } from 'lodash/fp'

const caslMethodMapping:Record<string, string> = {
  GET:"read",
  POST:"create",
  PATCH:"update",
  DELETE:"delete"
}

interface IOptions {
  action?:string //自定义action
  key?:string //查找数据时使用的key，默认为id
  value?:{type:'params' | 'body',valueKey:string} //查询数据时value的来源，默认为params
  // { "channels.id":ctx.request.body.workId }
}

interface ModelMapping {
  mongoose:string;
  casl:string
} 


/**
 * @param modelName 模型名称 
 * @param errorType 错误类型
 * @param options 选项
 * @returns function 装饰器
 */
const fieldsOptions = { fieldsFrom: rule => rule.fields || [] }
const defaultOptions = { key: 'id', value: { type: 'params', valueKey: 'id' } }
export default function checkPermission(
  modelName: string | ModelMapping,
  errorType: GlobalErrorTypes,
  options?: IOptions
) {
  return function (prototype, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const that = this as Controller;
      //@ts-ignore
      const { ctx } = that;
      const { method } = ctx.request;
      const searchOptions = assign(defaultOptions,options || {})
      const { key, value } = searchOptions
      const {type,valueKey } = value
      const source = type === 'params'? ctx.params : ctx.request.body
      const query = {
        [key]: source[valueKey]
      }
      const mongooseModelName = typeof modelName === 'string'? modelName : modelName.mongoose
      const caslModelName = typeof modelName === 'string'? modelName : modelName.casl
      let permission = false;
      let keyPermission = true;
      const action = (options && options.action)?options.action:caslMethodMapping[method];//自定义action
      if(!ctx.state && !ctx.state.user){
        return ctx.helper.error({ ctx, errType:errorType });
      }
      const ability = defineRules(ctx.state.user)
      const rule = ability.relevantRuleFor(action,caslModelName)//返回一个定义在roles中与给定操作和模型名称相关的权限规则      
      if(rule && rule.conditions){
        //如果rule中有受限查寻条件
        const certianRecord = await ctx.model[mongooseModelName].findOne(query).lean()
        permission = ability.can(action,subject(caslModelName,certianRecord))
      }else {
        permission = ability.can(action,caslModelName)
      }      
      //判断rule中是否有受限字段
      if(rule && rule.fields){
        const fields = permittedFieldsOf(ability,action,caslModelName,fieldsOptions)
        if(fields.length > 0){
          //1. 使用pick过滤没有权限的字段
          //2. 将请求字段和允许字段做比较
          const payLoadKeys = Object.keys(ctx.request.body)
          const diffKeys = difference(payLoadKeys,fields)  
          keyPermission = diffKeys.length === 0
        }
      }

      if (!permission || !keyPermission) {
        return ctx.helper.error({ ctx, errType:errorType });
      }
      await originalMethod.apply(this, args);
    };
  };
}
