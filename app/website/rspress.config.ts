import {defineConfig, type UserConfig} from 'rspress/config'
import * as path from 'node:path'

const config: UserConfig = defineConfig({
  title:"zyl zyl-rhooks",
  root:path.resolve(import.meta.dirname, 'docs'),
  icon:"https://miaomaedu.com/favicon.ico",
  route:{
    // hooks 目录下的 tsx 是文档里引用的 demo 组件，不是页面，不要生成路由
    exclude:["hooks/**/*.tsx"]
  },
  logo:{
    light:"https://miaomaedu.com/favicon.ico",
    dark:"https://miaomaedu.com/favicon.ico"
  },
  themeConfig:{
    socialLinks:[
      {
        icon:"github",
        mode:"link",
        content:"https://github.com"
      }
    ]
  }
})

export default config
