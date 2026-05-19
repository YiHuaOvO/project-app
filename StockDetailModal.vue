<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import axios from 'axios';
import apexchart from 'vue3-apexcharts'; // 🚀 引入圖表組件
import type { Stock, StockDetail } from '../types';

interface AIDiagnosis {
  sentimentText: string;
  summary: string;
  techAnalysis: string;
  chipAnalysis: string;
}

const props = defineProps<{
  stock: Stock | null;
  market: 'TW' | 'US';
}>();

const emit = defineEmits(['close']);

const loading = ref(false);
const isChartReady = ref(false); // 🚀 確保資料填寫完整才渲染圖表，避免 undefined 錯誤
const chartType = ref<'candlestick' | 'area'>('candlestick');

// 擴充 detail 資料結構，加入圖表點陣欄位
const detail = ref<StockDetail & { chartData?: { timestamps: string[], prices: number[][], linePrices: number[] } }>({
  time: '--', currentPrice: '--', currentVolume: '--',
  tradePrice: '--', openPrice: '--', highPrice: '--', lowPrice: '--', avgPrice: '--', amount: '--',
  prevClose: '--', changePercent: '--', changeValue: '--', totalVolume: '--', prevVolume: '--', amplitude: '--',
  insideOrderVol: '--', insideOrderPercent: '50%', outsideOrderVol: '--', outsideOrderPercent: '50%',
  bidOrders: [], askOrders: []
});

const aiResult = ref<AIDiagnosis>({
  sentimentText: '--', summary: '正在分析中...',
  techAnalysis: '--', chipAnalysis: '--'
});

const getPriceClass = (change: string) => {
  const isPlus = change.includes('+');
  const isMinus = change.includes('-');
  
  if (props.market === 'TW') {
    if (isPlus) return 'text-up-tw';
    if (isMinus) return 'text-down-tw';
  } else {
    if (isPlus) return 'text-up-us';
    if (isMinus) return 'text-down-us';
  }
  return '';
};

// 🚀 動態圖表設定 (不寫死型態，改由 any 迴避嚴格檢查)
const chartOptions = computed<any>(() => {
  const isTW = props.market === 'TW';
  const upColor = isTW ? '#ff3b30' : '#34c759';   // 台股紅漲、美股綠漲
  const downColor = isTW ? '#34c759' : '#ff3b30'; // 台股綠跌、美股紅跌

  return {
    chart: {
      id: 'stock-chart',
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#888'
    },
    theme: { mode: 'dark' },
    xaxis: {
      // 依據圖片提示：直接引入後端陣列，台股 50 點、美股 80 點自動伸縮
      categories: detail.value.chartData?.timestamps || [],
      labels: { style: { fontSize: '11px' } },
      axisBorder: { color: '#2d2d2d' },
      axisTicks: { color: '#2d2d2d' }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => val.toFixed(2),
        style: { fontSize: '11px' }
      },
      tickAmount: 5
    },
    grid: { borderColor: 'rgba(255, 255, 255, 0.04)' },
    plotOptions: {
      candlestick: {
        colors: { upward: upColor, downward: downColor },
        wick: { useFillColor: true }
      }
    },
    colors: [upColor],
    stroke: { width: 2 },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark', shared: true }
  };
});

// 🚀 圖表數據源
const chartSeries = computed(() => {
  if (chartType.value === 'candlestick') {
    return [{
      name: 'K線數據',
      data: detail.value.chartData?.prices || []
    }];
  } else {
    return [{
      name: '即時成交價',
      data: detail.value.chartData?.linePrices || []
    }];
  }
});

watch(() => props.stock, async (newStock) => {
  if (!newStock) return;
  loading.value = true;
  isChartReady.value = false; // 切換股票時先卸載舊圖表
  
  try {
    const response = await axios.post('http://localhost:5000/api/analyze', { 
      stockId: newStock.id,
      market: props.market 
    });
    detail.value = response.data;
    if(response.data.aiDiagnosis) {
      aiResult.value = response.data.aiDiagnosis;
    }
    if (response.data.chartData) {
      isChartReady.value = true;
    }
    loading.value = false;
  } catch (error) {
    console.warn("無法取得即時盤態，立即啟用同步模擬包含圖表之數據");
    
    const priceNum = parseFloat(newStock.price);
    const isUp = newStock.change.includes('+');
    
    // 1. 動態計算點陣長度 (台股 50 點，美股 80 點)
    const pointsCount = props.market === 'TW' ? 50 : 80;
    const timestamps: string[] = [];
    const prices: number[][] = [];
    const linePrices: number[] = [];
    
    let currentMockPrice = priceNum * 0.98;
    
    for (let i = 0; i < pointsCount; i++) {
      // 🚀 修正第一張圖的報錯：將 .append() 改回標準的 .push()
      timestamps.push(`${9 + Math.floor(i/12)}:${(i%12)*5 < 10 ? '0' : ''}${(i%12)*5}`);
      
      const open = currentMockPrice + (Math.random() * 2 - 1);
      const close = open + (Math.random() * 3 - 1.4);
      const high = Math.max(open, close) + Math.random() * 0.8;
      const low = Math.min(open, close) - Math.random() * 0.8;
      
      prices.push([
        parseFloat(open.toFixed(2)), 
        parseFloat(high.toFixed(2)), 
        parseFloat(low.toFixed(2)), 
        parseFloat(close.toFixed(2))
      ]);
      linePrices.push(parseFloat(close.toFixed(2)));
      currentMockPrice = close;
    }

    // 2. 資料同步填入
    detail.value = {
      time: props.market === 'TW' ? "13:30" : "04:00",
      currentPrice: newStock.price,
      currentVolume: Math.floor(Math.random() * 500 + 10).toString(),
      tradePrice: newStock.price,
      openPrice: (priceNum * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2),
      highPrice: (priceNum * 1.02).toFixed(2),
      lowPrice: (priceNum * 0.98).toFixed(2),
      avgPrice: (priceNum * 1.001).toFixed(2),
      amount: props.market === 'TW' ? (Math.random() * 100 + 10).toFixed(2) : '--',
      prevClose: (priceNum * (isUp ? 0.98 : 1.02)).toFixed(2),
      changePercent: newStock.change + '%',
      changeValue: (priceNum * 0.015).toFixed(2),
      totalVolume: newStock.volume,
      prevVolume: Math.floor(Math.random() * 6000).toLocaleString(),
      amplitude: (Math.random() * 4 + 1).toFixed(2) + '%',
      insideOrderVol: "44,590", insideOrderPercent: "50.61%",
      outsideOrderVol: "43,515", outsideOrderPercent: "49.39%",
      bidOrders: [], askOrders: [],
      chartData: { timestamps, prices, linePrices }
    };

    if (isUp) {
      aiResult.value = {
        sentimentText: "強勢多頭趨勢",
        summary: `該股今日買盤意願強烈。在技術層面上呈現帶量向上突破突破格局，AI 模型評估多方動能仍未枯竭。`,
        techAnalysis: "短天期均線呈現多頭排列。KD指標黃金交叉上行，強勢防守位建議觀察今日開盤價附近。",
        chipAnalysis: props.market === 'TW' ? "法人同步呈現買超，大戶持股比連續數週回升，籌碼趨於集中。" : "機構法人淨流入部位擴大，主要做市商買單掛置積極。"
      };
    } else {
      aiResult.value = {
        sentimentText: "高檔獲利調節",
        summary: `股價遭遇短期賣壓修正，伴隨跌破短期支撐均線，多方追價力道暫歇，空方控盤機率增高。`,
        techAnalysis: "日K線跌破 5 日線，短線指標高檔交叉向下，需靜待量縮止跌訊號出現，切勿盲目抄底。",
        chipAnalysis: props.market === 'TW' ? "主力分點淨賣超擴大，融資餘額反向增加，短線上籌碼面偏向凌亂。" : "大型 ETF 及投資機構出現被動調節壓力，短線資金流出明顯。"
      };
    }

    // 🚀 同步關閉 loading 並解鎖圖表守衛，強制立刻渲染
    isChartReady.value = true;
    loading.value = false;
  }
}, { immediate: true });
</script>

<template>
  <div v-if="stock" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <button class="close-btn" @click="emit('close')">×</button>
      
      <div class="modal-header-info">
        <div class="title-group">
          <h2>{{ stock.name }} ({{ stock.id }}) 即時行情 [{{ market }}]</h2>
          <div class="live-ticker" :class="getPriceClass(stock.change)">
            <span class="time">⏱ {{ detail.time }}</span>
            <span class="price-now">價 {{ detail.currentPrice }}</span>
            <span class="vol-now">量 {{ detail.currentVolume }}</span>
          </div>
        </div>
      </div>

      <div class="detail-layout">
        <div class="chart-section">
          <div class="chart-header">
            <div class="section-title">走勢圖 / 技術 K 線</div>
            <div class="chart-tabs">
              <button :class="{ active: chartType === 'candlestick' }" @click="chartType = 'candlestick'">技術 K 線</button>
              <button :class="{ active: chartType === 'area' }" @click="chartType = 'area'">分時走勢</button>
            </div>
          </div>
          
          <div class="chart-container-wrapper">
            <div class="placeholder-text" v-if="loading || !isChartReady">即時數據載入中...</div>
            <apexchart 
              v-else
              :type="chartType" 
              height="100%" 
              width="100%"
              :options="chartOptions" 
              :series="chartSeries" 
            />
          </div>
        </div>

        <div class="data-section">
          <div class="market-grid">
            <div class="grid-item"><span>成交</span><strong :class="getPriceClass(stock.change)">{{ detail.tradePrice }}</strong></div>
            <div class="grid-item"><span>昨收</span><strong>{{ detail.prevClose }}</strong></div>
            <div class="grid-item"><span>開盤</span><strong :class="market === 'TW' ? 'text-up-tw' : 'text-up-us'">{{ detail.openPrice }}</strong></div>
            <div class="grid-item"><span>漲跌幅</span><strong :class="getPriceClass(stock.change)">{{ detail.changePercent }}</strong></div>
            <div class="grid-item"><span>最高</span><strong class="text-up-tw">{{ detail.highPrice }}</strong></div>
            <div class="grid-item"><span>漲跌</span><strong :class="getPriceClass(stock.change)">{{ detail.changeValue }}</strong></div>
            <div class="grid-item"><span>最低</span><strong class="text-down-tw">{{ detail.lowPrice }}</strong></div>
            <div class="grid-item"><span>總量</span><strong>{{ detail.totalVolume }}</strong></div>
            <div class="grid-item"><span>均價</span><strong>{{ detail.avgPrice }}</strong></div>
            <div class="grid-item"><span>昨量</span><strong>{{ detail.prevVolume }}</strong></div>
            <div class="grid-item"><span>{{ market === 'TW' ? '成交金額(億)' : '市場別' }}</span><strong>{{ market === 'TW' ? detail.amount : '美股現貨' }}</strong></div>
            <div class="grid-item"><span>振幅</span><strong>{{ detail.amplitude }}</strong></div>
          </div>

          <div class="ai-analysis-panel">
            <div class="ai-panel-header">
              <div class="section-title ai-title">🤖 AI 智慧大數據診斷</div>
              <span class="sentiment-badge">{{ aiResult.sentimentText }}</span>
            </div>
            
            <div class="ai-text-container">
              <div class="ai-brief">
                <strong>💡 核心觀點：</strong> {{ aiResult.summary }}
              </div>
              <div class="ai-details">
                <div class="detail-block">
                  <span class="label">📈 技術面診斷</span>
                  <p>{{ aiResult.techAnalysis }}</p>
                </div>
                <div class="detail-block">
                  <span class="label">🔍 {{ market === 'TW' ? '籌碼面分析' : '資金流向觀測' }}</span>
                  <p>{{ aiResult.chipAnalysis }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: #1c1c1e; width: 95%; max-width: 1200px; border-radius: 8px; padding: 25px; position: relative; color: #fff; }
.modal-header-info { margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
.modal-header-info h2 { margin: 0 0 5px 0; font-size: 1.4rem; color: #f1c40f; }
.live-ticker { font-size: 0.95rem; display: flex; gap: 20px; font-family: monospace; background: #000; padding: 6px 12px; display: inline-flex; border-radius: 4px; }
.live-ticker .time { color: #888; }

.detail-layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: stretch; }
.chart-section { background: #0a0a0a; border: 1px solid #2d2d2d; padding: 15px; border-radius: 6px; display: flex; flex-direction: column; height: 100%; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.chart-container-wrapper { flex: 1; position: relative; min-height: 420px; height: 100%; width: 100%; }
.section-title { font-weight: bold; border-left: 4px solid #f1c40f; padding-left: 10px; font-size: 1rem; }

.chart-tabs { display: flex; background: #1c1c1e; padding: 2px; border-radius: 4px; border: 1px solid #333; }
.chart-tabs button { background: transparent; border: none; color: #777; font-size: 0.8rem; padding: 4px 12px; cursor: pointer; border-radius: 3px; font-weight: bold; }
.chart-tabs button.active { background: #2d2d2d; color: #f1c40f; }
.placeholder-text { position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); color: #666; font-size: 0.95rem; text-align: center; z-index: 2; }

.data-section { display: flex; flex-direction: column; gap: 15px; }
.market-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: #2d2d2d; border: 1px solid #2d2d2d; border-radius: 4px; overflow: hidden; }
.grid-item { background: #141416; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.92rem; }
.grid-item span { color: #888; }
.grid-item strong { font-family: monospace; font-size: 1.02rem; }

.ai-analysis-panel { background: #141416; border: 1px solid #3a3a3c; border-radius: 6px; padding: 15px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
.ai-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.ai-title { border-left-color: #f1c40f; color: #fff; }
.sentiment-badge { background: #2c2c2e; color: #f1c40f; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; border: 1px solid #48484a; font-weight: bold; }

.ai-text-container { background: #1c1c1e; border-radius: 4px; padding: 12px; font-size: 0.9rem; line-height: 1.5; display: flex; flex-direction: column; gap: 12px; height: 215px; overflow-y: auto; }
.ai-brief { color: #f1c40f; border-bottom: 1px dashed #333; padding-bottom: 8px; }
.ai-details { display: flex; flex-direction: column; gap: 10px; }
.detail-block .label { font-weight: bold; font-size: 0.85rem; color: #3498db; display: block; margin-bottom: 4px; }
.detail-block p { margin: 0; color: #ccc; font-size: 0.85rem; text-align: justify; }

.text-up-tw { color: #ff3b30; }   
.text-down-tw { color: #34c759; } 
.text-up-us { color: #34c759; }   
.text-down-us { color: #ff3b30; } 
.close-btn { position: absolute; top: 15px; right: 20px; background: none; border: none; color: white; font-size: 2rem; cursor: pointer; z-index: 10; }
</style>