import { Context,EggAppConfig } from "egg";
import { verify } from 'jsonwebtoken'
function getTokenValue(ctx: Context){
    const { authorization } = ctx.headers;
    //Authorization: Bearer <token>
    if(!ctx.header || !authorization ){
      return false
    }
    if(typeof authorization ==='string'){
      const parts = authorization.split(' ');
      if(parts.length === 2){
        const scheme = parts[0];
        const token = parts[1];
        if(/^Bearer$/i.test(scheme)){
          return token
        }else {
          return false
        }
      }
    }else {
      return false
    }
  }

  export default (options:EggAppConfig['jwt']) => {
    return async (ctx:Context,next:() => Promise<any>) =>{
        const token = getTokenValue(ctx)
        if(!token){
            return ctx.helper.error({ctx,errType:'loginValidateFail'})
        }
        const { secret } = options
        if(!secret){
            throw new Error('secret is required for jwt middleware')
        }
        try {
            const decoded = verify(token, secret)
            ctx.state.user = decoded
            await next()
        } catch (error) {
            return ctx.helper.error({ctx,errType:'loginValidateFail'})
        }
    }
  }