import { Application } from 'egg';
import { Schema } from 'mongoose';
const AutoIncrementFactory = require('mongoose-sequence');

export interface UserProps {
  username: string;
  password: string;
  email?: string;
  nickName?: string;
  picture?: string;
  phoneNumber?: string;
  createAt: Date;
  updateAt: Date;
  type: 'email' | 'phone' | 'oauth';
  provider?: 'gitee';
  oauthID?: string;
  role?: 'admin' | 'normal';
}

function initUserModel(app: Application) {
  const AutoIncrement = AutoIncrementFactory(app.mongoose);
  const userSchema = new Schema<UserProps>(
    {
      username: { type: String, required: true, unique: true },
      password: { type: String },
      email: { type: String },
      nickName: { type: String },
      picture: { type: String },
      phoneNumber: { type: String },
      type: { type: String, default: 'email' },
      provider: { type: String },
      oauthID: { type: String },
      role: { type: String, default: 'normal' },
    },
    {
      timestamps: true,
      toJSON: {
        transform: (doc, ret) => {
          delete ret.password;
          delete ret.__v;
        },
      },
    }
  ); //timestamps: true 自动添加createdAt和updatedAt字段
  userSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'user_id_counter' }); //id用于跟踪 id 字段的下一个可用值
  return app.mongoose.model<UserProps>('User', userSchema);
}

export default initUserModel;
