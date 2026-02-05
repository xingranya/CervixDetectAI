<template>
  <q-footer
    v-model="footerVisible"
    class="bg-grey-1 text-grey-6"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-toolbar class="justify-center">
      <div class="row items-center q-gutter-sm text-caption">
        <span>© 2026 CervixDetectAI 云端智诊</span>
        <span>|</span>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-grey-6"
          style="text-decoration: none"
        >
          鄂ICP备2026006203号-2
        </a>
      </div>
    </q-toolbar>
  </q-footer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// App Footer Component - 滚动到底部显示，与背景融为一体

const footerVisible = ref(false);

const checkScroll = () => {
  const scrollHeight = document.documentElement.scrollHeight;
  const windowHeight = window.innerHeight;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  // 计算到底部的距离
  const distanceToBottom = scrollHeight - (scrollTop + windowHeight);

  // 1. 短页面处理：如果内容高度 <= 窗口高度，始终显示页脚
  // 使用 +50 缓冲确保边界情况
  if (scrollHeight <= windowHeight + 50) {
    footerVisible.value = true;
    return;
  }

  // 2. 滞后阀值控制（解决抖动问题）
  // 当页脚显示时，页面总高度会增加。如果使用单一阈值，会导致 "显示->高度变大->距离变大->隐藏->高度变小->距离变小->显示" 的死循环
  if (footerVisible.value) {
    // 只有当用户明显向上滚动离开底部时（距离 > 150px），才隐藏页脚
    // 这个值必须大于页脚的高度
    if (distanceToBottom > 150) {
      footerVisible.value = false;
    }
  } else {
    // 当页脚隐藏时，只有非常接近底部（距离 < 20px）才显示
    if (distanceToBottom < 20) {
      footerVisible.value = true;
    }
  }
};

// 节流处理
let ticking = false;
const onCheck = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      checkScroll();
      ticking = false;
    });
    ticking = true;
  }
};

// 监控页面尺寸变化（如异步数据加载、窗口缩放）
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  window.addEventListener('scroll', onCheck);
  window.addEventListener('resize', onCheck);

  // 监听 body 高度变化，确保动态内容加载后能正确显示页脚
  resizeObserver = new ResizeObserver(() => {
    onCheck();
  });
  if (document.body) {
    resizeObserver.observe(document.body);
  }

  // 初始检查
  onCheck();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onCheck);
  window.removeEventListener('resize', onCheck);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>
