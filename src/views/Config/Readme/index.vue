<script setup lang='ts'>
import i18n from '@/locales/i18n'
import markdownit from 'markdown-it'
import { onMounted, ref } from 'vue'

const md = markdownit()
const readmeHtml = ref('')
function readMd() {
  fetch(`/${i18n.global.t('data.readmeName')}`)
    .then(res => res.text())
    .then((res) => {
      readmeHtml.value = md.render(res)
    })
}

onMounted(() => {
  readMd()
})
</script>

<template>
  <div class="w-3/4 mb-10 ml-3">
    <div v-dompurify-html="readmeHtml" class="markdown-body markdown-dark" />
  </div>
</template>

<style scoped>
.markdown-dark {
  --color-fg-default: #e6edf3;
  --color-fg-muted: #848d97;
  --color-fg-subtle: #6e7681;
  --color-canvas-default: transparent;
  --color-canvas-subtle: #161b22;
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-accent-fg: #58a6ff;
  color: #e6edf3;
}

.markdown-dark :deep(h1),
.markdown-dark :deep(h2),
.markdown-dark :deep(h3),
.markdown-dark :deep(h4),
.markdown-dark :deep(h5),
.markdown-dark :deep(h6) {
  color: #e6edf3;
  border-bottom-color: #30363d;
}

.markdown-dark :deep(p),
.markdown-dark :deep(li),
.markdown-dark :deep(td),
.markdown-dark :deep(th) {
  color: #c9d1d9;
}

.markdown-dark :deep(a) {
  color: #58a6ff;
}

.markdown-dark :deep(code) {
  background-color: rgba(110, 118, 129, 0.4);
  color: #e6edf3;
}

.markdown-dark :deep(pre) {
  background-color: #161b22;
}

.markdown-dark :deep(blockquote) {
  color: #8b949e;
  border-left-color: #3b434b;
}

.markdown-dark :deep(hr) {
  background-color: #30363d;
}

.markdown-dark :deep(table) {
  border-color: #30363d;
}

.markdown-dark :deep(tr) {
  background-color: transparent;
  border-color: #30363d;
}

.markdown-dark :deep(tr:nth-child(2n)) {
  background-color: rgba(110, 118, 129, 0.1);
}
</style>
