import { Context } from "egg";
export default () =>{
    return async (ctx: Context, next: () => Promise<any>) =>{
        try {
            await next();
        } catch (error) {
            const err = error as any;
            if(err && err.status === 401){
                return ctx.helper.error({ctx,errType:'loginValidateFail'})
            } else if(ctx.path === '/api/utils/uploadMultiple'){
                if(err && err.status === 400){
                    return ctx.helper.error({ctx,errType:'uploadFileFormatFail',error:err.message})
                }
            }
            throw err
        }
    }
}
