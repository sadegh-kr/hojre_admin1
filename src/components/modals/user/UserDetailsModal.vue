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
      <!-- اطلاعات اصلی کاربر -->
      <div class="user-info-section">
        <h4>👤 اطلاعات اصلی</h4>
        <div class="avatar-section">
          <div class="avatar-container">
            <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.full_name"
                class="user-avatar"
            >
            <div v-else class="avatar-placeholder">
              {{ userInitials }}
            </div>
          </div>
          <div class="avatar-actions">
            <button @click="changeAvatar" class="avatar-btn change-btn">
              تغییر عکس
            </button>
            <button v-if="user.avatar" @click="removeAvatar" class="avatar-btn remove-btn">
              حذف عکس
            </button>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">نام کامل:</span>
            <span class="info-value">{{ user.full_name || 'ثبت نشده' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">شماره موبایل:</span>
            <a :href="`tel:${user.phone_number}`" class="info-value phone-link">
              {{ user.phone_number }}
            </a>
          </div>
          <div class="info-item">
            <span class="info-label">ایمیل:</span>
            <a v-if="user.email" :href="`mailto:${user.email}`" class="info-value email-link">
              {{ user.email }}
            </a>
            <span v-else class="info-value">ثبت نشده</span>
          </div>
          <div class="info-item">
            <span class="info-label">کد ملی:</span>
            <span class="info-value">{{ user.national_code || 'ثبت نشده' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">وضعیت حساب:</span>
            <div class="status-control">
              <select
                  v-model="selectedStatus"
                  @change="updateUserStatus"
                  class="status-select"
                  :disabled="statusUpdating"
              >
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="suspended">تعلیق شده</option>
                <option value="banned">مسدود شده</option>
              </select>
              <div v-if="statusUpdating" class="status-updating">
                در حال بروزرسانی...
              </div>
            </div>
          </div>
          <div class="info-item">
            <span class="info-label">نقش:</span>
            <span :class="`role-badge role-${user.role}`">
              {{ user.role_fa }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">تاریخ عضویت:</span>
            <span class="info-value">
              {{ formatDate(user.created_at) }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">آخرین ورود:</span>
            <span class="info-value" v-if="user.last_login">
              {{ formatDate(user.last_login) }} - {{ formatTime(user.last_login) }}
            </span>
            <span v-else class="info-value">هنوز وارد نشده</span>
          </div>
          <div v-if="user.birth_date" class="info-item">
            <span class="info-label">تاریخ تولد:</span>
            <span class="info-value">{{ formatDate(user.birth_date) }}</span>
          </div>
          <div v-if="user.gender" class="info-item">
            <span class="info-label">جنسیت:</span>
            <span class="info-value">{{ user.gender_fa }}</span>
          </div>
        </div>
      </div>

      <!-- اطلاعات مالی -->
      <div class="financial-info-section">
        <h4>💰 اطلاعات مالی</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💳</div>
            <div class="stat-info">
              <span class="stat-label">اعتبار کیف پول</span>
              <span class="stat-value">{{ formatPrice(user.wallet_balance || 0) }} تومان</span>
            </div>
            <button @click="showWalletTransactions" class="stat-action">
              مشاهده تراکنش‌ها
            </button>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🛒</div>
            <div class="stat-info">
              <span class="stat-label">تعداد سفارشات</span>
              <span class="stat-value">{{ user.order_count || 0 }} سفارش</span>
            </div>
            <button @click="showUserOrders" class="stat-action">
              مشاهده سفارشات
            </button>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-info">
              <span class="stat-label">امتیاز کاربر</span>
              <span class="stat-value">{{ user.rating || 0 }} از ۵</span>
            </div>
            <button @click="showUserReviews" class="stat-action">
              مشاهده نظرات
            </button>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎁</div>
            <div class="stat-info">
              <span class="stat-label">تخفیف ویژه</span>
              <span class="stat-value">{{ user.special_discount || 0 }}%</span>
            </div>
            <button @click="editSpecialDiscount" class="stat-action">
              ویرایش تخفیف
            </button>
          </div>
        </div>
      </div>

      <!-- آدرس‌ها -->
      <div v-if="user.addresses && user.addresses.length > 0" class="addresses-section">
        <h4>📍 آدرس‌های ثبت شده</h4>
        <div class="addresses-list">
          <div v-for="address in user.addresses" :key="address.id" class="address-card">
            <div class="address-header">
              <h5>{{ address.name || 'بدون نام' }}</h5>
              <span :class="`address-type ${address.type}`">
                {{ address.type_fa }}
              </span>
            </div>
            <p class="address-details">{{ address.full_address }}</p>
            <div v-if="address.location" class="address-location">
              <span class="coordinates">
                {{ address.location.latitude.toFixed(6) }}, {{ address.location.longitude.toFixed(6) }}
              </span>
              <button @click="openAddressMap(address)" class="small-map-btn">
                مشاهده در نقشه
              </button>
            </div>
            <div class="address-footer">
              <button @click="editAddress(address)" class="address-action edit-btn">
                ویرایش
              </button>
              <button @click="deleteAddress(address)" class="address-action delete-btn">
                حذف
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- یادداشت‌ها -->
      <div class="notes-section">
        <h4>📝 یادداشت‌ها</h4>
        <div class="notes-container">
          <div class="notes-list" v-if="user.notes && user.notes.length > 0">
            <div v-for="note in user.notes" :key="note.id" class="note-item">
              <div class="note-content">{{ note.content }}</div>
              <div class="note-meta">
                <span class="note-date">{{ formatDate(note.created_at) }}</span>
                <span class="note-author">{{ note.author_name }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-notes">
            <p>هیچ یادداشتی ثبت نشده است.</p>
          </div>
          <div class="add-note">
            <textarea
                v-model="newNote"
                placeholder="یادداشت جدید..."
                class="note-textarea"
                rows="3"
            ></textarea>
            <button @click="addNote" class="add-note-btn" :disabled="!newNote.trim()">
              افزودن یادداشت
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- اسلات فوتر -->
    <template #footer>
      <div class="modal-actions">
        <button @click="sendNotification" class="action-btn notify-btn" :disabled="loading">
          🔔 ارسال نوتیفیکیشن
        </button>
        <button @click="exportUserData" class="action-btn export-btn" :disabled="loading">
          📤 خروجی اطلاعات
        </button>
        <button @click="editUser" class="action-btn edit-btn" :disabled="loading">
          ✏️ ویرایش کاربر
        </button>
        <button @click="close" class="action-btn close-btn">
          بستن
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseModal from '../BaseModal.vue';
import UserApi from '@/api/user.api.js';

const props = defineProps({
  userId: {
    type: [String, Number],
    default: null
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits([
  'update:modelValue',
  'close',
  'edit',
  'notify',
  'show-orders',
  'show-transactions',
  'show-reviews',
  'status-updated',
  'address-selected'
]);

// Reactive state
const isVisible = ref(props.modelValue);
const user = ref(props.initialData);
const loading = ref(false);
const error = ref(null);
const selectedStatus = ref('');
const statusUpdating = ref(false);
const newNote = ref('');

// حروف اول نام کاربر برای آواتار
const userInitials = computed(() => {
  if (!user.value?.full_name) return '?';
  const names = user.value.full_name.split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return names[0][0].toUpperCase();
});

// عنوان مودال
const modalTitle = computed(() => {
  if (!user.value) return 'جزئیات کاربر';
  return `مشخصات ${user.value.full_name || 'کاربر'}`;
});

// فرمت قیمت
const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

// فرمت تاریخ
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// فرمت زمان
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// پردازش داده‌های کاربر
const processUserData = (userData) => {
  // ذخیره وضعیت فعلی برای select
  selectedStatus.value = userData.status || 'active';

  // تبدیل نقش به فارسی
  let role_fa = '';
  switch(userData.role) {
    case 'admin':
      role_fa = 'مدیر سیستم';
      break;
    case 'staff':
      role_fa = 'کارمند';
      break;
    case 'customer':
      role_fa = 'مشتری';
      break;
    case 'vendor':
      role_fa = 'فروشنده';
      break;
    default:
      role_fa = userData.role;
  }

  // تبدیل جنسیت به فارسی
  let gender_fa = '';
  switch(userData.gender) {
    case 'male':
      gender_fa = 'آقا';
      break;
    case 'female':
      gender_fa = 'خانم';
      break;
    default:
      gender_fa = userData.gender || 'ثبت نشده';
  }

  // پردازش آدرس‌ها
  const addresses = (userData.addresses || []).map(addr => ({
    ...addr,
    type_fa: addr.type === 'home' ? 'منزل' :
        addr.type === 'work' ? 'محل کار' :
            addr.type === 'other' ? 'سایر' : addr.type
  }));

  return {
    ...userData,
    role_fa,
    gender_fa,
    addresses,
    wallet_balance: userData.wallet_balance || 0,
    order_count: userData.order_count || 0,
    rating: userData.rating || 0,
    special_discount: userData.special_discount || 0
  };
};

// دریافت جزئیات کاربر از API
const fetchUserDetails = async () => {
  if (!props.userId) {
    error.value = 'شناسه کاربر مشخص نیست';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await UserApi.getUser(props.userId);
    user.value = processUserData(response.data);
  } catch (err) {
    console.error('خطا در دریافت جزئیات کاربر:', err);
    error.value = err.response?.data?.message || 'خطا در دریافت اطلاعات کاربر';
    user.value = null;
  } finally {
    loading.value = false;
  }
};

// آپدیت وضعیت کاربر
const updateUserStatus = async () => {
  if (!props.userId || !selectedStatus.value) {
    return;
  }

  if (selectedStatus.value === user.value?.status) {
    return;
  }

  statusUpdating.value = true;

  try {
    const data = {
      status: selectedStatus.value
    };

    const response = await UserApi.updateUserStatus(props.userId, data);

    // آپدیت وضعیت در state
    selectedStatus.value = response.data.status;
    if (user.value) {
      user.value.status = response.data.status;
    }

    // ارسال event به parent
    emit('status-updated', {
      userId: props.userId,
      newStatus: selectedStatus.value,
      user: user.value
    });

    // نمایش پیام موفقیت
    const statusName = selectedStatus.value === 'active' ? 'فعال' :
        selectedStatus.value === 'inactive' ? 'غیرفعال' :
            selectedStatus.value === 'suspended' ? 'تعلیق شده' : 'مسدود شده';
    alert(`✅ وضعیت کاربر با موفقیت به "${statusName}" تغییر یافت.`);

  } catch (err) {
    console.error('خطا در بروزرسانی وضعیت:', err);

    // بازگشت به وضعیت قبلی
    selectedStatus.value = user.value?.status || '';

    const errorMessage = err.response?.data?.message ||
        err.response?.data?.status?.[0] ||
        err.message ||
        'خطا در بروزرسانی وضعیت کاربر';
    alert(`❌ خطا: ${errorMessage}`);
  } finally {
    statusUpdating.value = false;
  }
};

// تغییر آواتار
const changeAvatar = () => {
  // این قسمت نیاز به پیاده‌سازی آپلود فایل دارد
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // ارسال به سرور
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await UserApi.updateAvatar(props.userId, formData);
        if (response.data.avatar) {
          user.value.avatar = response.data.avatar;
          alert('✅ عکس پروفایل با موفقیت تغییر کرد.');
        }
      } catch (err) {
        console.error('خطا در تغییر عکس:', err);
        alert('❌ خطا در تغییر عکس پروفایل');
      }
    }
  };
  input.click();
};

// حذف آواتار
const removeAvatar = async () => {
  if (!confirm('آیا از حذف عکس پروفایل اطمینان دارید؟')) return;

  try {
    await UserApi.removeAvatar(props.userId);
    user.value.avatar = null;
    alert('✅ عکس پروفایل حذف شد.');
  } catch (err) {
    console.error('خطا در حذف عکس:', err);
    alert('❌ خطا در حذف عکس پروفایل');
  }
};

// بازکردن نقشه آدرس
const openAddressMap = (address) => {
  if (!address?.location) return;
  const lat = address.location.latitude;
  const lng = address.location.longitude;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=fa`;
  window.open(mapsUrl, '_blank');
};

// افزودن یادداشت
const addNote = async () => {
  if (!newNote.value.trim()) return;

  try {
    const data = {
      content: newNote.value.trim(),
      user_id: props.userId
    };

    const response = await UserApi.addUserNote(props.userId, data);

    // اضافه کردن یادداشت جدید به لیست
    if (!user.value.notes) {
      user.value.notes = [];
    }
    user.value.notes.unshift(response.data);

    newNote.value = '';
    alert('✅ یادداشت با موفقیت افزوده شد.');
  } catch (err) {
    console.error('خطا در افزودن یادداشت:', err);
    alert('❌ خطا در افزودن یادداشت');
  }
};

// مشاهده سفارشات کاربر
const showUserOrders = () => {
  if (!user.value) return;
  emit('show-orders', user.value);
};

// مشاهده تراکنش‌های کیف پول
const showWalletTransactions = () => {
  if (!user.value) return;
  emit('show-transactions', user.value);
};

// مشاهده نظرات کاربر
const showUserReviews = () => {
  if (!user.value) return;
  emit('show-reviews', user.value);
};

// ویرایش تخفیف ویژه
const editSpecialDiscount = () => {
  const discount = prompt('درصد تخفیف ویژه جدید را وارد کنید:', user.value.special_discount || 0);
  if (discount !== null) {
    const discountNum = parseInt(discount);
    if (!isNaN(discountNum) && discountNum >= 0 && discountNum <= 100) {
      // ارسال به سرور
      UserApi.updateSpecialDiscount(props.userId, { discount: discountNum })
          .then(() => {
            user.value.special_discount = discountNum;
            alert('✅ تخفیف ویژه با موفقیت بروزرسانی شد.');
          })
          .catch(err => {
            console.error('خطا در بروزرسانی تخفیف:', err);
            alert('❌ خطا در بروزرسانی تخفیف');
          });
    } else {
      alert('❌ درصد تخفیف باید بین ۰ تا ۱۰۰ باشد.');
    }
  }
};

// ویرایش کاربر
const editUser = () => {
  if (!user.value) return;
  emit('edit', user.value);
};

// ارسال نوتیفیکیشن
const sendNotification = () => {
  emit('notify', user.value);
};

// خروجی گرفتن اطلاعات کاربر
const exportUserData = () => {
  if (!user.value) return;

  const dataStr = JSON.stringify(user.value, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `user-${user.value.phone_number}-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// ویرایش آدرس
const editAddress = (address) => {
  emit('address-selected', { action: 'edit', address });
};

// حذف آدرس
const deleteAddress = (address) => {
  if (!confirm('آیا از حذف این آدرس اطمینان دارید؟')) return;

  UserApi.deleteAddress(address.id)
      .then(() => {
        user.value.addresses = user.value.addresses.filter(a => a.id !== address.id);
        alert('✅ آدرس با موفقیت حذف شد.');
      })
      .catch(err => {
        console.error('خطا در حذف آدرس:', err);
        alert('❌ خطا در حذف آدرس');
      });
};

// بستن مودال
const close = () => {
  isVisible.value = false;
  emit('update:modelValue', false);
  emit('close');
};

const onClose = () => {
  // Reset state when modal closes
  setTimeout(() => {
    user.value = null;
    error.value = null;
    loading.value = false;
    selectedStatus.value = '';
    statusUpdating.value = false;
    newNote.value = '';
  }, 300);
};

// واچر برای تغییر userId
watch(() => props.userId, (newUserId) => {
  if (newUserId && isVisible.value) {
    fetchUserDetails();
  }
});

// واچر برای تغییر modelValue
watch(() => props.modelValue, (newVal) => {
  isVisible.value = newVal;
  if (newVal && props.userId) {
    // اگر initialData داریم، از آن استفاده می‌کنیم
    if (props.initialData) {
      user.value = processUserData(props.initialData);
    } else {
      fetchUserDetails();
    }
  }
});

// واچر برای isVisible
watch(isVisible, (newVal) => {
  if (!newVal && props.modelValue) {
    emit('update:modelValue', false);
  }
});

// تعریف متدهای عمومی
defineExpose({
  open: () => {
    isVisible.value = true;
    if (props.userId) {
      fetchUserDetails();
    }
  },
  close,
  fetchUserDetails,
  updateUserStatus: (status) => {
    selectedStatus.value = status;
    return updateUserStatus();
  },
  refresh: () => {
    if (props.userId && isVisible.value) {
      fetchUserDetails();
    }
  }
});
</script>

<style scoped>
.user-details-content {
  padding: 4px;
}

/* حالت لودینگ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #6c757d;
  margin: 0;
}

/* حالت خطا */
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-state .error-icon {
  font-size: 3rem;
  color: #ff6b6b;
  margin-bottom: 16px;
}

.error-state h4 {
  color: #721c24;
  margin-bottom: 8px;
}

.error-state p {
  color: #6c757d;
  margin-bottom: 20px;
}

.retry-btn {
  background: #4dabf7;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.retry-btn:hover {
  background: #339af0;
}

/* بخش آواتار */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.avatar-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #4dabf7;
  background: #f8f9fa;
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4dabf7, #339af0);
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.change-btn {
  background: #51cf66;
  color: white;
}

.change-btn:hover {
  background: #40c057;
}

.remove-btn {
  background: #ff6b6b;
  color: white;
}

.remove-btn:hover {
  background: #fa5252;
}

/* بخش‌های اطلاعات */
.user-info-section,
.financial-info-section,
.addresses-section,
.notes-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.user-info-section:last-child,
.financial-info-section:last-child,
.addresses-section:last-child,
.notes-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

h4 {
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* گرید اطلاعات */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 500;
  word-break: break-word;
}

.phone-link {
  color: #1971c2;
  text-decoration: none;
  font-family: 'Courier New', monospace;
}

.phone-link:hover {
  text-decoration: underline;
}

.email-link {
  color: #1971c2;
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

/* کارت‌های آمار مالی */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  border: 2px solid #dee2e6;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
}

.stat-value {
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
}

.stat-action {
  background: #4dabf7;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.stat-action:hover {
  background: #339af0;
}

/* لیست آدرس‌ها */
.addresses-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.address-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.address-card:hover {
  border-color: #4dabf7;
  box-shadow: 0 2px 8px rgba(77, 171, 247, 0.1);
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.address-header h5 {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
}

.address-type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.address-type.home {
  background: #d1ecf1;
  color: #0c5460;
}

.address-type.work {
  background: #fff3cd;
  color: #856404;
}

.address-type.other {
  background: #f8d7da;
  color: #721c24;
}

.address-details {
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 12px;
}

.address-location {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.coordinates {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #6c757d;
}

.small-map-btn {
  background: #51cf66;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.small-map-btn:hover {
  background: #40c057;
}

.address-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.address-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

.address-action.edit-btn {
  background: #4dabf7;
  color: white;
}

.address-action.edit-btn:hover {
  background: #339af0;
}

.address-action.delete-btn {
  background: #ff6b6b;
  color: white;
}

.address-action.delete-btn:hover {
  background: #fa5252;
}

/* بخش یادداشت‌ها */
.notes-container {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.notes-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 16px;
}

.note-item {
  padding: 12px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-right: 4px solid #4dabf7;
}

.note-item:last-child {
  margin-bottom: 0;
}

.note-content {
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 8px;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6c757d;
}

.no-notes {
  padding: 32px;
  text-align: center;
  color: #6c757d;
}

.add-note {
  padding: 16px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.note-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  margin-bottom: 12px;
}

.note-textarea:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.1);
}

.add-note-btn {
  background: #51cf66;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
}

.add-note-btn:hover:not(:disabled) {
  background: #40c057;
}

.add-note-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* کنترل وضعیت */
.status-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-select {
  padding: 6px 12px;
  border: 2px solid #4dabf7;
  border-radius: 6px;
  background-color: white;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.2s ease;
}

.status-select:focus {
  outline: none;
  border-color: #339af0;
  box-shadow: 0 0 0 3px rgba(51, 154, 240, 0.1);
}

.status-select:disabled {
  background-color: #f8f9fa;
  border-color: #adb5bd;
  cursor: not-allowed;
  opacity: 0.7;
}

.status-select:hover:not(:disabled) {
  border-color: #339af0;
}

.status-updating {
  font-size: 0.8rem;
  color: #6c757d;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

/* بج نقش */
.role-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  min-width: 100px;
}

.role-admin {
  background: linear-gradient(135deg, #ff6b6b, #fa5252);
  color: white;
}

.role-staff {
  background: linear-gradient(135deg, #4dabf7, #339af0);
  color: white;
}

.role-customer {
  background: linear-gradient(135deg, #51cf66, #40c057);
  color: white;
}

.role-vendor {
  background: linear-gradient(135deg, #ffd43b, #fcc419);
  color: #2c3e50;
}

/* دکمه‌های اقدام */
.modal-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notify-btn {
  background-color: #ffd43b;
  color: #2c3e50;
}

.notify-btn:hover:not(:disabled) {
  background-color: #fcc419;
}

.export-btn {
  background-color: #868e96;
  color: white;
}

.export-btn:hover:not(:disabled) {
  background-color: #6c757d;
}

.edit-btn {
  background-color: #4dabf7;
  color: white;
}

.edit-btn:hover:not(:disabled) {
  background-color: #339af0;
}

.close-btn {
  background-color: #6c757d;
  color: white;
}

.close-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .avatar-actions {
    flex-direction: row;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .addresses-list {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .address-location {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>