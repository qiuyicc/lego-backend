#!/bin/bash
#shell 脚本中发生错误，则停止执行并退出
set -e

mongosh <<EOF
use admin
db.auth('$MONGO_INSERT_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD')
use lego
db.createUser({user: '$MONGO_DB_USERNAME', pwd: '$MONGO_DB_PASSWORD', roles: [{role: 'readWrite', db: 'lego'}]})
db.createCollection('works')
db.works.insertMany([
  {
    id: 19,
    title: '1024 程序员日',
    desc: '1024 程序员日',
    author: '19981457868',
    coverImg: 'http://static-dev.imooc-lego.com/imooc-test/sZHlgv.png',
    copiedCount: 737,
    isHot: true,
    isTemplate: true,
    isPublic: true,
    createdAt: '2020-11-26T09:27:19.000Z',
  }
])
EOF