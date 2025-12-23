// i18n配置
import { createI18n } from 'vue-i18n'
import en from './en'
import zhCn from './zhCn'

export type Language = 'en' | 'zhCn'

export const languageList = [
  {
    key: 'zhCn',
    name: '中文',
    flag: 'zh-cn',
  },
  {
    key: 'en',
    name: 'English',
    flag: 'en-us',
  },
]
export const browserLanguage = navigator.language.toLowerCase().includes('zh') ? 'zhCn' : 'en'
// 创建i18n（使用浏览器语言作为默认值，实际语言会在加载配置后更新）
const i18n = createI18n({
  locale: browserLanguage,
  legacy: false,
  messages: {
    zhCn,
    en,
  },
})

export default i18n
