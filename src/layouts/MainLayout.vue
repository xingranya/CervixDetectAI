<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar size="40px">
            <img src="/logo.svg" alt="CervixDetectAI Logo" />
          </q-avatar>
          CervixDetectAI
          <template v-if="currentHospital">
            <span class="q-mx-sm text-grey-4">|</span>
            <q-avatar v-if="currentHospital.iconUrl" size="24px" class="q-mr-xs hospital-logo">
              <img :src="currentHospital.iconUrl" :alt="currentHospital.name" />
            </q-avatar>
            <q-icon v-else :name="currentHospital.icon" size="xs" class="q-mr-xs" />
            <span class="text-caption">{{ currentHospital.name }}</span>
          </template>
        </q-toolbar-title>

        <div class="q-gutter-sm row items-center no-wrap">
          <ThemeToggle />
          <NotificationBell />
          <HeaderUserMenu />
        </div>
      </q-toolbar>
    </q-header>

    <MainNavDrawer v-model="leftDrawerOpen" />

    <q-page-container>
      <router-view />
    </q-page-container>

    <AppFooter />
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from 'src/stores/authStore';
import { HOSPITALS } from 'src/constants/hospitals';
import AppFooter from 'src/components/AppFooter.vue';
import ThemeToggle from 'src/components/common/ThemeToggle.vue';
import HeaderUserMenu from 'src/components/layout/HeaderUserMenu.vue';
import MainNavDrawer from 'src/components/layout/MainNavDrawer.vue';
import NotificationBell from 'src/components/layout/NotificationBell.vue';

const authStore = useAuthStore();
const leftDrawerOpen = ref(true);

const currentHospital = computed(() => {
  if (!authStore.user?.hospital_id) return null;
  return HOSPITALS.find((hospital) => hospital.id === authStore.user?.hospital_id) || null;
});

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};
</script>
