import { Service } from 'egg';
import { createSSRApp } from 'vue';
import LegoCompoents from 'lego-components';
import { renderToString, renderToNodeStream } from '@vue/server-renderer';

export default class UtilsService extends Service {
  propsToStyle(props = {}) {
    const keys = Object.keys(props);
    const styleArr = keys.map((key) => {
      const formatkey = key.replace(
        /([A-Z])/g,
        (c) => `-${c.toLocaleLowerCase()}`
      );
      const value = props[key];
      return `${formatkey}:${value}`;
    });
    return styleArr.join(';');
  }
  pxToVw(components = []) {
    const reg = /^(\d+(\.\d+)?)px$/;
    components.forEach((component) => {
      const props = (component as { props: Record<string, any> }).props || {};
      Object.keys(props).forEach((key) => {
        const val = props[key];
        if (typeof val !== 'string') {
          return;
        }
        if (reg.test(val) === false) {
          return;
        }
        const arr = val.match(reg) || [];
        const numStr = arr[1];
        const num = parseFloat(numStr);
        const vwNum = (num / 375) * 100;
        props[key] = `${vwNum.toFixed(2)}vw`;
      });
    });
  }
  async renderToPageData(query: { id: string; uuid: string }) {
    const work = await this.ctx.model.Work.findOne(query).lean();
    if (!work) {
      throw new Error('work not found');
    }
    const { title = '默认', desc = '默认', content } = work;
    const parseContent = JSON.parse(content && (content as any));
    this.pxToVw(parseContent.components);
    const ssrApp = createSSRApp({
      data: () => {
        return {
          components: parseContent.components || [],
        };
      },
      template: `<final-page :components="components"></final-page>`,
    });
    ssrApp.use(LegoCompoents);
    const html = await renderToString(ssrApp);
    const bodyStyle = this.propsToStyle(parseContent.props);
    return {
      html,
      title,
      desc,
      bodyStyle,
    };
  }
}
