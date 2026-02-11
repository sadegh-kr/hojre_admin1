<template>
  <BaseModal
      v-model="isVisible"
      :title="modalTitle"
      :size="'lg'"
      :modal-class="['user-details-modal']"
      @close="onClose"
  >
    <!-- حالت لودینگ -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>در حال دریافت اطلاعات کاربر...</p>
    </div>

    <!-- حالت خطا -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h4>خطا در دریافت اطلاعات</h4>
      <p>{{ error }}</p>
      <button @click="fetchUserDetails" class="retry-btn">
        تلاش مجدد
      </button>
    </div>

    <!-- حالت موفق -->
    <div v-else-if="user" class="user-details-content">
      <!-- کارت هدر کاربر -->
      <div class="user-header-card">
        <div class="user-header-avatar">
          <div class="avatar-large">
            <div class="avatar-placeholder-large">
              {{ userInitials }}
            </div>
          </div>
          <div class="user-header-info">
            <h2>{{ user.name || 'کاربر' }}</h2>
            <div class="user-badges">
              <span class="restaurant-badge">
                🍽️ {{ user.restaurant_name }}
              </span>
              <span class="user-id-badge">
                🆔 {{ user.id.substring(0, 8) }}...
              </span>
            </div>
            <div class="user-contact-info">
              <div class="contact-item">
                <span class="contact-icon">📱</span>
                <a :href="`tel:${user.phone_number}`" class="contact-link">
                  {{ user.phone_number }}
                </a>
              </div>
              <div class="contact-item" v-if="user.code">
                <span class="contact-icon">🎫</span>
                <span>کد: {{ user.code }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- گرید اطلاعات اصلی -->
      <div class="info-grid-section">
        <div class="section-title">
          <span class="title-icon">📋</span>
          <h4>اطلاعات کاربری</h4>
        </div>

        <div class="info-cards-grid">
          <!-- کارت اطلاعات پایه -->
          <div class="info-card">
            <div class="info-card-header">
              <span class="card-icon">👤</span>
              <h5>اطلاعات پایه</h5>
            </div>
            <div class="info-card-content">
              <div class="info-row">
                <span class="row-label">نام و نام خانوادگی:</span>
                <div class="row-value-editable">
                  <span v-if="!editing.name" class="row-value">{{ user.name || 'ثبت نشده' }}</span>
                  <input
                      v-else
                      v-model="editForm.name"
                      class="edit-input"
                      placeholder="نام کاربر"
                  >
                  <button @click="toggleEdit('name')" class="edit-icon-btn">
                    ✏️
                  </button>
                </div>
              </div>

              <div class="info-row">
                <span class="row-label">شماره موبایل:</span>
                <div class="row-value-editable">
                  <span v-if="!editing.phone" class="row-value phone-number">{{ user.phone_number }}</span>
                  <input
                      v-else
                      v-model="editForm.phone"
                      class="edit-input"
                      placeholder="شماره موبایل"
                      dir="ltr"
                  >
                  <button @click="toggleEdit('phone')" class="edit-icon-btn">
                    ✏️
                  </button>
                </div>
              </div>

              <div class="info-row">
                <span class="row-label">تاریخ عضویت:</span>
                <span class="row-value">{{ formatDate(user.created) }}</span>
              </div>

              <div class="info-row">
                <span class="row-label">آخرین ورود:</span>
                <span class="row-value">
                  {{ formatDate(user.last_login) }}
                  <span class="time-badge">{{ formatTime(user.last_login) }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- کارت رستوران و کد -->
          <div class="info-card">
            <div class="info-card-header">
              <span class="card-icon">🏪</span>
              <h5>اطلاعات رستوران</h5>
            </div>
            <div class="info-card-content">
              <div class="info-row">
                <span class="row-label">نام رستوران:</span>
                <div class="row-value-editable">
                  <span v-if="!editing.restaurant" class="row-value">{{ user.restaurant_name }}</span>
                  <input
                      v-else
                      v-model="editForm.restaurant_name"
                      class="edit-input"
                      placeholder="نام رستوران"
                  >
                  <button @click="toggleEdit('restaurant')" class="edit-icon-btn">
                    ✏️
                  </button>
                </div>
              </div>

              <div class="info-row">
                <span class="row-label">کد کاربر:</span>
                <div class="row-value-editable">
                  <span v-if="!editing.code" class="row-value">{{ user.code || 'ثبت نشده' }}</span>
                  <input
                      v-else
                      v-model="editForm.code"
                      class="edit-input"
                      placeholder="کد کاربر"
                      dir="ltr"
                  >
                  <button @click="toggleEdit('code')" class="edit-icon-btn">
                    ✏️
                  </button>
                </div>
              </div>

              <div class="info-row">
                <span class="row-label">تاریخ انقضا:</span>
                <div class="row-value-editable">
                  <span v-if="!editing.expiry" class="row-value">{{ user.expiry ? formatDate(user.expiry) : 'ثبت نشده' }}</span>
                  <input
                      v-else
                      v-model="editForm.expiry"
                      class="edit-input"
                      type="date"
                      dir="ltr"
                  >
                  <button @click="toggleEdit('expiry')" class="edit-icon-btn">
                    ✏️
                  </button>
                </div>
              </div>

              <div class="info-row" v-if="user.restaurant_id">
                <span class="row-label">شناسه رستوران:</span>
                <span class="row-value code-text">{{ user.restaurant_id.substring(0, 12) }}...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- دکمه ذخیره تغییرات -->
        <div v-if="hasChanges" class="save-changes-bar">
          <span>تغییرات ذخیره نشده وجود دارد</span>
          <div class="save-actions">
            <button @click="cancelChanges" class="cancel-btn">لغو</button>
            <button @click="saveChanges" class="save-btn">💾 ذخیره تغییرات</button>
          </div>
        </div>
      </div>

      <!-- آدرس‌ها -->
      <div class="addresses-section">
        <div class="section-title">
          <span class="title-icon">📍</span>
          <h4>آدرس‌های ثبت شده</h4>
          <span class="address-count">{{ user.addresses?.length || 0 }} آدرس</span>
        </div>

        <div v-if="user.addresses && user.addresses.length > 0" class="addresses-grid">
          <div
              v-for="address in user.addresses"
              :key="address.id"
              class="address-card-modern"
          >
            <div class="address-card-header">
              <div class="address-title">
                <span class="address-icon">📍</span>
                <h6>{{ address.name || 'آدرس' }}</h6>
              </div>
              <span class="address-date">
                {{ formatDate(address.created) }}
              </span>
            </div>

            <p class="address-detail">{{ address.detail }}</p>

            <div class="address-coordinates">
              <div class="coord-item">
                <span class="coord-label">عرض جغرافیایی:</span>
                <span class="coord-value">{{ address.location.latitude.toFixed(6) }}</span>
              </div>
              <div class="coord-item">
                <span class="coord-label">طول جغرافیایی:</span>
                <span class="coord-value">{{ address.location.longitude.toFixed(6) }}</span>
              </div>
            </div>

            <div class="address-footer">
              <div class="address-meta">
                <span class="meta-item">
                  🆔 {{ address.id.substring(0, 8) }}...
                </span>
                <span class="meta-item">
                  📅 {{ formatRelativeTime(address.updated) }}
                </span>
              </div>
              <button @click="openAddressMap(address)" class="map-btn">
                🗺️ مشاهده در نقشه
              </button>
            </div>
          </div>
        </div>

        <div v-else class="no-address">
          <div class="no-address-icon">📍</div>
          <p>هیچ آدرسی ثبت نشده است</p>
          <button class="add-address-btn">+ افزودن آدرس جدید</button>
        </div>
      </div>

      <!-- دکمه‌های اقدام -->
      <div class="action-buttons-grid">
        <button @click="showUserOrders" class="action-button primary">
          <span class="btn-icon">🛒</span>
          <span class="btn-text">مشاهده سفارشات</span>
          <span class="btn-badge">{{ user.order_count || 0 }}</span>
        </button>

        <button @click="exportUserData" class="action-button secondary">
          <span class="btn-icon">📥</span>
          <span class="btn-text">خروجی اطلاعات</span>
        </button>

        <button @click="sendNotification" class="action-button info">
          <span class="btn-icon">🔔</span>
          <span class="btn-text">ارسال نوتیفیکیشن</span>
        </button>

        <button @click="close" class="action-button close">
          <span class="btn-icon">✕</span>
          <span class="btn-text">بستن</span>
        </button>
      </div>
    </div>
    <UserOrderList
        v-model="showOrdersModal"
        :user-id="selectedUserId"
        @view-order="handleViewOrder"
        @repeat-order="handleRepeatOrder"
        @track-order="handleTrackOrder"
        @close="showOrdersModal = false"
    />
  </BaseModal>

</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseModal from '../BaseModal.vue';
import UserApi from '@/api/user.api.js';
import UserOrderList from './UserOrderList.vue';
const props = defineProps({
  userId: {
    type: [String, Number],
    default: null
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:modelValue',
  'close',
  'edit',
  'notify',
  'show-orders'
]);

// Reactive state
const isVisible = ref(props.modelValue);
const user = ref(null);
const loading = ref(false);
const error = ref(null);

// Edit states
const editing = ref({
  name: false,
  phone: false,
  restaurant: false,
  code: false,
  expiry: false
});

const editForm = ref({
  name: '',
  phone: '',
  restaurant_name: '',
  code: '',
  expiry: ''
});

// Computed
const modalTitle = computed(() => {
  if (!user.value) return 'جزئیات کاربر';
  return `👤 ${user.value.name || 'کاربر'} - ${user.value.restaurant_name}`;
});



const showOrdersModal = ref(false);
// ✅ ذخیره موقت userId برای مودال سفارشات
const selectedUserId = ref(null);

// ✅ تابع نمایش مودال سفارشات
const showUserOrders = () => {
  if (!user.value?.id) return;
  selectedUserId.value = user.value.id;
  showOrdersModal.value = true;
  emit('show-orders', user.value);
};

// ✅ هندلرهای رویدادهای مودال سفارشات
const handleViewOrder = (order) => {
  console.log('مشاهده جزئیات سفارش:', order);
  // اینجا میتونی یه مودال دیگه برای جزئیات سفارش باز کنی
};

const handleRepeatOrder = (order) => {
  console.log('تکرار سفارش:', order);
  // اینجا میتونی سفارش رو دوباره ثبت کنی
};

const handleTrackOrder = (order) => {
  console.log('پیگیری سفارش:', order);
  // اینجا میتونی نقشه پیگیری سفارش رو باز کنی
};

const userInitials = computed(() => {
  if (!user.value?.name) return '👤';
  const names = user.value.name.split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return names[0].substring(0, 2).toUpperCase();
});

const hasChanges = computed(() => {
  if (!user.value) return false;
  return (
      editForm.value.name !== user.value.name ||
      editForm.value.phone !== user.value.phone_number ||
      editForm.value.restaurant_name !== user.value.restaurant_name ||
      editForm.value.code !== user.value.code ||
      editForm.value.expiry !== user.value.expiry
  );
});

// Methods
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 7) return `${days} روز پیش`;
  return formatDate(dateStr);
};

const toggleEdit = (field) => {
  if (!editing.value[field]) {
    // Initialize edit form with current values
    if (field === 'name') editForm.value.name = user.value.name || '';
    if (field === 'phone') editForm.value.phone = user.value.phone_number || '';
    if (field === 'restaurant') editForm.value.restaurant_name = user.value.restaurant_name || '';
    if (field === 'code') editForm.value.code = user.value.code || '';
    if (field === 'expiry') editForm.value.expiry = user.value.expiry ? user.value.expiry.split('T')[0] : '';
  }
  editing.value[field] = !editing.value[field];
};

const cancelChanges = () => {
  Object.keys(editing.value).forEach(key => {
    editing.value[key] = false;
  });
  // Reset form
  if (user.value) {
    editForm.value = {
      name: user.value.name || '',
      phone: user.value.phone_number || '',
      restaurant_name: user.value.restaurant_name || '',
      code: user.value.code || '',
      expiry: user.value.expiry ? user.value.expiry.split('T')[0] : ''
    };
  }
};

const saveChanges = async () => {
  if (!user.value || !props.userId) return;

  try {
    loading.value = true;

    const updateData = {};
    if (editing.value.name) updateData.name = editForm.value.name;
    if (editing.value.phone) updateData.phone_number = editForm.value.phone;
    if (editing.value.restaurant) updateData.restaurant_name = editForm.value.restaurant_name;
    if (editing.value.code) updateData.code = editForm.value.code;
    if (editing.value.expiry) updateData.expiry = editForm.value.expiry;

    const response = await UserApi.putUpdateUser(props.userId, updateData);

    // Update user data
    user.value = {
      ...user.value,
      ...response.data
    };

    // Reset editing states
    cancelChanges();

    alert('✅ اطلاعات کاربر با موفقیت بروزرسانی شد');
  } catch (err) {
    console.error('خطا در بروزرسانی:', err);
    alert('❌ خطا در بروزرسانی اطلاعات کاربر');
  } finally {
    loading.value = false;
  }
};

const fetchUserDetails = async () => {
  if (!props.userId) {
    error.value = 'شناسه کاربر مشخص نیست';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await UserApi.getCustomerDetail(props.userId);
    user.value = response.data;

    // Initialize edit form
    editForm.value = {
      name: user.value.name || '',
      phone: user.value.phone_number || '',
      restaurant_name: user.value.restaurant_name || '',
      code: user.value.code || '',
      expiry: user.value.expiry ? user.value.expiry.split('T')[0] : ''
    };
  } catch (err) {
    console.error('خطا در دریافت جزئیات کاربر:', err);
    error.value = err.response?.data?.message || 'خطا در دریافت اطلاعات کاربر';
    user.value = null;
  } finally {
    loading.value = false;
  }
};

const openAddressMap = (address) => {
  if (!address?.location) return;
  const {latitude, longitude} = address.location;
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&hl=fa`;
  window.open(mapsUrl, '_blank');
};


const sendNotification = () => {
  emit('notify', user.value);
};

const exportUserData = () => {
  if (!user.value) return;

  const exportData = {
    ...user.value,
    export_date: new Date().toISOString(),
    exported_by: 'admin'
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = `user-${user.value.phone_number}-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

const close = () => {
  isVisible.value = false;
  emit('update:modelValue', false);
  emit('close');
};

const onClose = () => {
  setTimeout(() => {
    user.value = null;
    error.value = null;
    loading.value = false;
    cancelChanges();
  }, 300);
};
fetchUserDetails();
// Watchers
watch(() => props.userId, (newUserId) => {
  if (newUserId && isVisible.value) {
    fetchUserDetails();
  }
});

watch(() => props.modelValue, (newVal) => {
  isVisible.value = newVal;
  if (newVal && props.userId) {
    fetchUserDetails();
  }
});

watch(isVisible, (newVal) => {
  if (!newVal && props.modelValue) {
    emit('update:modelValue', false);
  }
});

// Expose methods
defineExpose({
  open: () => {
    isVisible.value = true;
    if (props.userId) fetchUserDetails();
  },
  close,
  refresh: fetchUserDetails
});
</script>

<style scoped>
.user-details-content {
  padding: 8px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.loading-state .spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* User Header Card */
.user-header-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
}

.user-header-avatar {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #4dabf7;
  background: #f8f9fa;
  box-shadow: 0 8px 20px rgba(77, 171, 247, 0.2);
}

.avatar-placeholder-large {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4dabf7, #1971c2);
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
}

.user-header-info {
  flex: 1;
}

.user-header-info h2 {
  margin: 0 0 12px 0;
  font-size: 1.8rem;
  color: #212529;
  font-weight: 700;
}

.user-badges {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.restaurant-badge {
  background: linear-gradient(135deg, #ffd43b, #fcc419);
  color: #212529;
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(255, 212, 59, 0.3);
}

.user-id-badge {
  background: #e9ecef;
  color: #495057;
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
}

.user-contact-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
}

.contact-icon {
  font-size: 1.2rem;
}

.contact-link {
  color: #1971c2;
  text-decoration: none;
  font-weight: 500;
}

.contact-link:hover {
  text-decoration: underline;
}

/* Section Title */
.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e9ecef;
}

.title-icon {
  font-size: 1.5rem;
}

.section-title h4 {
  margin: 0;
  font-size: 1.2rem;
  color: #212529;
  font-weight: 600;
}

.address-count {
  background: #4dabf7;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-right: auto;
}

/* Info Cards Grid */
.info-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.info-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.info-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  border-color: #4dabf7;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-icon {
  font-size: 1.3rem;
}

.info-card-header h5 {
  margin: 0;
  font-size: 1rem;
  color: #495057;
  font-weight: 600;
}

.info-card-content {
  padding: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e9ecef;
}

.info-row:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.row-label {
  width: 140px;
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.row-value {
  flex: 1;
  font-size: 0.95rem;
  color: #212529;
  font-weight: 500;
}

.row-value-editable {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #4dabf7;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.edit-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}

.edit-icon-btn {
  background: none;
  border: none;
  font-size: 1rem;
  padding: 6px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.2s;
  border-radius: 6px;
}

.edit-icon-btn:hover {
  opacity: 1;
  background: #f1f3f5;
}

.phone-number {
  font-family: 'Courier New', monospace;
  direction: ltr;
  display: inline-block;
}

.time-badge {
  background: #e7f5ff;
  color: #1971c2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-left: 8px;
}

.code-text {
  font-family: 'Courier New', monospace;
  background: #f1f3f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Save Changes Bar */
.save-changes-bar {
  margin-top: 20px;
  padding: 16px 24px;
  background: #fff9db;
  border: 1px solid #ffd43b;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.save-changes-bar span {
  color: #e67700;
  font-weight: 600;
}

.save-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  padding: 8px 20px;
  border: 1px solid #ced4da;
  background: white;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f1f3f5;
}

.save-btn {
  padding: 8px 24px;
  background: #51cf66;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #40c057;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(81, 207, 102, 0.3);
}

/* Addresses Grid */
.addresses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.address-card-modern {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.address-card-modern:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  border-color: #4dabf7;
}

.address-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.address-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address-icon {
  font-size: 1.3rem;
}

.address-title h6 {
  margin: 0;
  font-size: 1.1rem;
  color: #212529;
  font-weight: 600;
}

.address-date {
  font-size: 0.8rem;
  color: #868e96;
  background: #f1f3f5;
  padding: 4px 12px;
  border-radius: 20px;
}

.address-detail {
  color: #495057;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-right: 4px solid #4dabf7;
}

.address-coordinates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.coord-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coord-label {
  font-size: 0.75rem;
  color: #868e96;
}

.coord-value {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #212529;
  font-weight: 600;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.address-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.address-meta {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: #868e96;
}

.meta-item {
  background: #f1f3f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.map-btn {
  background: #4dabf7;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.map-btn:hover {
  background: #339af0;
  transform: scale(1.05);
}

.no-address {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 16px;
  margin-top: 20px;
}

.no-address-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-address p {
  color: #6c757d;
  margin-bottom: 20px;
}

.add-address-btn {
  background: #4dabf7;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-address-btn:hover {
  background: #339af0;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(77, 171, 247, 0.4);
}

/* Action Buttons Grid */
.action-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #e9ecef;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.action-button:hover::before {
  width: 300px;
  height: 300px;
}

.btn-icon {
  font-size: 1.2rem;
}

.btn-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
}

.action-button.primary {
  background: linear-gradient(135deg, #4dabf7, #1971c2);
  color: white;
  box-shadow: 0 4px 15px rgba(77, 171, 247, 0.3);
}

.action-button.primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(77, 171, 247, 0.4);
}

.action-button.secondary {
  background: linear-gradient(135deg, #20c997, #099268);
  color: white;
  box-shadow: 0 4px 15px rgba(32, 201, 151, 0.3);
}

.action-button.secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(32, 201, 151, 0.4);
}

.action-button.info {
  background: linear-gradient(135deg, #ffd43b, #e67700);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 212, 59, 0.3);
}

.action-button.info:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 212, 59, 0.4);
}

.action-button.close {
  background: linear-gradient(135deg, #868e96, #495057);
  color: white;
  box-shadow: 0 4px 15px rgba(134, 142, 150, 0.3);
}

.action-button.close:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(134, 142, 150, 0.4);
}

/* Error State */
.error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-state .error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-state h4 {
  color: #c92a2a;
  margin-bottom: 12px;
}

.error-state p {
  color: #868e96;
  margin-bottom: 24px;
}

.retry-btn {
  background: #4dabf7;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #339af0;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(77, 171, 247, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .user-header-avatar {
    flex-direction: column;
    text-align: center;
  }

  .user-header-info h2 {
    font-size: 1.5rem;
  }

  .user-contact-info {
    justify-content: center;
  }

  .info-cards-grid {
    grid-template-columns: 1fr;
  }

  .info-row {
    flex-direction: column;
    gap: 8px;
  }

  .row-label {
    width: 100%;
  }

  .row-value-editable {
    width: 100%;
  }

  .addresses-grid {
    grid-template-columns: 1fr;
  }

  .address-coordinates {
    grid-template-columns: 1fr;
  }

  .action-buttons-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .user-header-card {
    padding: 16px;
  }

  .avatar-large {
    width: 80px;
    height: 80px;
  }

  .avatar-placeholder-large {
    font-size: 2rem;
  }

  .user-badges {
    justify-content: center;
  }

  .user-contact-info {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .save-changes-bar {
    flex-direction: column;
    text-align: center;
  }

  .save-actions {
    width: 100%;
    flex-direction: column;
  }

  .address-footer {
    flex-direction: column;
    gap: 12px;
  }

  .address-meta {
    width: 100%;
    justify-content: center;
  }

  .map-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>