const OSS = require('ali-oss');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});
const publicPath = path.resolve(__dirname, '../app/public');
const client = new OSS({
        accessKeyId:process.env.ACCESS_KEY_ID || '',
        accessKeySecret:process.env.ACCESS_KEY_SECRET || '',
        bucket:'my-lego-backend',
        endpoint:'oss-cn-chengdu.aliyuncs.com',
        timeout: '60s'  
})
async function uploadToOSS() {
    const publicFiles = fs.readdirSync(publicPath)
    console.log('publicFiles',publicFiles)
    const files = publicFiles.filter(file => file !== 'page.nj')
    const res = await Promise.all(files.map(async file => {
        const saveOssPath = path.join('h5-assets',file)
        const filePath = path.join(publicPath, file)
        const result = await client.put(saveOssPath, filePath)
        const { url } = result
        return url
    }))
    console.log('上传成功',res)
}

uploadToOSS()