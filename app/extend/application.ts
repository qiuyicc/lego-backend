import { Application } from 'egg';
import axios,{AxiosInstance } from 'axios';
import Dysmsapi from '@alicloud/dysmsapi20170525'
import * as $OpenApi from '@alicloud/openapi-client';
const AXIOS = Symbol('Application#axios');
const ALICLIENT = Symbol('Application#aliclient');
export default {
  //扩展方法
  ehco(msg: string) {
    const that = this as unknown as Application;
    console.log(`hello1 ${msg}${that.config.env}`);
  },
  //扩展属性,设置getter方法
  get axiosInstance():AxiosInstance {
    if (!this[AXIOS]) {
      this[AXIOS] = axios.create({
        baseURL: 'https://dog.ceo/',
        timeout: 5000,
      });
    }
    return this[AXIOS];
  },
  //扩展属性,设置setter方法
  //set someProperty(value: Type) {
    // 自定义逻辑
    // }
      //get someProperty(value: Type) {
    // 自定义逻辑
    // }
    //普通方法
    // someMethod() {
    //     // 操作代码
    // } 
    //static someStaticMethod() {
    // 静态方法代码
// }
  get AliClient():Dysmsapi {
    const that = this as Application
    const { accessKeyId, accessKeySecret,endpoint } = that.config.aliCloudConfig;
    if(!this[ALICLIENT]){
      const config = new $OpenApi.Config({
        accessKeyId,
        accessKeySecret
      })
      config.endpoint = endpoint
      this[ALICLIENT] = new Dysmsapi(config)
    }
    return this[ALICLIENT]
  }
};
