<template>
  <div class="custom">
    <template v-if="customData.businessID === CHAT_MSG_CUSTOM_TYPE.SERVICE">
      <div>
        <h1>
          <label>{{ extension.title }}</label>
          <a
            v-if="extension.hyperlinks_text"
            :href="extension.hyperlinks_text.value"
            target="view_window"
          >{{ extension.hyperlinks_text.key }}</a>
        </h1>
        <ul v-if="extension.item && extension.item.length > 0">
          <li
            v-for="(item, index) in extension.item"
            :key="index"
          >
            <a
              v-if="isUrl(item.value)"
              :href="item.value"
              target="view_window"
            >{{ item.key }}</a>
            <p v-else>
              {{ item.key }}
            </p>
          </li>
        </ul>
        <article>{{ extension.description }}</article>
      </div>
    </template>
    <template v-else-if="customData.businessID === CHAT_MSG_CUSTOM_TYPE.EVALUATE">
      <div class="evaluate">
        <h1>{{ TUITranslateService.t("message.custom.对本次服务评价") }}</h1>
        <ul class="evaluate-list">
          <li
            v-for="(item, index) in Math.max(customData.score, 0)"
            :key="index"
            class="evaluate-list-item"
          >
            <Icon
              :file="star"
              class="file-icon"
            />
          </li>
        </ul>
        <article>{{ customData.comment }}</article>
      </div>
    </template>
    <template v-else-if="customData.businessID === CHAT_MSG_CUSTOM_TYPE.ORDER">
      <div
        class="order"
        @click="openLink(customData.link)"
      >
        <img
          :src="customData.imageUrl"
        >
        <main>
          <h1>{{ customData.title }}</h1>
          <p>{{ customData.description }}</p>
          <span>{{ customData.price }}</span>
        </main>
      </div>
    </template>
    <template v-else-if="customData.businessID === CHAT_MSG_CUSTOM_TYPE.LINK">
      <div class="textLink">
        <p>{{ customData.text }}</p>
        <a
          :href="customData.link"
          target="view_window"
        >{{
          TUITranslateService.t("message.custom.查看详情>>")
        }}</a>
      </div>
    </template>
    <template v-else-if="customData.source === 'voice_conversation'">
      <div class="voice-transcript" :class="customData.role">
        <span class="voice-icon">🎙</span>
        <span class="voice-text">{{ customData.text }}</span>
      </div>
    </template>
    <!-- QuickCafé IM Cards -->
    <template v-else-if="customData.type === 'menu_card'">
      <div class="cafe-card menu-card">
        <div class="cafe-card-header">
          <span class="cafe-card-icon">☕</span>
          <div>
            <div class="cafe-card-title">QuickCafé Menu</div>
            <div class="cafe-card-sub">Today's selections</div>
          </div>
        </div>
        <div class="menu-items">
          <div v-for="item in customData.items" :key="item.name" class="menu-item">
            <div class="menu-item-info">
              <span class="menu-item-name">{{ item.name }}</span>
              <span class="menu-item-desc">{{ item.desc }}</span>
            </div>
            <div class="menu-item-prices">
              <span class="price-r">R ${{ Number(item.priceR).toFixed(2) }}</span>
              <span class="price-l">L ${{ Number(item.priceL).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div class="menu-footer">
          <span>Milk: Regular / Oat (+$0.80) / Soy (+$0.80)</span>
          <span>Sugar: Regular / Less / None</span>
        </div>
      </div>
    </template>
    <template v-else-if="customData.type === 'order_card'">
      <div class="cafe-card order-card">
        <div class="cafe-card-header">
          <span class="cafe-card-icon">📋</span>
          <div>
            <div class="cafe-card-title">Order Summary</div>
            <div class="cafe-card-sub">Review your order</div>
          </div>
        </div>
        <div class="order-body">
          <div class="order-main">
            <span class="order-drink">{{ customData.drink }}</span>
            <span class="order-price">${{ Number(customData.price).toFixed(2) }}</span>
          </div>
          <div class="order-details">
            <div class="order-detail"><span class="detail-label">Size</span><span>{{ customData.size }}</span></div>
            <div class="order-detail"><span class="detail-label">Temp</span><span>{{ customData.temp }}</span></div>
            <div class="order-detail"><span class="detail-label">Milk</span><span>{{ customData.milk }}</span></div>
            <div class="order-detail"><span class="detail-label">Sugar</span><span>{{ customData.sugar }}</span></div>
          </div>
          <div v-if="customData.promo" class="order-promo">🏷️ {{ customData.promo }}</div>
          <div class="order-total">
            <span>Total</span>
            <span class="total-amount">${{ Number(customData.total).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="customData.type === 'confirmation_card'">
      <div class="cafe-card confirm-card">
        <div class="cafe-card-header confirm-header">
          <span class="cafe-card-icon">✅</span>
          <div>
            <div class="cafe-card-title">Order Confirmed!</div>
            <div class="cafe-card-sub">{{ customData.drink }}</div>
          </div>
        </div>
        <div class="confirm-body">
          <div class="confirm-grid">
            <div class="confirm-item"><span class="confirm-label">Order #</span><span class="confirm-value">{{ customData.orderNo }}</span></div>
            <div class="confirm-item"><span class="confirm-label">Status</span><span class="confirm-value"><span class="status-dot"></span> Preparing</span></div>
            <div class="confirm-item"><span class="confirm-label">Ready in</span><span class="confirm-value confirm-highlight">~{{ customData.eta }} min</span></div>
            <div class="confirm-item"><span class="confirm-label">Total</span><span class="confirm-value confirm-highlight">${{ Number(customData.total).toFixed(2) }}</span></div>
          </div>
          <div class="confirm-progress">
            <div class="progress-bar"><div class="progress-fill"></div></div>
            <div class="progress-steps">
              <span class="step done">Ordered</span>
              <span class="step done">Preparing</span>
              <span class="step">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- Doctor Anywhere IM Cards -->
    <template v-else-if="customData.type === 'service_menu_card'">
      <div class="medi-card service-menu-card">
        <div class="medi-card-header">
          <span class="medi-card-icon">&#9764;</span>
          <div>
            <div class="medi-card-title">Our Services</div>
            <div class="medi-card-sub">Doctor Anywhere</div>
          </div>
        </div>
        <div class="service-list">
          <div v-for="svc in customData.services" :key="svc.name" class="service-item">
            <div class="service-icon-wrap">
              <span v-if="svc.icon === 'video'" class="service-icon">&#128249;</span>
              <span v-else-if="svc.icon === 'specialist'" class="service-icon">&#129658;</span>
              <span v-else-if="svc.icon === 'screening'" class="service-icon">&#128202;</span>
              <span v-else-if="svc.icon === 'wellness'" class="service-icon">&#128156;</span>
              <span v-else class="service-icon">&#127968;</span>
            </div>
            <div class="service-info">
              <div class="service-name-row">
                <span class="service-name">{{ svc.name }}</span>
                <span v-if="svc.tag" class="service-tag">{{ svc.tag }}</span>
              </div>
              <span class="service-desc">{{ svc.desc }}</span>
            </div>
            <span class="service-price">{{ svc.price }}</span>
          </div>
        </div>
        <div class="service-footer">
          <span>&#128666; Medication delivered within 3 hours</span>
        </div>
      </div>
    </template>
    <template v-else-if="customData.type === 'doctor_list_card'">
      <div class="medi-card doctor-list-card">
        <div class="medi-card-header">
          <span class="medi-card-icon">&#129458;</span>
          <div>
            <div class="medi-card-title">Available Doctors</div>
            <div class="medi-card-sub">Teleconsult</div>
          </div>
        </div>
        <div class="doctor-list">
          <div v-for="doc in customData.doctors" :key="doc.name" class="doctor-item">
            <div class="doctor-avatar">{{ doc.avatar }}</div>
            <div class="doctor-info">
              <span class="doctor-name">{{ doc.name }}</span>
              <span class="doctor-specialty">{{ doc.specialty }}</span>
              <span class="doctor-hours">{{ doc.available }}</span>
            </div>
            <span class="doctor-fee">${{ Number(doc.fee).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="customData.type === 'appointment_card'">
      <div class="medi-card appointment-card">
        <div class="medi-card-header appt-confirmed-header">
          <span class="medi-card-icon">&#10004;</span>
          <div>
            <div class="medi-card-title">Appointment Confirmed!</div>
            <div class="medi-card-sub">{{ customData.doctor }}</div>
          </div>
        </div>
        <div class="appt-body">
          <div class="appt-grid">
            <div class="appt-item"><span class="appt-label">Booking Ref</span><span class="appt-value">{{ customData.confirmationNo }}</span></div>
            <div class="appt-item"><span class="appt-label">Type</span><span class="appt-value">{{ customData.consultType }}</span></div>
            <div class="appt-item"><span class="appt-label">Date</span><span class="appt-value appt-highlight">{{ customData.date }}</span></div>
            <div class="appt-item"><span class="appt-label">Time</span><span class="appt-value appt-highlight">{{ customData.time }}</span></div>
            <div class="appt-item"><span class="appt-label">Patient</span><span class="appt-value">{{ customData.patientName }}</span></div>
            <div class="appt-item"><span class="appt-label">Fee</span><span class="appt-value appt-highlight">${{ Number(customData.fee).toFixed(2) }}</span></div>
          </div>
          <div class="appt-reminder">
            <span>&#128339;</span>
            <span>Reminder will be sent 1 hour before</span>
          </div>
          <div class="appt-med-delivery">
            <span>&#128666;</span>
            <span>Medication can be delivered within 3 hours</span>
          </div>
          <div class="appt-cal-actions">
            <button v-if="calendarSynced" class="appt-cal-btn synced" disabled>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              Added
            </button>
            <button v-else-if="calendarAdding" class="appt-cal-btn google" disabled>
              <span class="appt-btn-spinner"></span>
            </button>
            <button v-else-if="gcConnected" class="appt-cal-btn google" @click.stop="autoAddToGCal(customData)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Add to Calendar
            </button>
            <button v-else-if="gcConfigured" class="appt-cal-btn google connect" @click.stop="connectGCal">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Connect
            </button>
            <button v-else class="appt-cal-btn google" @click.stop="openGoogleCal(customData)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Calendar
            </button>
            <button class="appt-cal-btn ics" @click.stop="downloadICS(customData)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              .ics
            </button>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <span v-html="content.custom" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { watchEffect, ref } from '../../../../adapter-vue';
import { TUITranslateService, IMessageModel } from '@tencentcloud/chat-uikit-engine-lite';
import { isUrl, JSONToObject } from '../../../../utils/index';
import { CHAT_MSG_CUSTOM_TYPE } from '../../../../constant';
import { ICustomMessagePayload } from '../../../../interface';
import Icon from '../../../common/Icon.vue';
import star from '../../../../assets/icon/star-light.png';
import { buildCalendarEvent, generateGoogleCalendarUrl, downloadICSFile } from '../../../../../utils/calendar';
import { getGoogleCalendarStatus, getGoogleAuthUrl, addToGoogleCalendar } from '../../../../../services/api';
interface Props {
  messageItem: IMessageModel;
  content: any;
}

const props = withDefaults(defineProps<Props>(), {
  messageItem: undefined,
  content: undefined,
});

const custom = ref();
const message = ref<IMessageModel>();
const extension = ref();
const customData = ref<ICustomMessagePayload>({
  businessID: '',
});

// Google Calendar state
const gcConfigured = ref(false);
const gcConnected = ref(false);
const calendarAdding = ref(false);
const calendarSynced = ref(false);
const gcUserId = 'demo_user_001';

// Check Google Calendar status on mount
(async () => {
  try {
    const status = await getGoogleCalendarStatus(gcUserId);
    gcConfigured.value = status.configured;
    gcConnected.value = status.connected;
  } catch { /* not available */ }
})();

// Listen for OAuth completion
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.data?.type === 'google-calendar-connected') {
      gcConnected.value = true;
    }
  });
}

watchEffect(() => {
  custom.value = props.content;
  message.value = props.messageItem;
  const { payload } = props.messageItem;
  customData.value = payload.data || '';
  customData.value = JSONToObject(payload.data);
  if (payload.data === CHAT_MSG_CUSTOM_TYPE.SERVICE) {
    extension.value = JSONToObject(payload.extension);
  }
});
const openLink = (url: any) => {
  window.open(url);
};

function openGoogleCal(data: any) {
  const event = buildCalendarEvent(data);
  window.open(generateGoogleCalendarUrl(event), '_blank');
}

function downloadICS(data: any) {
  const event = buildCalendarEvent(data);
  downloadICSFile(event);
}

async function connectGCal() {
  try {
    const authUrl = await getGoogleAuthUrl(gcUserId);
    window.open(authUrl, 'google-auth', 'width=500,height=600,popup=yes');
  } catch (err) {
    console.error('Failed to start Google auth:', err);
  }
}

async function autoAddToGCal(data: any) {
  calendarAdding.value = true;
  try {
    await addToGoogleCalendar(gcUserId, data);
    calendarSynced.value = true;
  } catch {
    openGoogleCal(data);
  } finally {
    calendarAdding.value = false;
  }
}
</script>
<style lang="scss" scoped>
@import "../../../../assets/styles/common";

a {
  color: #679ce1;
}

.custom {
  font-size: 14px;

  h1 {
    font-size: 14px;
    color: #000;
  }

  h1,
  a,
  p {
    font-size: 14px;
  }

  .evaluate {
    ul {
      display: flex;
      padding: 10px 0;
    }

    &-list {
      display: flex;
      flex-direction: row;

      &-item {
        padding: 0 2px;
      }
    }
  }

  .voice-transcript {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 14px;
    line-height: 1.5;

    .voice-icon {
      flex-shrink: 0;
    }

    .voice-text {
      word-break: break-word;
    }

    &.assistant {
      color: #1890ff;
    }
  }

  .order {
    display: flex;

    main {
      padding-left: 5px;

      p {
        font-family: PingFangSC-Regular;
        width: 145px;
        line-height: 17px;
        font-size: 14px;
        color: #999;
        letter-spacing: 0;
        margin-bottom: 6px;
        word-break: break-word;
      }

      span {
        font-family: PingFangSC-Regular;
        line-height: 25px;
        color: #ff7201;
      }
    }

    img {
      width: 67px;
      height: 67px;
    }
  }

  /* QuickCafé IM Cards */
  .cafe-card {
    width: 280px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(139,90,43,0.12);
    box-shadow: 0 2px 10px rgba(139,90,43,0.08);
    background: #fff;
    animation: cafeCardIn 0.35s ease-out;
    /* Counteract parent bubble padding */
    margin: -12px;
    word-break: normal;
  }

  @keyframes cafeCardIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .cafe-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: linear-gradient(135deg, #C67C4E, #A0522D);
    color: #fff;
  }

  .cafe-card-header.confirm-header {
    background: linear-gradient(135deg, #2da44e, #1a7f37);
  }

  .cafe-card-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .cafe-card-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.2px;
  }

  .cafe-card-sub {
    font-size: 10px;
    opacity: 0.8;
  }

  /* Menu card */
  .menu-items {
    padding: 6px 10px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 4px;
    border-bottom: 1px solid rgba(139,90,43,0.08);

    &:last-child {
      border-bottom: none;
    }
  }

  .menu-item-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .menu-item-name {
    font-size: 12px;
    font-weight: 600;
    color: #2C1810;
  }

  .menu-item-desc {
    font-size: 10px;
    color: #A08060;
  }

  .menu-item-prices {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .price-r, .price-l {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 3px;
  }

  .price-r {
    color: #6B4F3A;
    background: #F3EDE7;
  }

  .price-l {
    color: #A0522D;
    background: rgba(198,124,78,0.1);
  }

  .menu-footer {
    padding: 8px 14px 10px;
    background: #FAF7F4;
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 10px;
    color: #6B4F3A;
  }

  /* Order card */
  .order-body {
    padding: 14px;
  }

  .order-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(139,90,43,0.1);
  }

  .order-drink {
    font-size: 15px;
    font-weight: 700;
    color: #2C1810;
  }

  .order-price {
    font-size: 14px;
    font-weight: 600;
    color: #C67C4E;
  }

  .order-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }

  .order-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .detail-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #A08060;
  }

  .order-detail > span:last-child {
    font-size: 12px;
    font-weight: 500;
    color: #2C1810;
  }

  .order-promo {
    padding: 7px 10px;
    background: rgba(63,185,80,0.1);
    border: 1px solid rgba(63,185,80,0.2);
    border-radius: 6px;
    color: #2da44e;
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .order-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 2px solid rgba(139,90,43,0.1);
    font-size: 13px;
    font-weight: 600;
    color: #2C1810;
  }

  .total-amount {
    font-size: 18px;
    font-weight: 800;
    color: #A0522D;
  }

  /* Confirmation card */
  .confirm-body {
    padding: 14px;
  }

  .confirm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }

  .confirm-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .confirm-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #A08060;
  }

  .confirm-value {
    font-size: 13px;
    font-weight: 600;
    color: #2C1810;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .confirm-highlight {
    color: #A0522D;
    font-size: 15px;
    font-weight: 800;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2da44e;
    display: inline-block;
    animation: statusPulse 1.5s ease-in-out infinite;
  }

  @keyframes statusPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .confirm-progress {
    .progress-bar {
      height: 4px;
      background: #F3EDE7;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .progress-fill {
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg, #2da44e, #3fb950);
      border-radius: 2px;
    }

    .progress-steps {
      display: flex;
      justify-content: space-between;
    }

    .step {
      font-size: 9px;
      font-weight: 500;
      color: #A08060;

      &.done {
        color: #2da44e;
        font-weight: 600;
      }
    }
  }

  /* ─── Doctor Anywhere IM Cards ────────────────────────────────────── */
  .medi-card {
    width: 290px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(46,134,222,0.12);
    box-shadow: 0 2px 10px rgba(46,134,222,0.08);
    background: #fff;
    animation: cafeCardIn 0.35s ease-out;
    margin: -12px;
    word-break: normal;
  }

  .medi-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: linear-gradient(135deg, #2E86DE, #1B5E9E);
    color: #fff;
  }

  .medi-card-header.appt-confirmed-header {
    background: linear-gradient(135deg, #27ae60, #1e8449);
  }

  .medi-card-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .medi-card-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.2px;
  }

  .medi-card-sub {
    font-size: 10px;
    opacity: 0.8;
  }

  /* Service menu card */
  .service-list {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .service-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    background: #F0F7FF;
    border-radius: 8px;
    border: 1px solid rgba(46,134,222,0.06);
  }

  .service-icon-wrap {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(46,134,222,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .service-icon {
    font-size: 14px;
  }

  .service-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .service-name-row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .service-name {
    font-size: 12px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .service-tag {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 3px;
    background: #27ae60;
    color: #fff;
    letter-spacing: 0.3px;
  }

  .service-desc {
    font-size: 10px;
    color: #888;
  }

  .service-price {
    font-size: 11px;
    font-weight: 700;
    color: #2E86DE;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .service-footer {
    padding: 8px 14px 10px;
    background: #F0F7FF;
    font-size: 10px;
    color: #555;
  }

  /* Doctor list card */
  .doctor-list {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .doctor-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: #F0F7FF;
    border-radius: 8px;
    border: 1px solid rgba(46,134,222,0.06);
  }

  .doctor-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2E86DE, #1B5E9E);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  .doctor-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .doctor-name {
    font-size: 12px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .doctor-specialty {
    font-size: 10px;
    font-weight: 500;
    color: #2E86DE;
  }

  .doctor-hours {
    font-size: 9px;
    color: #888;
  }

  .doctor-fee {
    font-size: 11px;
    font-weight: 700;
    color: #2E86DE;
    flex-shrink: 0;
  }

  /* Appointment card */
  .appt-body {
    padding: 14px;
  }

  .appt-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }

  .appt-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .appt-full {
    grid-column: 1 / -1;
  }

  .appt-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #888;
  }

  .appt-value {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .appt-highlight {
    color: #2E86DE;
    font-size: 15px;
    font-weight: 800;
  }

  .appt-reminder, .appt-med-delivery {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: #F0F7FF;
    border-radius: 6px;
    font-size: 10px;
    color: #666;
    margin-bottom: 6px;
  }

  .appt-med-delivery {
    background: rgba(39,174,96,0.06);
    color: #1e8449;
  }

  .appt-cal-actions {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }

  .appt-cal-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 8px;
    border: none;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .appt-cal-btn.google {
    background: #E8F0FE;
    color: #1A73E8;
  }

  .appt-cal-btn.google:hover {
    background: #D2E3FC;
  }

  .appt-cal-btn.ics {
    background: #F0F0F0;
    color: #333;
  }

  .appt-cal-btn.ics:hover {
    background: #E0E0E0;
  }

  .appt-cal-btn.connect {
    background: #FFF3E0;
    color: #E65100;
  }

  .appt-cal-btn.connect:hover {
    background: #FFE0B2;
  }

  .appt-cal-btn.synced {
    background: #E8F5E9;
    color: #2E7D32;
    cursor: default;
  }

  .appt-cal-btn:disabled {
    opacity: 0.8;
    cursor: default;
  }

  .appt-btn-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(26,115,232,0.3);
    border-top-color: #1A73E8;
    border-radius: 50%;
    animation: apptSpin 0.6s linear infinite;
  }

  @keyframes apptSpin {
    to { transform: rotate(360deg); }
  }
}
</style>
