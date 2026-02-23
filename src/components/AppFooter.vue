<template>
  <q-footer
    v-model="footerVisible"
    class="app-footer"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-toolbar class="justify-center">
      <div class="row items-center text-caption app-footer__content">
        <span>© 2026 CervixDetectAI 云端智诊</span>
        <span class="app-footer__separator">|</span>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          class="app-footer__link"
          style="text-decoration: none"
        >
          鄂ICP备2026006203号-2
        </a>
      </div>
    </q-toolbar>
  </q-footer>
</template>

<style scoped>
/* 基础样式（scoped 保护，避免污染其他元素） */
.app-footer {
  background: #f9fafb;
  color: #6b7280;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: saturate(var(--app-glass-saturate)) blur(6px);
  -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(6px);
}

.app-footer__content {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.app-footer__link {
  white-space: nowrap;
  color: #6b7280;
}

@media (max-width: 480px) {
  .app-footer__content {
    flex-direction: column;
    gap: 2px;
  }

  .app-footer__separator {
    display: none;
  }
}

</style>

<!-- 全局样式（深色模式和认证页面特殊样式） -->
<style>
/* 深色模式 */
body.body--dark .app-footer {
  background: rgba(10, 10, 10, 0.85) !important;
  color: rgba(226, 232, 240, 0.78) !important;
  border-top-color: rgba(148, 163, 184, 0.2) !important;
}

body.body--dark .app-footer__link {
  color: rgba(226, 232, 240, 0.86) !important;
}

/* 认证页面特殊样式 - 浅色模式 */
body:not(.body--dark) .public-layout--auth .app-footer {
  background: rgba(219, 234, 254, 0.88) !important;
  color: #475569 !important;
  border-top-color: rgba(37, 99, 235, 0.14) !important;
}

body:not(.body--dark) .public-layout--auth .app-footer__link {
  color: #334155 !important;
}

/* 认证页面特殊样式 - 深色模式 */
body.body--dark .public-layout--auth .app-footer {
  background: rgba(15, 23, 42, 0.78) !important;
  color: rgba(226, 232, 240, 0.78) !important;
  border-top-color: rgba(148, 163, 184, 0.2) !important;
}

body.body--dark .public-layout--auth .app-footer__link {
  color: rgba(226, 232, 240, 0.86) !important;
}
</style>

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
