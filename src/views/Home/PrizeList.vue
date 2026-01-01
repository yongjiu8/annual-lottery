<script setup lang='ts'>
import type { IPrizeConfig } from '../../types/storeType'
import defaultPrizeImage from '@/assets/images/龙.png'
import ImageSync from '@/components/ImageSync/index.vue'

import EditSeparateDialog from '@/components/NumberSeparate/EditSeparateDialog.vue'
import i18n from '@/locales/i18n'
import useStore from '@/store'

import { storeToRefs } from 'pinia'

import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  textSize: {
    type: Number,
    default: 30,
  },
})

const { t } = useI18n()
const prizeConfig = useStore().prizeConfig
const globalConfig = useStore().globalConfig
const system = useStore().system
const { getPrizeConfig: localPrizeList, getCurrentPrize: currentPrize, getTemporaryPrize: temporaryPrize } = storeToRefs(prizeConfig)
const { getIsShowPrizeList: isShowPrizeList, getImageList: localImageList } = storeToRefs(globalConfig)
const { getIsMobile: isMobile } = storeToRefs(system)
const prizeListRef = ref()
const prizeListContainerRef = ref()

const temporaryPrizeRef = ref()
const selectedPrize = ref<IPrizeConfig | null>()

// 奖品预览弹窗
const showPrizePreview = ref(false)
const previewPrize = ref<IPrizeConfig | null>(null)

// 显示奖品预览
function showPrizeDetail(item: IPrizeConfig) {
  previewPrize.value = item
  showPrizePreview.value = true
}

// 关闭奖品预览
function closePrizePreview() {
  showPrizePreview.value = false
  previewPrize.value = null
}

// 获取prizeListRef高度
function getPrizeListHeight() {
  let height = 200
  if (prizeListRef.value) {
    height = (prizeListRef.value as HTMLElement).offsetHeight
  }

  return height
}
const prizeShow = ref(JSON.parse(JSON.stringify(isShowPrizeList.value)))

function addTemporaryPrize() {
  temporaryPrizeRef.value.showModal()
}

function deleteTemporaryPrize() {
  temporaryPrize.value.isShow = false
  prizeConfig.setTemporaryPrize(temporaryPrize.value)
}
function submitTemporaryPrize() {
  if (!temporaryPrize.value.name || !temporaryPrize.value.count) {
    // eslint-disable-next-line no-alert
    alert(i18n.global.t('error.completeInformation'))
    return
  }
  temporaryPrize.value.isShow = true
  temporaryPrize.value.id = new Date().getTime().toString()
  prizeConfig.setCurrentPrize(temporaryPrize.value)
}
function selectPrize(item: IPrizeConfig) {
  selectedPrize.value = item
  selectedPrize.value.isUsedCount = 0
  selectedPrize.value.isUsed = false

  if (selectedPrize.value.separateCount.countList.length > 1) {
    return
  }
  selectedPrize.value.separateCount = {
    enable: true,
    countList: [
      {
        id: '0',
        count: item.count,
        isUsedCount: 0,
      },
    ],
  }
}
function submitData(value: any) {
  selectedPrize.value!.separateCount.countList = value
  selectedPrize.value = null
}
function changePersonCount() {
  temporaryPrize.value.separateCount.countList = []
}
function setCurrentPrize() {
  for (let i = 0; i < localPrizeList.value.length; i++) {
    if (localPrizeList.value[i].isUsedCount < localPrizeList.value[i].count) {
      prizeConfig.setCurrentPrize(localPrizeList.value[i])

      return
    }
  }
}
onMounted(() => {
  prizeListContainerRef.value.style.height = `${getPrizeListHeight()}px`
  setCurrentPrize()
})
</script>

<template>
  <div class="flex items-center">
    <dialog id="my_modal_1" ref="temporaryPrizeRef" class="border-none modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ t('dialog.titleTemporary') }}
        </h3>
        <div class="flex flex-col gap-3">
          <label class="flex w-full max-w-xs">
            <div class="label">
              <span class="label-text">{{ t('table.name') }}:</span>
            </div>
            <input
              v-model="temporaryPrize.name" type="text" :placeholder="t('placeHolder.name')"
              class="max-w-xs input-sm input input-bordered"
            >
          </label>
          <label class="flex w-full max-w-xs">
            <div class="label">
              <span class="label-text">{{ t('table.fullParticipation') }}</span>
            </div>
            <input
              type="checkbox" :checked="temporaryPrize.isAll"
              class="mt-2 border-solid checkbox checkbox-secondary border-1"
              @change="temporaryPrize.isAll = !temporaryPrize.isAll"
            >
          </label>
          <label class="flex w-full max-w-xs">
            <div class="label">
              <span class="label-text">{{ t('table.setLuckyNumber') }}</span>
            </div>
            <input
              v-model="temporaryPrize.count" type="number" :placeholder="t('placeHolder.winnerCount')" class="max-w-xs input-sm input input-bordered"
              @change="changePersonCount"
            >
          </label>
          <label class="flex w-full max-w-xs">
            <div class="label">
              <span class="label-text">{{ t('table.luckyPeopleNumber') }}</span>
            </div>
            <input
              v-model="temporaryPrize.isUsedCount" disabled type="number" :placeholder="t('placeHolder.winnerCount')"
              class="max-w-xs input-sm input input-bordered"
            >
          </label>
          <label v-if="temporaryPrize.separateCount" class="flex w-full max-w-xs">
            <div class="label">
              <span class="label-text">{{ t('table.onceNumber') }}</span>
            </div>
            <div class="flex justify-start h-full" @click="selectPrize(temporaryPrize)">
              <ul
                v-if="temporaryPrize.separateCount.countList.length"
                class="flex flex-wrap w-full h-full gap-1 p-0 pt-1 m-0 cursor-pointer"
              >
                <li
                  v-for="se in temporaryPrize.separateCount.countList"
                  :key="se.id" class="relative flex items-center justify-center w-8 h-8 bg-slate-600/60 separated"
                >
                  <div
                    class="flex items-center justify-center w-full h-full tooltip"
                    :data-tip="`${t('tooltip.doneCount') + se.isUsedCount}/${se.count}`"
                  >
                    <div
                      class="absolute left-0 z-50 h-full bg-blue-300/80"
                      :style="`width:${se.isUsedCount * 100 / se.count}%`"
                    />
                    <span>{{ se.count }}</span>
                  </div>
                </li>
              </ul>
              <button v-else class="btn btn-secondary btn-xs">{{ t('button.setting') }}</button>
            </div>
          </label>
          <label class="flex w-full max-w-xs">
            <div class="label">
              <span class="label-text">{{ t('table.image') }}</span>
            </div>
            <select v-model="temporaryPrize.picture" class="flex-1 w-12 select select-warning select-sm">
              <option v-if="temporaryPrize.picture.id" :value="{ id: '', name: '', url: '' }">❌
              </option>
              <option disabled selected>{{ t('table.selectPicture') }}</option>
              <option v-for="picItem in localImageList" :key="picItem.id" class="w-auto" :value="picItem">{{
                picItem.name }}
              </option>
            </select>
          </label>
        </div>
        <div class="modal-action">
          <form method="dialog" class="flex gap-3">
            <button class="btn btn-sm" @click="submitTemporaryPrize">
              {{ t('button.confirm') }}
            </button>
            <button class="btn btn-sm">
              {{ t('button.cancel') }}
            </button>
          </form>
        </div>
      </div>
    </dialog>
    <EditSeparateDialog
      :total-number="selectedPrize?.count" :separated-number="selectedPrize?.separateCount.countList"
      @submit-data="submitData"
    />
    <div ref="prizeListContainerRef">
      <div v-if="temporaryPrize.isShow" class="h-20 w-72" :class="temporaryPrize.isShow ? 'current-prize' : ''">
        <div class="relative flex flex-row items-center justify-between w-full h-full shadow-xl card bg-base-100">
          <div
            v-if="temporaryPrize.isUsed"
            class="absolute z-50 w-full h-full bg-gray-800/70 item-mask rounded-xl"
          />
          <figure class="w-10 h-10 rounded-xl">
            <ImageSync v-if="temporaryPrize.picture.url" :img-item="temporaryPrize.picture" />
            <img v-else :src="defaultPrizeImage" alt="Prize" class="object-cover h-full rounded-xl">
          </figure>
          <div class="items-center p-0 text-center card-body">
            <div class="tooltip tooltip-left" :data-tip="temporaryPrize.name">
              <h2 class="p-0 m-0 overflow-hidden w-28 card-title whitespace-nowrap text-ellipsis" :style="{ fontSize: `${props.textSize * 0.5}px` }">
                {{
                  temporaryPrize.name }}
              </h2>
            </div>
            <p class="absolute z-40 p-0 m-0 text-gray-300/80 mt-9" :style="{ fontSize: `${props.textSize * 0.4}px` }">
              {{ temporaryPrize.isUsedCount }}/{{
                temporaryPrize.count }}
            </p>
            <progress
              class="w-3/4 h-6 progress progress-primary" :value="temporaryPrize.isUsedCount"
              :max="temporaryPrize.count"
            />
            <!-- <p class="p-0 m-0">{{ item.isUsedCount }}/{{ item.count }}</p> -->
          </div>
          <div class="flex flex-col gap-1 mr-2">
            <div class="tooltip tooltip-left" :data-tip="t('tooltip.edit')">
              <div class="cursor-pointer hover:text-blue-400" @click="addTemporaryPrize">
                <svg-icon name="edit" />
              </div>
            </div>
            <div class="tooltip tooltip-left" :data-tip="t('tooltip.delete')">
              <div class="cursor-pointer hover:text-blue-400" @click="deleteTemporaryPrize">
                <svg-icon name="delete" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <transition name="prize-list" :appear="true">
        <div v-if="prizeShow && !isMobile && !temporaryPrize.isShow" class="flex items-center">
          <ul ref="prizeListRef" class="flex flex-col gap-1 p-2 rounded-xl bg-slate-500/50">
            <li
              v-for="item in localPrizeList" :key="item.id"
              :class="currentPrize.id === item.id ? 'current-prize' : ''"
            >
              <div
                v-if="item.isShow"
                class="relative flex flex-row items-center justify-between w-64 h-20 shadow-xl card bg-base-100"
              >
                <div
                  v-if="item.isUsed"
                  class="absolute z-50 w-full h-full bg-gray-800/70 item-mask rounded-xl"
                />
                <figure class="w-10 h-10 cursor-pointer rounded-xl" @click="showPrizeDetail(item)">
                  <ImageSync v-if="item.picture.url" :img-item="item.picture" />
                  <img
                    v-else :src="defaultPrizeImage" alt="Prize"
                    class="object-cover h-full rounded-xl"
                  >
                </figure>
                <div class="items-center p-0 text-center card-body">
                  <div class="tooltip tooltip-left" :data-tip="item.name">
                    <h2
                      class="w-24 p-0 m-0 overflow-hidden text-center card-title whitespace-nowrap text-ellipsis"
                      :style="{ fontSize: `${props.textSize * 0.5}px` }"
                    >
                      {{ item.name }}
                    </h2>
                  </div>
                  <p class="absolute z-40 p-0 m-0 text-gray-300/80 mt-9" :style="{ fontSize: `${props.textSize * 0.4}px` }">
                    {{ item.isUsedCount }}/{{
                      item.count }}
                  </p>
                  <progress
                    class="w-3/4 h-6 progress progress-primary" :value="item.isUsedCount"
                    :max="item.count"
                  />
                  <!-- <p class="p-0 m-0">{{ item.isUsedCount }}/{{ item.count }}</p> -->
                </div>
              </div>
            </li>
          </ul>
          <div class="flex flex-col gap-3">
            <div class="tooltip tooltip-right" :data-tip="t('tooltip.prizeList')">
              <div
                class="flex items-center w-6 h-8 rounded-r-lg cursor-pointer prize-option bg-slate-500/50"
                @click="prizeShow = !prizeShow"
              >
                <svg-icon name="arrow_left" class="w-full h-full" />
              </div>
            </div>
            <div class="tooltip tooltip-right" :data-tip="t('tooltip.addActivity')">
              <div
                class="flex items-center w-6 h-8 rounded-r-lg cursor-pointer prize-option bg-slate-500/50"
                @click="addTemporaryPrize"
              >
                <svg-icon name="add" class="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <transition name="prize-operate" :appear="true">
      <div v-show="!prizeShow" class="tooltip tooltip-right" :data-tip="t('tooltip.prizeList')">
        <div
          class="flex items-center w-6 h-8 rounded-r-lg cursor-pointer prize-option bg-slate-500/50"
          @click="prizeShow = !prizeShow"
        >
          <svg-icon name="arrow_right" class="w-full h-full" />
        </div>
      </div>
    </transition>
    
    <!-- 奖品预览弹窗 -->
    <Teleport to="body">
      <Transition name="prize-preview">
        <div v-if="showPrizePreview" class="prize-preview-overlay" @click="closePrizePreview">
          <div class="prize-preview-container" @click.stop>
            <button class="preview-close-btn" @click="closePrizePreview">✕</button>
            <div class="preview-image-wrapper">
              <img 
                :src="previewPrize?.picture?.url || defaultPrizeImage" 
                :alt="previewPrize?.name"
                class="preview-image"
              />
            </div>
            <div class="preview-info">
              <h2 class="preview-title" :style="{ fontSize: `${props.textSize * 0.8}px` }">
                {{ previewPrize?.name }}
              </h2>
              <div class="preview-progress">
                <span class="preview-count" :style="{ fontSize: `${props.textSize * 0.5}px` }">
                  {{ previewPrize?.isUsedCount }} / {{ previewPrize?.count }}
                </span>
                <progress 
                  class="progress progress-primary w-full h-4" 
                  :value="previewPrize?.isUsedCount" 
                  :max="previewPrize?.count"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang='scss' scoped>
.label {
    width: 120px;
}

// 奖品预览弹窗样式
.prize-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.prize-preview-container {
  position: relative;
  background: linear-gradient(145deg, rgba(30, 30, 63, 0.95), rgba(42, 42, 90, 0.95));
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  max-width: 90vw;
  max-height: 90vh;
}

.preview-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
}

.preview-image-wrapper {
  margin-bottom: 24px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.preview-image {
  width: 300px;
  height: 300px;
  object-fit: cover;
  display: block;
}

.preview-info {
  color: white;
}

.preview-title {
  margin: 0 0 16px;
  font-weight: 700;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.preview-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-count {
  color: rgba(255, 255, 255, 0.8);
}

// 预览弹窗动画
.prize-preview-enter-active,
.prize-preview-leave-active {
  transition: all 0.3s ease;
}

.prize-preview-enter-from,
.prize-preview-leave-to {
  opacity: 0;
  
  .prize-preview-container {
    transform: scale(0.8);
  }
}

.prize-preview-enter-to,
.prize-preview-leave-from {
  opacity: 1;
  
  .prize-preview-container {
    transform: scale(1);
  }
}

.prize-list-enter-active {
    -webkit-animation: slide-right 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
    animation: slide-right 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

.prize-list-leave-active {
    -webkit-animation: slide-left 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
    animation: slide-left 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

.prize-operate-enter-active {
    // 延时显示
    animation: show-operate 0.6s;
    -webkit-animation: show-operate 0.6s;
}

.current-prize {
    position: relative;
    display: block;
    overflow: hidden;
    isolation: isolate;

    border-radius: 20px;
    padding: 3px;
}

.current-prize::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 400%;
    height: 100%;
    background: linear-gradient(115deg, #4fcf70, #fad648, #a767e5, #12bcfe, #44ce7b);
    background-size: 25% 100%;
    animation: an-at-keyframe-css-at-rule-that-translates-via-the-transform-property-the-background-by-negative-25-percent-of-its-width-so-that-it-gives-a-nice-border-animation_-We-use-the-translate-property-to-have-a-nice-transition-so-it_s-not-a-jerk-of-a-start-or-stop .75s linear infinite;
    // animation-play-state: paused;
    translate: -5% 0%;
    transition: translate 0.25s ease-out;
    animation-play-state: running;
    transition-duration: 0.75s;
    translate: 0% 0%;
}

.current-prize::after {
    content: "";
    position: absolute;
    inset: 4px;
    border-top-left-radius: 20px;
    border-bottom-right-radius: 20px;
    z-index: -1;
}

@keyframes an-at-keyframe-css-at-rule-that-translates-via-the-transform-property-the-background-by-negative-25-percent-of-its-width-so-that-it-gives-a-nice-border-animation_-We-use-the-translate-property-to-have-a-nice-transition-so-it_s-not-a-jerk-of-a-start-or-stop {
    to {
        transform: translateX(-25%);
    }
}

@-webkit-keyframes slide-right {
    0% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
    }

    100% {
        -webkit-transform: translateX(30px);
        transform: translateX(30px);
    }
}

@keyframes slide-right {
    0% {
        -webkit-transform: translateX(-200px);
        transform: translateX(-200px);
    }

    100% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
    }
}

@-webkit-keyframes slide-left {
    0% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
    }

    100% {
        -webkit-transform: translateX(-100px);
        transform: translateX(-100px);
    }
}

@keyframes slide-left {
    0% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
    }

    100% {
        -webkit-transform: translateX(-400px);
        transform: translateX(-400px);
    }
}

@-webkit-keyframes show-operate {
    0% {
        opacity: 0;
    }

    99% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

@keyframes show-operate {
    0% {
        opacity: 0;
    }

    99% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}
</style>
