import { Controller } from 'egg';
import { nanoid } from 'nanoid';
import checkPermission from '../decorator/checkPermisssion';
import inputValidator from 'app/decorator/inputValidator';
const workCreateRules = {
  title: 'string',
};

const createChannelRules = {
  name: 'string',
  workId: 'number',
};

export const workErrorMessage = {
  workValidationFailed: {
    errno: '102001',
    message: '输入信息验证失败',
  },
  workNoPermission: {
    errno: '102002',
    message: '无权操作',
  },
  workPublishFail: {
    errno: '102003',
    message: '发布失败',
  },
  createChannelsFail: {
    errno: '103006',
    message: '创建渠道失败',
  },
  getWorkChannelsFail: {
    errno: '103007',
    message: '获取作品渠道失败',
  },
  updateChannelsFail: {
    errno: '103008',
    message: '更新渠道失败',
  },
  deleteChannelsFail: {
    errno: '103009',
    message: '删除渠道失败',
  },
  workNoPublicFail: {
    errno: '103010',
    message: '该作品未公开，不能进行操作',
  },
};

export interface IndexCondition {
  pageIndex?: number;
  pageSize?: number;
  select?: string | string[];
  populate?: { path?: string; select?: string } | string;
  customSort?: Record<string, any>;
  find?: Record<string, any>;
}

export default class WorkController extends Controller {
  private validateWorkInput(rules) {
    const { ctx, app } = this;
    const errors = app.validator.validate(rules, ctx.request.body);
    return errors;
  }

  @inputValidator(createChannelRules, 'createChannelsFail')
  @checkPermission({ casl: 'Channels', mongoose: 'Work' }, 'workNoPermission', {
    value: { type: 'body', valueKey: 'workId' },
  })
  async createChannels() {
    const { ctx, app } = this;
    const { name, workId } = ctx.request.body;
    const uuid = nanoid(6);
    const newChannel = {
      name,
      id: uuid,
    };
    try {
      const res = await ctx.model.Work.findOneAndUpdate(
        { id: workId },
        {
          $push: {
            channels: newChannel,
          },
        }
      );
      if (!res) {
        return ctx.helper.error({ ctx, errType: 'createChannelsFail' });
      }
      ctx.helper.success({ ctx, res: newChannel });
    } catch (error) {
      ctx.helper.error({ ctx, errType: 'createChannelsFail' });
    }
  }

  @checkPermission({ casl: 'Channels', mongoose: 'Work' }, 'workNoPermission')
  async getWorkChannelsById() {
    const { ctx, app } = this;
    const { id } = ctx.params;
    try {
      const result = await ctx.model.Work.findOne({ id });
      if (!result) {
        return ctx.helper.error({ ctx, errType: 'getWorkChannelsFail' });
      }
      ctx.helper.success({ ctx, res: result && result.channels });
    } catch (error) {
      ctx.helper.error({ ctx, errType: 'getWorkChannelsFail' });
    }
  }

  @checkPermission({ casl: 'Channels', mongoose: 'Work' }, 'workNoPermission', {
    key: 'channels.id',
  })
  async updateChannels() {
    const { ctx, app } = this;
    const { id } = ctx.params;
    const { name } = ctx.request.body;
    try {
      const result = await ctx.model.Work.findOneAndUpdate(
        { 'channels.id': id },
        {
          $set: {
            'channels.$.name': name,
          },
        }
      );
      if (!result) {
        return ctx.helper.error({ ctx, errType: 'updateChannelsFail' });
      }
      ctx.helper.success({ ctx, res: { name } });
    } catch (error) {
      ctx.helper.error({ ctx, errType: 'updateChannelsFail' });
    }
  }

  @checkPermission({ casl: 'Channels', mongoose: 'Work' }, 'workNoPermission')
  async deleteChannels() {
    const { ctx, app } = this;
    const { id } = ctx.params;
    try {
      const result = await ctx.model.Work.findOneAndUpdate(
        { 'channels.id': id },
        {
          $pull: {
            channels: {
              id,
            },
          },
        },
        { new: true }
      );
      if (!result) {
        return ctx.helper.error({ ctx, errType: 'deleteChannelsFail' });
      }
      ctx.helper.success({ ctx, res: result.channels });
    } catch (error) {
      ctx.helper.error({ ctx, errType: 'deleteChannelsFail' });
    }
  }

  @inputValidator(workCreateRules, 'workValidationFailed')
  @checkPermission('Work', 'workNoPermission')
  async createWork() {
    const { ctx, service } = this;
    const workData = await service.work.createEmptyWork(ctx.request.body);
    ctx.helper.success({ ctx, res: workData });
  }

  async copyWork() {
    const { ctx } = this;
    const { id } = ctx.params;
    try {
      const res = await ctx.service.work.copyWork(parseInt(id));
      ctx.helper.success({ ctx, res });
    } catch (e) {
      return ctx.helper.error({ ctx, errType: 'workNoPublicFail' });
    }
  }

  @checkPermission('Work', 'workNoPermission')
  async myWork() {
    const { ctx } = this;
    const { id } = ctx.params;
    const res = await this.ctx.model.Work.findOne({ id }).lean();
    ctx.helper.success({ ctx, res });
  }

  async template() {
    const { ctx } = this;
    const { id } = ctx.params;
    const res = await this.ctx.model.Work.findOne({ id }).lean();
    if (!res || !res.isPublic || !res.isTemplate) {
      return ctx.helper.error({ ctx, errType: 'workNoPublicFail' });
    }
    ctx.helper.success({ ctx, res });
  }

  async myList() {
    const { ctx } = this;
    const userId = ctx.state.user._id;
    const { pageIndex, pageSize, isTemplate, title } = ctx.query;
    const findConditon = {
      user: userId,
      ...(title && { title: { $regex: title, $options: 'i' } }),
      ...(isTemplate && { isTemplate: !!parseInt(isTemplate) }),
    };
    const listCondition: IndexCondition = {
      select: 'id author copiedCount coverImg desc title user isHot createdAt',
      populate: { path: 'user', select: 'username nickName picture' },
      find: findConditon,
      ...(pageIndex && { pageIndex: parseInt(pageIndex) }),
      ...(pageSize && { pageSize: parseInt(pageSize) }),
    };
    const res = await ctx.service.work.getList(listCondition);
    ctx.helper.success({ ctx, res });
  }

  async templateList() {
    const { ctx, service } = this;
    const { pageSize, pageIndex } = ctx.query;
    const listCondition: IndexCondition = {
      select: 'id author copiedCount coverImg desc title user isHot createdAt',
      populate: { path: 'user', select: 'username nickName picture' },
      find: { isPublic: true, isTemplate: true },
      ...(pageIndex && { pageIndex: parseInt(pageIndex) }),
      ...(pageSize && { pageSize: parseInt(pageSize) }),
    };
    const res = await service.work.getList(listCondition);
    ctx.helper.success({ ctx, res });
  }

  @checkPermission('Work', 'workNoPermission')
  async update() {
    const { ctx, service } = this;
    const { id } = ctx.params;
    const payload = ctx.request.body;
    const workData = await ctx.model.Work.findOneAndUpdate({ id }, payload, {
      new: true,
    }).lean();
    ctx.helper.success({ ctx, res: workData });
  }

  @checkPermission('Work', 'workNoPermission')
  async delete() {
    const { ctx, service } = this;
    const { id } = ctx.params;
    const workData = await ctx.model.Work.findOneAndDelete({ id })
      .select('_id id title')
      .lean();
    ctx.helper.success({ ctx, res: workData });
  }

  @checkPermission('Work', 'workNoPermission', { action: 'publish' })
  async publish(isTmeplate: boolean) {
    const { ctx, service } = this;
    const url = await this.service.work.publish(
      parseInt(ctx.params.id),
      isTmeplate
    );
    ctx.helper.success({ ctx, res: { url } });
  }

  async publishWork() {
    await this.publish(false);
  }

  async publishTemplate() {
    await this.publish(true);
  }
}
