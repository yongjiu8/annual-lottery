<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useThemeStore, type ITheme } from '@/store/theme'
import { useGlobalConfig } from '@/store/globalConfig'
import { usePersonConfig } from '@/store/personConfig'
import { usePrizeConfig } from '@/store/prizeConfig'
import { useToast } from 'vue-toast-notification'
import { verifyThemePassword } from '@/api/lottery'
import confetti from 'canvas-confetti'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const themeStore = useThemeStore()
const globalConfig = useGlobalConfig()
const personConfig = usePersonConfig()
const prizeConfig = usePrizeConfig()

const showCreateModal = ref(false)
const showDeleteConfirm = ref(false)
const showPasswordModal = ref(false)
const showEnterPasswordModal = ref(false)
const themeToDelete = ref<ITheme | null>(null)
const themeToEnter = ref<ITheme | null>(null)
const deletePassword = ref('')
const enterPassword = ref('')
const isAnimating = ref(false)

// 搜索和分页
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(6)

// 表单数据
const formData = ref({
  name: '',
  description: '',
  password: '',
})

// 获取所有主题
const allThemes = computed(() => themeStore.getAllThemes)

// 过滤后的主题列表
const filteredThemes = computed(() => {
  if (!searchKeyword.value.trim()) {
    return allThemes.value
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return allThemes.value.filter(theme => 
    theme.name.toLowerCase().includes(keyword) ||
    (theme.description && theme.description.toLowerCase().includes(keyword))
  )
})

// 总页数
const totalPages = computed(() => Math.ceil(filteredThemes.value.length / pageSize.value))

// 当前页的主题
const themes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredThemes.value.slice(start, end)
})

// 搜索时重置到第一页
watch(searchKeyword, () => {
  currentPage.value = 1
})

// 分页方法
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const prevPage = () => goToPage(currentPage.value - 1)
const nextPage = () => goToPage(currentPage.value + 1)

// 表单验证
const isFormValid = computed(() => 
  formData.value.name.trim() !== '' && formData.value.password.trim() !== ''
)

// 打开创建弹窗
const openCreateModal = () => {
  formData.value = { name: '', description: '', password: '' }
  showCreateModal.value = true
}

// 关闭创建弹窗
const closeCreateModal = () => {
  showCreateModal.value = false
}

// 创建主题
const handleCreate = async () => {
  if (!formData.value.name.trim()) {
    toast.open({
      message: t('entry.pleaseEnterName'),
      type: 'warning',
      position: 'top-right',
    })
    return
  }
  
  if (!formData.value.password.trim()) {
    toast.open({
      message: t('entry.pleaseEnterPassword'),
      type: 'warning',
      position: 'top-right',
    })
    return
  }

  const newTheme = await themeStore.createTheme(
    formData.value.name.trim(),
    formData.value.description.trim(),
    formData.value.password.trim()
  )

  toast.open({
    message: t('entry.createSuccess'),
    type: 'success',
    position: 'top-right',
  })

  closeCreateModal()
  doEnterTheme(newTheme, true) // 标记为新主题
}

// 点击进入主题（需要验证密码）
const enterTheme = async (theme: ITheme) => {
  themeToEnter.value = theme
  enterPassword.value = ''
  showEnterPasswordModal.value = true
}

// 验证密码并进入主题
const handleEnterWithPassword = async () => {
  if (!themeToEnter.value) return
  
  const isValid = await verifyThemePassword(themeToEnter.value.id, enterPassword.value)
  if (!isValid) {
    toast.open({
      message: t('entry.wrongPassword'),
      type: 'error',
      position: 'top-right',
    })
    return
  }
  
  showEnterPasswordModal.value = false
  doEnterTheme(themeToEnter.value, false)
}

// 实际进入主题
const doEnterTheme = async (theme: ITheme, isNewTheme = false) => {
  isAnimating.value = true
  themeStore.selectTheme(theme.id)
  
  // 如果是新创建的主题，先初始化数据并设置主题名称为 topTitle
  if (isNewTheme) {
    // 重置为默认数据
    personConfig.reset()
    prizeConfig.resetDefault()
    globalConfig.reset(theme.name)
    
    // 设置主题名称为 topTitle
    globalConfig.setTopTitle(theme.name)
    
    // 保存到服务器
    await personConfig.saveToTheme()
    await prizeConfig.saveToTheme()
    await globalConfig.saveToTheme()
  } else {
    // 已有主题，从存储加载数据
    await personConfig.loadFromTheme()
    await prizeConfig.loadFromTheme()
    await globalConfig.loadFromTheme()
  }
  
  // 触发庆祝动画
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  })

  setTimeout(() => {
    // 跳转到带主题ID的URL
    router.push(`/t/${theme.id}`)
  }, 500)
}

// 确认删除
const confirmDelete = (theme: ITheme, event: Event) => {
  event.stopPropagation()
  themeToDelete.value = theme
  showDeleteConfirm.value = true
}

// 确认删除（打开密码输入框）
const handleDelete = () => {
  showDeleteConfirm.value = false
  deletePassword.value = ''
  showPasswordModal.value = true
}

// 验证密码并删除
const handleDeleteWithPassword = async () => {
  if (!themeToDelete.value) return
  
  const result = await themeStore.deleteTheme(themeToDelete.value.id, deletePassword.value)
  
  if (!result.success) {
    toast.open({
      message: t('entry.wrongPassword'),
      type: 'error',
      position: 'top-right',
    })
    return
  }
  
  toast.open({
    message: t('entry.deleteSuccess'),
    type: 'success',
    position: 'top-right',
  })
  
  showPasswordModal.value = false
  themeToDelete.value = null
  
  // 如果当前页没有数据了，跳转到上一页
  if (themes.value.length === 0 && currentPage.value > 1) {
    currentPage.value = currentPage.value - 1
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5)
}

onMounted(() => {
  // 允许页面滚动
  document.body.style.overflowY = 'auto'
  document.documentElement.style.overflowY = 'auto'
})

// 离开页面时恢复
onUnmounted(() => {
  document.body.style.overflowY = 'hidden'
  document.documentElement.style.overflowY = 'hidden'
})
</script>

<template>
  <div class="entry-page">
    <!-- 背景动画 -->
    <div class="bg-animation">
      <div class="stars"></div>
      <div class="stars2"></div>
      <div class="stars3"></div>
    </div>

    <!-- 主内容 -->
    <div class="entry-content">
      <div class="header">
        <h1 class="title">🎉 {{ t('entry.title') }}</h1>
        <p class="subtitle">{{ t('entry.subtitle') }}</p>
      </div>

      <!-- 主题列表 -->
      <div class="themes-section">
        <div class="section-header">
          <h2>{{ t('entry.myThemes') }}</h2>
          <div class="header-actions">
            <!-- 搜索框 -->
            <div class="search-box" v-if="allThemes.length > 0">
              <span class="search-icon">🔍</span>
              <input
                v-model="searchKeyword"
                type="text"
                :placeholder="t('entry.searchPlaceholder')"
                class="search-input"
              />
              <button 
                v-if="searchKeyword" 
                class="clear-search" 
                @click="searchKeyword = ''"
              >×</button>
            </div>
            <button class="create-btn" @click="openCreateModal">
              <span class="icon">+</span>
              {{ t('entry.createTheme') }}
            </button>
          </div>
        </div>

        <div v-if="allThemes.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>{{ t('entry.noThemes') }}</p>
          <button class="create-first-btn" @click="openCreateModal">
            {{ t('entry.createFirst') }}
          </button>
        </div>

        <template v-else>
          <!-- 搜索结果为空 -->
          <div v-if="filteredThemes.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>{{ t('entry.noSearchResults') }}</p>
          </div>

          <template v-else>
            <!-- 主题统计 -->
            <div class="themes-stats">
              <span>{{ t('entry.totalThemes', { count: filteredThemes.length }) }}</span>
              <span v-if="searchKeyword">· {{ t('entry.searchResults') }}</span>
            </div>

            <div class="themes-grid">
              <div
                v-for="theme in themes"
                :key="theme.id"
                class="theme-card"
                @click="enterTheme(theme)"
              >
                <div class="card-header">
                  <div class="theme-icon">🎯</div>
                  <button 
                    class="delete-btn" 
                    @click="confirmDelete(theme, $event)"
                    :title="t('button.delete')"
                  >
                    ×
                  </button>
                </div>
                <h3 class="theme-name">{{ theme.name }}</h3>
                <p class="theme-desc">{{ theme.description || t('entry.noDescription') }}</p>
                <div class="theme-meta">
                  <span class="meta-item">
                    📅 {{ formatDate(theme.createdAt) }}
                  </span>
                </div>
                <div class="enter-hint">
                  {{ t('entry.clickToEnter') }} →
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div v-if="totalPages > 1" class="pagination">
              <button 
                class="page-btn" 
                :disabled="currentPage === 1"
                @click="prevPage"
              >
                ‹ {{ t('entry.prevPage') }}
              </button>
              
              <div class="page-numbers">
                <button
                  v-for="page in totalPages"
                  :key="page"
                  class="page-num"
                  :class="{ active: page === currentPage }"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>
              
              <button 
                class="page-btn" 
                :disabled="currentPage === totalPages"
                @click="nextPage"
              >
                {{ t('entry.nextPage') }} ›
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>

    <!-- 创建主题弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
          <div class="modal-container">
            <div class="modal-header">
              <h3>{{ t('entry.createTheme') }}</h3>
              <button class="close-btn" @click="closeCreateModal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>{{ t('entry.themeName') }} <span class="required">*</span></label>
                <input
                  v-model="formData.name"
                  type="text"
                  :placeholder="t('entry.themeNamePlaceholder')"
                  class="form-input"
                  maxlength="30"
                  @keyup.enter="handleCreate"
                />
              </div>
              <div class="form-group">
                <label>{{ t('entry.themeDescription') }}</label>
                <textarea
                  v-model="formData.description"
                  :placeholder="t('entry.themeDescPlaceholder')"
                  class="form-input form-textarea"
                  maxlength="100"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-group">
                <label>{{ t('entry.themePassword') }} <span class="required">*</span></label>
                <input
                  v-model="formData.password"
                  type="password"
                  :placeholder="t('entry.themePasswordPlaceholder')"
                  class="form-input"
                  maxlength="20"
                />
                <p class="form-hint">{{ t('entry.passwordHint') }}</p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="closeCreateModal">
                {{ t('button.cancel') }}
              </button>
              <button
                class="submit-btn"
                @click="handleCreate"
                :disabled="!isFormValid"
              >
                {{ t('entry.create') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
          <div class="modal-container confirm-modal">
            <div class="modal-header">
              <h3>{{ t('dialog.titleTip') }}</h3>
            </div>
            <div class="modal-body">
              <p class="confirm-text">
                {{ t('entry.confirmDelete', { name: themeToDelete?.name }) }}
              </p>
              <p class="warning-text">⚠️ {{ t('entry.deleteWarning') }}</p>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="showDeleteConfirm = false">
                {{ t('button.cancel') }}
              </button>
              <button class="delete-confirm-btn" @click="handleDelete">
                {{ t('button.delete') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 删除密码验证弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
          <div class="modal-container confirm-modal">
            <div class="modal-header">
              <h3>🔐 {{ t('entry.enterPassword') }}</h3>
              <button class="close-btn" @click="showPasswordModal = false">&times;</button>
            </div>
            <div class="modal-body">
              <p class="confirm-text">{{ t('entry.deletePasswordHint') }}</p>
              <div class="form-group">
                <input
                  v-model="deletePassword"
                  type="password"
                  :placeholder="t('entry.passwordPlaceholder')"
                  class="form-input"
                  @keyup.enter="handleDeleteWithPassword"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="showPasswordModal = false">
                {{ t('button.cancel') }}
              </button>
              <button class="delete-confirm-btn" @click="handleDeleteWithPassword">
                {{ t('button.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 进入主题密码验证弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEnterPasswordModal" class="modal-overlay" @click.self="showEnterPasswordModal = false">
          <div class="modal-container confirm-modal">
            <div class="modal-header">
              <h3>🔐 {{ t('entry.enterPassword') }}</h3>
              <button class="close-btn" @click="showEnterPasswordModal = false">&times;</button>
            </div>
            <div class="modal-body">
              <p class="confirm-text">{{ t('entry.enterPasswordHint', { name: themeToEnter?.name }) }}</p>
              <div class="form-group">
                <input
                  v-model="enterPassword"
                  type="password"
                  :placeholder="t('entry.passwordPlaceholder')"
                  class="form-input"
                  @keyup.enter="handleEnterWithPassword"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="showEnterPasswordModal = false">
                {{ t('button.cancel') }}
              </button>
              <button class="submit-btn" @click="handleEnterWithPassword">
                {{ t('entry.enter') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>


<style scoped lang="scss">
.entry-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
}

// 背景星星动画
.bg-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.stars, .stars2, .stars3 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
}

.stars {
  background-image: radial-gradient(2px 2px at 20px 30px, #eee, transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent);
  background-size: 200px 200px;
  animation: twinkle 5s ease-in-out infinite;
}

.stars2 {
  background-image: radial-gradient(1px 1px at 50px 80px, #fff, transparent),
    radial-gradient(1px 1px at 100px 150px, rgba(255,255,255,0.7), transparent),
    radial-gradient(2px 2px at 180px 50px, #eee, transparent);
  background-size: 250px 250px;
  animation: twinkle 7s ease-in-out infinite;
  animation-delay: 1s;
}

.stars3 {
  background-image: radial-gradient(1px 1px at 30px 100px, rgba(255,255,255,0.6), transparent),
    radial-gradient(2px 2px at 120px 20px, #fff, transparent);
  background-size: 300px 300px;
  animation: twinkle 9s ease-in-out infinite;
  animation-delay: 2s;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.entry-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px 80px;
}

.header {
  text-align: center;
  margin-bottom: 60px;
}

.title {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 16px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientMove 3s ease infinite;
  background-size: 200% auto;
}

@keyframes gradientMove {
  0% { background-position: 0% center; }
  50% { background-position: 100% center; }
  100% { background-position: 0% center; }
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.themes-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  
  h2 {
    color: #fff;
    font-size: 24px;
    margin: 0;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  
  .search-icon {
    position: absolute;
    left: 12px;
    font-size: 14px;
    pointer-events: none;
  }
  
  .search-input {
    width: 220px;
    padding: 10px 36px 10px 36px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    transition: all 0.3s;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
    
    &:focus {
      outline: none;
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
      width: 260px;
    }
  }
  
  .clear-search {
    position: absolute;
    right: 10px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(255, 107, 107, 0.6);
    }
  }
}

.themes-stats {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin-bottom: 20px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  
  .icon {
    font-size: 18px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
    margin: 0 0 24px;
  }
}

.create-first-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

// 分页样式
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.page-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.2);
    border-color: #667eea;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-num {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
    color: white;
    font-weight: 600;
  }
}

.theme-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(102, 126, 234, 0.5);
    
    &::before {
      left: 100%;
    }
    
    .enter-hint {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.theme-icon {
  font-size: 36px;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.2);
  border: none;
  color: #ff6b6b;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0.6;
  
  &:hover {
    opacity: 1;
    background: #ff6b6b;
    color: white;
    transform: scale(1.1);
  }
}

.theme-name {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
}

.theme-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin: 0 0 16px;
  line-height: 1.5;
  min-height: 42px;
}

.theme-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

.enter-hint {
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s;
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-container {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    margin: 0;
    color: #fff;
    font-size: 20px;
  }
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: all 0.2s;
  
  &:hover {
    color: #ff6b6b;
    transform: rotate(90deg);
  }
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .required {
    color: #ff6b6b;
  }
  
  .form-hint {
    margin: 8px 0 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
}

.form-textarea {
  resize: none;
  font-family: inherit;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn,
.submit-btn,
.delete-confirm-btn {
  flex: 1;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.delete-confirm-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  border: none;
  color: white;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);
  }
}

.confirm-modal {
  max-width: 400px;
}

.confirm-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  margin: 0 0 12px;
}

.warning-text {
  color: #ff6b6b;
  font-size: 14px;
  margin: 0;
}

// Modal transitions
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
