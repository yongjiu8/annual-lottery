<script setup lang='ts'>
import type { IImage } from '@/types/storeType'
import ImageSync from '@/components/ImageSync/index.vue'
import useStore from '@/store'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const globalConfig = useStore().globalConfig
const { getImageList: localImageList } = storeToRefs(globalConfig)
const limitType = ref('image/*')
const imgUploadToast = ref(0) // 0是不显示，1是成功，2是失败,3是不是图片
const isUploading = ref(false)

// 服务器地址
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3456/api'

async function handleFileChange(e: Event) {
  const file = ((e.target as HTMLInputElement).files as FileList)[0]
  if (!file) return

  const isImage = /image*/.test(file.type)
  if (!isImage) {
    imgUploadToast.value = 3
    return
  }

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      // 添加到图片列表，url 使用服务器返回的路径
      globalConfig.addImage({
        id: result.data.id,
        name: result.data.name,
        url: `${API_BASE}${result.data.url}`,
      })
      imgUploadToast.value = 1
    }
    else {
      imgUploadToast.value = 2
    }
  }
  catch (error) {
    console.error('Upload failed:', error)
    imgUploadToast.value = 2
  }
  finally {
    isUploading.value = false
    // 清空 input 以便重复上传同一文件
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function removeImage(item: IImage) {
  try {
    // 如果是服务器上的图片，调用删除 API
    if (item.url && item.url.includes('/uploads/')) {
      await fetch(`${API_BASE}/upload/image/${item.id}`, {
        method: 'DELETE',
      })
    }
    globalConfig.removeImage(item.id)
  }
  catch (error) {
    console.error('Delete failed:', error)
    // 即使删除失败也从列表中移除
    globalConfig.removeImage(item.id)
  }
}

watch(() => imgUploadToast.value, (val) => {
  if (val !== 0) {
    setTimeout(() => {
      imgUploadToast.value = 0
    }, 2000)
  }
})
</script>

<template>
  <div class="toast toast-top toast-end">
    <div v-if="imgUploadToast === 2" class="alert alert-error">
      <span>{{ t('error.uploadFail') }}</span>
    </div>
    <div v-if="imgUploadToast === 1" class="alert alert-success">
      <span>{{ t('error.uploadSuccess') }}</span>
    </div>
    <div v-if="imgUploadToast === 3" class="alert alert-error">
      <span>{{ t('error.notImage') }}</span>
    </div>
  </div>

  <div>
    <div class="">
      <label for="explore">
        <input
          id="explore" type="file" class="" style="display: none" :accept="limitType"
          @change="handleFileChange"
        >
        <span class="btn btn-primary btn-sm" :class="{ 'loading': isUploading }">
          {{ isUploading ? '' : t('button.upload') }}
        </span>
      </label>
    </div>
    <ul class="p-0">
      <li v-for="item in localImageList" :key="item.id" class="mb-3">
        <div class="flex items-center gap-8">
          <div class="avatar h-14">
            <div class="w-12 h-12 mask mask-squircle hover:w-14 hover:h-14">
              <ImageSync :img-item="item" />
            </div>
          </div>
          <div class="w-64">
            <div class="overflow-hidden font-bold whitespace-nowrap text-ellipsis">
              {{ item.name }}
            </div>
          </div>
          <div>
            <button class="btn btn-error btn-xs" @click="removeImage(item)">
              {{ t('button.delete') }}
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang='scss' scoped></style>
