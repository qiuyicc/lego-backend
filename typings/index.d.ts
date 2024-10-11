import 'egg';
declare module 'egg' {
  interface MongooseModels extends IModel {
    [key: string]: Model<any>;
  }

  interface Context  {
    genHash(plainText: string):Promise<string>,
    compare(plainText: string, hash: string):Promise<boolean>,
  }
  interface EggAppConfig {
    bcrypt:{
        saltRounds: number
    }
  }
  interface Application {
    sessionMap:{
      [key: string]: any
    },
    sessionStore:any
  }
}
