<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import type { Stock } from './types';
import StockDetailModal from './components/StockDetailModal.vue';

// 'TW' 代表台股，'US' 代表美股
const currentMarket = ref<'TW' | 'US'>('TW');

const stockList = ref<Stock[]>([]);
const searchQuery = ref(''); 
const selectedStock = ref<Stock | null>(null);

// 獲取股票清單 (根據當前市場切換 API 參數)
const fetchStockList = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/stocks?market=${currentMarket.value}`);
    stockList.value = response.data; 
  } catch (error) {
    console.error(`無法取得 ${currentMarket.value} 清單，啟用模擬資料`);
    const mockStocks = [];
    if (currentMarket.value === 'TW') {
      for (let i = 1101; i < 1130; i++) {
        const basePrice = (Math.random() * 100 + 50);
        mockStocks.push({ 
          name: `台股模擬 ${i}`, id: `${i}`, 
          buy: (basePrice - 0.1).toFixed(2), sell: (basePrice + 0.1).toFixed(2),
          price: basePrice.toFixed(2), 
          change: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 2).toFixed(2),
          volume: Math.floor(Math.random() * 5000).toLocaleString()
        });
      }
    } else {
      const usTickers = [
        { id: 'AAPL', name: '蘋果公司' }, { id: 'NVDA', name: '輝達' },
        { id: 'TSLA', name: '特斯拉' }, { id: 'MSFT', name: '微軟' },
        { id: 'AMZN', name: '亞馬遜' }, { id: 'GOOGL', name: 'Alphabet' }
      ];
      usTickers.forEach(ticker => {
        const basePrice = (Math.random() * 200 + 100);
        mockStocks.push({ 
          name: ticker.name, id: ticker.id, 
          buy: (basePrice - 0.05).toFixed(2), sell: (basePrice + 0.05).toFixed(2),
          price: basePrice.toFixed(2), 
          change: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 3).toFixed(2),
          volume: Math.floor(Math.random() * 20000).toLocaleString()
        });
      });
    }
    stockList.value = mockStocks;
  }
};

const switchMarket = (market: 'TW' | 'US') => {
  currentMarket.value = market;
  searchQuery.value = '';
  fetchStockList();
};

// 搜尋過濾
const filteredStocks = computed(() => {
  const query = searchQuery.value.trim().toUpperCase();
  if (!query) return stockList.value;
  return stockList.value.filter(s => s.id.toUpperCase().includes(query) || s.name.includes(query));
});

// 🚀 核心改動：根據市場決定漲跌 Class
const getPriceClass = (change: string) => {
  const isPlus = change.includes('+');
  const isMinus = change.includes('-');
  
  if (currentMarket.value === 'TW') {
    if (isPlus) return 'text-up-tw';
    if (isMinus) return 'text-down-tw';
  } else {
    if (isPlus) return 'text-up-us';
    if (isMinus) return 'text-down-us';
  }
  return '';
};

onMounted(fetchStockList);
</script>

<template>
  <div class="stock-app">
    <header>
      <div class="header-content">
        <h1>AI 股市分析監控中心</h1>
        
        <div class="market-tabs">
          <button class="tab-btn" :class="{ active: currentMarket === 'TW' }" @click="switchMarket('TW')">
            🇹🇼 台灣股市
          </button>
          <button class="tab-btn" :class="{ active: currentMarket === 'US' }" @click="switchMarket('US')">
            🇺🇸 美國股市
          </button>
        </div>

        <div class="status-bar">
          顯示：{{ currentMarket === 'TW' ? '台股' : '美股' }}總覽 | {{ filteredStocks.length }} 檔商品
        </div>
        
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="currentMarket === 'TW' ? '輸入代碼或名稱搜尋股票...' : '輸入美股代號 (如 AAPL)...'" 
            class="search-input"
          />
        </div>
      </div>
      
      <div class="stock-list-header">
        <div class="col-product">商品</div>
        <div class="col-buy">買進</div>
        <div class="col-sell">賣出</div>
        <div class="col-price">成交</div>
        <div class="col-change">漲跌</div>
        <div class="col-vol">總量</div>
      </div>
    </header>

    <main class="stock-list">
      <div 
        v-for="stock in filteredStocks" 
        :key="stock.id" 
        class="stock-row" 
        @click="selectedStock = stock"
      >
        <div class="col-product">
          <span class="name">{{ stock.name }}</span>
          <span class="id">{{ stock.id }}</span>
        </div>
        <div class="col-buy data-cell">{{ stock.buy }}</div>
        <div class="col-sell data-cell">{{ stock.sell }}</div>
        <div class="col-price price data-cell" :class="getPriceClass(stock.change)">{{ stock.price }}</div>
        <div class="col-change change data-cell" :class="getPriceClass(stock.change)">{{ stock.change }}</div>
        <div class="col-vol volume data-cell">{{ stock.volume }}</div>
      </div>
    </main>

    <transition name="fade">
      <StockDetailModal 
        v-if="selectedStock"
        :stock="selectedStock" 
        :market="currentMarket"
        @close="selectedStock = null" 
      />
    </transition>
  </div>
</template>

<style scoped>
/* 強制覆蓋 style.css 帶來的限制，達到極致滿版 */
:deep(html), :deep(body), :deep(#app) {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
  background-color: #0c0c0c !important;
  overflow: hidden !important;
  display: block !important;
  border: none !important;
}

.stock-app { 
  background-color: #0c0c0c; 
  color: #e0e0e0; 
  width: 100%; 
  height: 100vh; 
  padding: 20px; 
  font-family: sans-serif; 
  box-sizing: border-box;
  display: flex;
  flex-direction: column; 
}

header { flex-shrink: 0; }
.header-content { text-align: center; margin-bottom: 15px; }
.header-content h1 { 
  margin: 10px 0 20px 0 !important; /* 🚀 關鍵：把第三個參數（下邊距）放大到 24px 或 32px */
  color: #fff;
  font-size: 36px; /* 配合你 style.css 的級距，也可以維持原樣 */
  letter-spacing: -1px;
}
.status-bar { color: #888; font-size: 0.9rem; margin: 8px 0; }
.search-container { display: flex; justify-content: center; }

/* Tabs 樣式 */
.market-tabs {
  display: inline-flex;
  background: #1a1a1a;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #333;
  margin-bottom: 5px;
}
.tab-btn {
  background: transparent; border: none; color: #888;
  padding: 6px 20px; font-size: 0.95rem; font-weight: bold;
  cursor: pointer; border-radius: 6px; transition: all 0.2s;
}
.tab-btn:hover { color: #fff; }
.tab-btn.active { background: #2c2c2e; color: #f1c40f; }

.search-input {
  background-color: #1a1a1a; border: 1px solid #333333; border-radius: 6px;         
  color: #d1d1d1; padding: 10px 15px; outline: none; width: 100%; max-width: 500px;
}

.stock-list-header, .stock-row {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  padding: 15px 20px; align-items: center; border-bottom: 1px solid #222; box-sizing: border-box;
}
.stock-list-header { background: #1a1a1a; font-weight: bold; color: #888; margin-top: 15px; border-top: 1px solid #333; }
.stock-list-header div { text-align: right; }
.stock-list-header .col-product { text-align: left; }

.stock-list { flex: 1; overflow-y: auto; background: #0f0f0f; }
.stock-row { background: #0f0f0f; cursor: pointer; transition: background 0.2s; }
.stock-row:hover { background: #1c1c1c; }

.col-product { display: flex; flex-direction: column; align-items: flex-start; }
.id { color: #666; font-size: 0.85rem; margin-top: 2px; }
.data-cell { font-family: monospace; font-size: 1.1rem; text-align: right; }
.col-buy, .col-sell { color: #aaaaaa; }
.name { color: #f1c40f; font-weight: bold; }

/* 漲跌顏色分配 */
.text-up-tw { color: #ff3b30; }   /* 台股紅漲 */
.text-down-tw { color: #34c759; } /* 台股綠跌 */
.text-up-us { color: #34c759; }   /* 美股綠漲 */
.text-down-us { color: #ff3b30; } /* 美股紅跌 */

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>