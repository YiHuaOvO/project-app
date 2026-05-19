<script setup lang="ts">
import { computed } from 'vue';
import type { StockDetail } from '../types';

// 定義 Props 接收父元件傳下來的 detail 資料
const props = defineProps<{
  detail: StockDetail;
}>();

// 計算五檔總計數量
const totalBidVol = computed(() => {
  return props.detail.bidOrders.reduce((sum, item) => sum + parseInt(item.volume.replace(/,/g, '') || '0'), 0).toLocaleString();
});

const totalAskVol = computed(() => {
  return props.detail.askOrders.reduce((sum, item) => sum + parseInt(item.volume.replace(/,/g, '') || '0'), 0).toLocaleString();
});
</script>

<template>
  <div class="sentiment-bar-wrapper">
    <div class="bar-labels">
      <span class="text-down">內盤 {{ detail.insideOrderVol }} ({{ detail.insideOrderPercent }})</span>
      <span class="text-up">{{ detail.outsideOrderPercent }} ({{ detail.outsideOrderVol }}) 外盤</span>
    </div>
    <div class="proportion-bar">
      <div class="bar-inside" :style="{ width: detail.insideOrderPercent }"></div>
      <div class="bar-outside" :style="{ width: detail.outsideOrderPercent }"></div>
    </div>
  </div>

  <div class="five-orders-container">
    <div class="orders-header">
      <span>量</span><span>委買價</span><span>委賣價</span><span>量</span>
    </div>
    <div class="orders-body">
      <div class="order-row" v-for="(_, index) in 5" :key="index">
        <span class="vol text-vol">{{ detail.bidOrders[index]?.volume || '--' }}</span>
        <span class="price bid-p">{{ detail.bidOrders[index]?.price || '--' }}</span>
        <span class="price ask-p">{{ detail.askOrders[index]?.price || '--' }}</span>
        <span class="vol text-vol">{{ detail.askOrders[index]?.volume || '--' }}</span>
      </div>
    </div>
    <div class="orders-footer">
      <span>{{ totalBidVol }}</span>
      <span class="summary-label">小計</span>
      <span class="summary-label">小計</span>
      <span>{{ totalAskVol }}</span>
    </div>
  </div>
</template>

<style scoped>
.sentiment-bar-wrapper { display: flex; flex-direction: column; gap: 4px; margin-top: 5px; }
.bar-labels { display: flex; justify-content: space-between; font-size: 0.85rem; font-family: monospace; font-weight: bold; }
.proportion-bar { height: 8px; display: flex; border-radius: 4px; overflow: hidden; background: #333; }
.bar-inside { background: #34c759; transition: width 0.3s ease; }
.bar-outside { background: #ff3b30; transition: width 0.3s ease; }

.five-orders-container { background: #141416; border: 1px solid #2d2d2d; border-radius: 4px; padding: 10px; font-family: monospace; }
.orders-header, .orders-footer, .order-row { display: grid; grid-template-columns: 1.2fr 1.5fr 1.5fr 1.2fr; text-align: right; align-items: center; }
.orders-header { color: #888; font-size: 0.85rem; padding-bottom: 6px; border-bottom: 1px solid #2d2d2d; }
.orders-header span:first-child, .order-row .vol:first-child, .orders-footer span:first-child { text-align: left; }

.orders-body { padding: 4px 0; }
.order-row { padding: 6px 0; font-size: 1.05rem; border-bottom: 1px solid rgba(255,255,255,0.02); }
.bid-p { color: #34c759; font-weight: bold; padding-right: 15px; }
.ask-p { color: #ff3b30; font-weight: bold; padding-left: 15px; text-align: left; }
.order-row span:last-child { text-align: right; }

.orders-footer { border-top: 1px solid #2d2d2d; padding-top: 6px; font-size: 0.9rem; color: #aaa; }
.summary-label { color: #666; font-size: 0.8rem; }
.orders-footer .summary-label:last-of-type { text-align: left; padding-left: 15px; }

.text-up { color: #ff3b30; }
.text-down { color: #34c759; }
.text-vol { color: #3498db; }
</style>