import { Application } from 'egg';
import { Schema, ObjectId } from 'mongoose';
const AutoIncrementFactory = require('mongoose-sequence');

interface ChannelProps {
  name:string;
  id:string
}

export interface WorkProps {
  id?: number;
  uuid: string;
  title: string;
  desc: string;
  coverImg?: string;
  content?: { [key: string]: any };
  isTemplate?: boolean;
  isPublic?: boolean;
  isHot?: boolean;
  author: string;
  copiedCount: number;
  status?: 0 | 1 | 2;
  user: ObjectId;
  latestPublishAt?: Date;
  channels?:ChannelProps[]
}

function initWorkModel (app: Application){
  const AutoIncrement = AutoIncrementFactory(app.mongoose);
  const workSchema = new Schema<WorkProps>(
    {
      uuid: { type: String, unique: true },
      title: { type: String },
      desc: { type: String },
      coverImg: { type: String },
      content: { type: Object },
      isTemplate: { type: Boolean },
      isPublic: { type: Boolean },
      isHot: { type: Boolean },
      author: { type: String },
      copiedCount: { type: Number, default: 0 },
      status: { type: Number, default: 1 },
      channels: { type: Array },
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      latestPublishAt: { type: Date },
    },
    { timestamps: true }
  );
  workSchema.plugin(AutoIncrement, { inc_field: 'id',id: 'work_id_counter' });//id用于跟踪 id 字段的下一个可用值
  return app.mongoose.model<WorkProps>("Work", workSchema);
};
export default initWorkModel;