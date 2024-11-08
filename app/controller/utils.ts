import { Controller, FileStream } from 'egg';
// import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { parse, join, extname } from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import sendToWormhole from 'stream-wormhole';
import busboy from 'busboy';
export const uploadErrorMessage = {
  uploadFail: {
    errno: '103001',
    message: '上传文件失败',
  },
  uploadOSSFail: {
    errno: '103002',
    message: '上传文件到OSS失败',
  },
  uploadFileFormatFail: {
    errno: '103003',
    message: '上传文件格式不支持',
  },
  uploadFileSizeFail: {
    errno: '103004',
    message: '上传文件大小超出限制',
  },
  h5WorkFail: {
    errno: '103005',
    message: 'H5渲染失败',
  },
};

export default class UtilsController extends Controller {
  splitIdAndUuid(str = '') {
    const res = { id: '', uuid: '' };
    if (!str) return res;
    const firstIndex = str.indexOf('-');
    if (firstIndex === -1) return res;
    res.id = str.slice(0, firstIndex);
    res.uuid = str.slice(firstIndex + 1);
    // console.log('res',res);

    return res;
  }

  async renderH5Page() {
    // const { ctx, app } = this;
    // const ssrApp = createSSRApp({
    //   data:() =>({msg:'hello ssr'}),
    //   template:'<h1>{{msg}}</h1>'
    // })
    // //renderToString写法
    // // const appContent = await renderToString(ssrApp)
    // // ctx.response.type = 'text/html'
    // // ctx.body = appContent
    // // renderToNodeStream写法
    // const stream = await renderToNodeStream(ssrApp)
    // ctx.status = 200
    // await pipeline(stream,ctx.res)
    const { ctx, app } = this;
    const { id: idAndUuid } = ctx.params;

    const query = this.splitIdAndUuid(idAndUuid);
    try {
      const { html, title, desc, bodyStyle } =
        await this.service.utils.renderToPageData(query);
      await ctx.render('page.nj', { html, title, desc, bodyStyle });
    } catch (error) {
      ctx.helper.error({ ctx, errType: 'h5WorkFail' });
    }
  }

  async uploadMultipleByBusboy() {
    console.log(111);
    const { ctx, app } = this;
    const { fileSize } = app.config.multipart;
    const parts = ctx.multipart({
      limits: {
        fileSize: fileSize as number,
      },
    });
    const resultArr: string[] = [];
    let part: FileStream | string[];
    while ((part = await parts())) {
      if (!Array.isArray(part)) {
        try {
          const uuid = nanoid(6);
          const saveFilePath = join(
            'imooc-test',
            uuid + extname(part.filename)
          );
          const result = await app.oss.put(saveFilePath, part);
          const { url } = result;
          resultArr.push(url);
          if (part.truncated) {
            await ctx.oss.delete(saveFilePath);
            return ctx.helper.error({ ctx, errType: 'uploadFileSizeFail' });
          }
        } catch (error) {
          await sendToWormhole(part);
          return ctx.helper.error({ ctx, errType: 'uploadOSSFail' });
        }
      }
    }
    ctx.helper.success({ ctx, res: { resultArr } });
  }

  uploadFileUseBusboy() {
    const { ctx, app } = this;
    const resultArr: string[] = [];
    return new Promise<string[]>((resolve, reject) => {
      const bb = busboy({ headers: ctx.req.headers });
      bb.on('file', (name, file, info) => {
        const uuid = nanoid(6);
        const saveFilePath = join(
          app.config.baseDir,
          'uploads',
          uuid + extname(info.filename)
        );
        const target = createWriteStream(saveFilePath);
        file.pipe(target);
        file.on('end', () => {
          resultArr.push(saveFilePath);
        });
      });
      bb.on('field', (name, val, info) => {
        //对于文本类型
        // console.log(name,val,info);
      });
      bb.on('finish', () => {
        resolve(resultArr);
      });
      ctx.req.pipe(bb);
    });
  }
  async testBusBoy() {
    const { ctx } = this;
    const res = await this.uploadFileUseBusboy();
    ctx.helper.success({ ctx, res });
  }

  // async fileLocalUpload() {
  //   const { ctx, app } = this;
  //   const { filepath } = ctx.request.files[0];

  //   // 生成sharp实例
  //   const imageSource = sharp(filepath);
  //   const metaData = await imageSource.metadata(); //获取图片元数据
  //   let thumbFileUrl = '';
  //   if (metaData.width && metaData.width > 300) {
  //     const { name, ext, dir } = parse(filepath);
  //     // console.log('baseDir',app.config.baseDir);
  //     const thumbFilePath = join(dir, `${name}-thumbnail${ext}`);
  //     await imageSource.resize({ width: 300 }).toFile(thumbFilePath); //生成缩略图
  //     thumbFileUrl = thumbFilePath.replace(
  //       app.config.baseDir,
  //       app.config.baseUrl
  //     );
  //     thumbFileUrl = thumbFileUrl.replace(/\\/g, '/'); //注意url中可能包含反斜杠，需要替换为正斜杠
  //     // console.log('thumbFileUrl',thumbFileUrl);
  //   }
  //   let url = filepath.replace(app.config.baseDir, app.config.baseUrl);
  //   url = url.replace(/\\/g, '/'); //注意url中可能包含反斜杠，需要替换为正斜杠

  //   ctx.helper.success({
  //     ctx,
  //     res: { url, thumbFileUrl: thumbFileUrl ? thumbFileUrl : url },
  //   });
  // }

  pathToUrl(filepath: string) {
    const { app } = this;
    let url = filepath.replace(app.config.baseDir, app.config.baseUrl);
    url = url.replace(/\\/g, '/');
    return url;
  }

  // async fileUploadByStream() {
  //   const { ctx, app } = this;
  //   const stream = await ctx.getFileStream();
  //   const uuid = nanoid(6);
  //   const saveFilePath = join(
  //     app.config.baseDir,
  //     'uploads',
  //     uuid + extname(stream.filename)
  //   );
  //   const saveThumbnailPath = join(
  //     app.config.baseDir,
  //     'uploads',
  //     uuid + '_thumbnail' + extname(stream.filename)
  //   );
  //   const target = createWriteStream(saveFilePath);
  //   const target2 = createWriteStream(saveThumbnailPath);
  //   const savePromise = pipeline(stream, target);
  //   const transformer = sharp().resize({ width: 300 });
  //   const saveThumbnailPromise = pipeline(stream, transformer, target2);
  //   try {
  //     await Promise.all([savePromise, saveThumbnailPromise]);
  //   } catch (error) {
  //     return ctx.helper.error({ ctx, errType: 'uploadFail' });
  //   }
  //   ctx.helper.success({
  //     ctx,
  //     res: {
  //       url: this.pathToUrl(saveFilePath),
  //       thumbFileUrl: this.pathToUrl(saveThumbnailPath),
  //     },
  //   });
  // }

  async uploadToOSS() {
    const { ctx, app } = this;
    const stream = await ctx.getFileStream();
    const saveOssPath = join(
      'imooc-test',
      nanoid(6) + extname(stream.filename)
    );
    try {
      const res = await ctx.oss.put(saveOssPath, stream);
      const { name, url } = res;
      ctx.helper.success({ ctx, res: { name, url } });
    } catch (error) {
      await sendToWormhole(stream);
      ctx.helper.error({ ctx, errType: 'uploadOSSFail' });
    }
  }
}
