<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  imgItem: {
    type: Object,
    default: () => ({}),
  },
})

const imgUrl = ref('')

function getImageUrl(item: any): string {
  if (!item || !item.url) {
    return ''
  }
  return item.url
}

// 监听 imgItem 变化
watch(
  () => props.imgItem,
  (newVal) => {
    imgUrl.value = getImageUrl(newVal)
  },
  { deep: true, immediate: true },
)

onMounted(() => {
  imgUrl.value = getImageUrl(props.imgItem)
})
</script>

<template>
  <img v-if="imgUrl" :src="imgUrl" alt="Image" class="object-cover h-full rounded-xl">
</template>

<style lang='scss' scoped>

</style>
