<template>
  <q-card flat bordered class="email-security-card profile-card">
    <q-card-section class="q-pa-lg">
      <div class="row items-center q-mb-sm">
        <q-icon name="mark_email_read" size="sm" color="primary" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold">邮箱安全</div>
      </div>
      <div class="text-caption text-grey-7 q-mb-md">
        输入新邮箱并完成验证码校验后立即生效，当前登录状态不受影响。
      </div>

      <q-banner rounded class="bg-blue-1 text-primary q-mb-md">
        步骤：1. 输入新邮箱 2. 发送验证码 3. 确认更换
      </q-banner>

      <q-field outlined stack-label label="当前邮箱" class="q-mb-md">
        <template #prepend>
          <q-icon name="alternate_email" color="grey-6" />
        </template>
        <template #control>
          <div class="self-center full-width q-pl-xs">
            {{ currentEmailDisplay }}
          </div>
        </template>
        <template #append>
          <q-badge color="positive" rounded>已验证</q-badge>
        </template>
      </q-field>

      <q-input
        v-model="newEmail"
        outlined
        label="新邮箱"
        type="text"
        inputmode="email"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        :disable="disabled"
        class="q-mb-md"
        :rules="[(val) => !val || EMAIL_PATTERN.test(val) || '邮箱格式不正确']"
      >
        <template #prepend>
          <q-icon name="email" color="grey-6" />
        </template>
      </q-input>

      <q-input
        v-model="verifyCode"
        outlined
        label="更换邮箱验证码"
        maxlength="6"
        :disable="disabled"
        :rules="[
          (val) => !val || /^\d{6}$/.test(val) || '验证码需为6位数字',
        ]"
      >
        <template #prepend>
          <q-icon name="verified_user" color="grey-6" />
        </template>
        <template #append>
          <q-btn
            flat
            dense
            color="primary"
            :label="codeButtonText"
            :loading="sendingCode"
            :disable="!canSendCode"
            @click="sendChangeCode"
          />
        </template>
      </q-input>

      <div class="text-caption text-orange-7 q-mt-xs">
        仅当新邮箱与当前邮箱不同且格式正确时，才可发送验证码。
      </div>

      <div class="row q-mt-md">
        <q-space />
        <q-btn
          color="primary"
          unelevated
          rounded
          icon="verified"
          label="确认更换邮箱"
          :loading="confirmingChange"
          :disable="!canConfirmChange"
          @click="confirmChangeEmail"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { userAPI } from 'src/services/api';

interface Props {
  currentEmail?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentEmail: '',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'email-updated', payload: { email: string }): void;
}>();

const $q = useQuasar();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const newEmail = ref('');
const verifyCode = ref('');
const sendingCode = ref(false);
const confirmingChange = ref(false);
const codeCountdown = ref(0);
const codeTimer = ref<number | null>(null);

const normalizedCurrentEmail = computed(() => props.currentEmail.trim().toLowerCase());
const normalizedNewEmail = computed(() => newEmail.value.trim().toLowerCase());
const currentEmailDisplay = computed(() => props.currentEmail || '-');
const isEmailChanged = computed(() => {
  if (!normalizedNewEmail.value) return false;
  return normalizedNewEmail.value !== normalizedCurrentEmail.value;
});

const canSendCode = computed(() => {
  return (
    !props.disabled &&
    isEmailChanged.value &&
    EMAIL_PATTERN.test(normalizedNewEmail.value) &&
    codeCountdown.value <= 0 &&
    !sendingCode.value
  );
});

const canConfirmChange = computed(() => {
  return (
    !props.disabled &&
    isEmailChanged.value &&
    /^\d{6}$/.test(verifyCode.value.trim()) &&
    !confirmingChange.value
  );
});

const codeButtonText = computed(() => {
  return codeCountdown.value > 0 ? `${codeCountdown.value}s` : '发送验证码';
});

const clearCodeTimer = () => {
  if (codeTimer.value !== null) {
    window.clearInterval(codeTimer.value);
    codeTimer.value = null;
  }
};

const startCodeCountdown = () => {
  clearCodeTimer();
  codeCountdown.value = 60;
  codeTimer.value = window.setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0) {
      codeCountdown.value = 0;
      clearCodeTimer();
    }
  }, 1000);
};

const resetVerifyState = () => {
  verifyCode.value = '';
  codeCountdown.value = 0;
  clearCodeTimer();
};

const sendChangeCode = async () => {
  if (!isEmailChanged.value) {
    $q.notify({
      type: 'warning',
      message: '请先输入与当前不同的新邮箱地址',
      position: 'top',
    });
    return;
  }

  if (!EMAIL_PATTERN.test(normalizedNewEmail.value)) {
    $q.notify({
      type: 'warning',
      message: '请先输入正确的新邮箱地址',
      position: 'top',
    });
    return;
  }

  sendingCode.value = true;
  try {
    const response = await userAPI.sendChangeEmailCode(normalizedNewEmail.value);
    if (response.success) {
      startCodeCountdown();
      $q.notify({
        type: 'positive',
        message: '验证码已发送到新邮箱，请注意查收',
        position: 'top',
      });
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || '发送验证码失败',
      position: 'top',
    });
  } finally {
    sendingCode.value = false;
  }
};

const confirmChangeEmail = async () => {
  if (!isEmailChanged.value) {
    $q.notify({
      type: 'warning',
      message: '新邮箱与当前邮箱一致，无需更换',
      position: 'top',
    });
    return;
  }

  if (!verifyCode.value.trim()) {
    $q.notify({
      type: 'warning',
      message: '请先输入更换邮箱验证码',
      position: 'top',
    });
    return;
  }

  confirmingChange.value = true;
  try {
    const response = await userAPI.confirmChangeEmail(normalizedNewEmail.value, verifyCode.value.trim());
    if (response.success) {
      $q.notify({
        type: 'positive',
        message: '邮箱更换成功',
        position: 'top',
      });

      emit('email-updated', {
        email: response.data.user?.email || normalizedNewEmail.value,
      });

      newEmail.value = '';
      resetVerifyState();
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || '更换邮箱失败',
      position: 'top',
    });
  } finally {
    confirmingChange.value = false;
  }
};

watch(
  () => props.currentEmail,
  () => {
    if (!isEmailChanged.value) {
      resetVerifyState();
    }
  },
);

onBeforeUnmount(() => {
  clearCodeTimer();
});
</script>

<style scoped>
.email-security-card :deep(.q-field__control) {
  border-radius: 10px;
  min-height: 48px;
}
</style>
