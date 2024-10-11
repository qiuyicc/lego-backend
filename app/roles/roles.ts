import { createMongoAbility,AbilityBuilder } from '@casl/ability'
import { Document } from 'mongoose'
import { UserProps } from '../model/user'

export default function defineRules(user: UserProps & Document<any,any,UserProps>) {
    const { can,build } = new AbilityBuilder(createMongoAbility)
    if(user){
        if(user.role === 'admin'){
            can('manage', 'all')
        }else {
            can('read','User',{_id:user._id})
            can('update','User',['nickName','picture'],{_id:user._id})

            can('create','Work',['title','desc','content','coverImg'])
            can('read','Work',{user:user._id})
            can('update','Work',['title','desc','content','coverImg'],{user:user._id})
            can('delete','Work',{user:user._id})
            can('publish','Work',{user:user._id})

            can('create','Channels',['name','workId'],{user:user._id})
            can('read','Channels',{user:user._id})
            can('update','Channels',['name'],{user:user._id})
            can('delete','Channels',{user:user._id})
        }
    }
    return build()  
}

