<script setup lang="ts">
import ToTop from '@/components/ToTop/index.vue'
import { useScroll } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isThemeVerified } from '@/store/theme'

const mainContainer = ref<HTMLElement | null>(null)
const route = useRoute()
const router = useRouter()

const { y } = useScroll(mainContainer)

function scrollToTop() {
  y.value = 0
}

// 监听路由参数变化，验证主题权限（异步验证服务端 token）
watch(
  () => route.params.themeId,
  async (newThemeId) => {
    if (newThemeId && typeof newThemeId === 'string') {
      // 异步检查该主题是否已通过密码验证
      const verified = await isThemeVerified(newThemeId)
      if (!verified) {
        // 未验证，跳转到入口页面进行密码验证
        router.replace({ name: 'Entry', query: { redirect: route.fullPath, themeId: newThemeId } })
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="w-screen">
    <!-- <header class="shadow-2xl head-container h-14">
      <Header></Header>
    </header> -->
    <ToTop v-if="y > 400" @click="scrollToTop" />
    <main ref="mainContainer" class="box-content w-screen h-screen overflow-x-hidden overflow-y-auto main-container">
      <router-view class="h-full main-container-content" />
    </main>
    <!-- <footer class="w-screen footer-container">
      <Footer></Footer>
    </footer> -->
  </div>
</template>

<style scoped lang="scss">

</style>
