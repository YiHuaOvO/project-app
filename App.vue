<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

// 1. 定義資料結構
interface Stock {
  name: string;
  id: string;
  buy: string;    
  sell: string;   
  price: string;  
  change: string; 
  volume: string; 
}

// 重新設計：對齊後端引進的即時盤態資料結構
interface BidAskRow {
  price: string;
  volume: string;
}

interface StockDetail {
  // 左側即時狀態
  time: string;          // 資料時間 (e.g., "2026/05/15 14:30")
  currentPrice: string;  // 即時成交價
  currentVolume: string; // 當前單量 (張)
  
  // 右側精細數據
  tradePrice: string;    // 成交
  openPrice: string;     // 開盤
  highPrice: string;     // 最高
  lowPrice: string;      // 最低
  avgPrice: string;      // 均價
  amount: string;        // 成交金額 (億)
  
  prevClose: string;     // 昨收
  changePercent: string; // 漲跌幅 (e.g., "-0.68%")
  changeValue: string;   // 漲跌價差 (e.g., "-0.65")
  totalVolume: string;   // 總量
  prevVolume: string;    // 昨量
  amplitude: string;     // 振幅
  
  // 內外盤比例
  insideOrderVol: string;     // 內盤量
  insideOrderPercent: string; // 內盤比 (e.g., "50.61%")
  outsideOrderVol: string;    // 外盤量
  outsideOrderPercent: string;// 外盤比 (e.g., "49.39%")

  // 五檔委買委賣資料陣列 (由上到下，或依價格排序)
  bidOrders: BidAskRow[]; // 委買 (買盤)
  askOrders: BidAskRow[]; // 委賣 (賣盤)
}

const stockList = ref<Stock[]>([]);
const searchQuery = ref(''); 
const selectedStock = ref<Stock | null>(null);
const loading = ref(false);

// 初始化詳細盤態資料，預設為 '--' 避免畫面渲染出錯
const detail = ref<StockDetail>({
  time: '--', currentPrice: '--', currentVolume: '--',
  tradePrice: '--', openPrice: '--', highPrice: '--', lowPrice: '--', avgPrice: '--', amount: '--',
  prevClose: '--', changePercent: '--', changeValue: '--', totalVolume: '--', prevVolume: '--', amplitude: '--',
  insideOrderVol: '--', insideOrderPercent: '50%', outsideOrderVol: '--', outsideOrderPercent: '50%',
  bidOrders: [], askOrders: []
});

// 2. 獲取【全部台股】清單
const fetchStockList = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/stocks');
    stockList.value = response.data; 
  } catch (error) {
    console.error("無法取得全台股清單", error);
    const mockStocks = [];
    for (let i = 1101; i < 1150; i++) {
      const basePrice = (Math.random() * 100 + 50);
      mockStocks.push({ 
        name: `模擬股票 ${i}`, 
        id: `${i}`, 
        buy: (basePrice - 0.1).toFixed(2),
        sell: (basePrice + 0.1).toFixed(2),
        price: basePrice.toFixed(2), 
        change: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 2).toFixed(2),
        volume: Math.floor(Math.random() * 5000).toLocaleString()
      });
    }
    stockList.value = mockStocks;
  }
};

// 3. 搜尋過濾功能
const filteredStocks = computed(() => {
  const query = searchQuery.value.trim();
  if (!query) return stockList.value;
  return stockList.value.filter(s => s.id.includes(query) || s.name.includes(query));
});

// 4. 單點分析與引進即時資料邏輯
const selectStock = async (stock: Stock) => {
  selectedStock.value = stock;
  loading.value = true;
  
  try {
    // 呼叫後端 API，獲取最完整的即時盤態大數據
    const response = await axios.post('http://localhost:5000/api/analyze', { stockId: stock.id });
    detail.value = response.data; // 直接將後端符合 StockDetail 結構的資料載入
    loading.value = false;
  } catch (error) {
    console.warn("無法取得即時盤態，啟用模擬串接格式資料");
    setTimeout(() => {
      const priceNum = parseFloat(stock.price);
      const isUp = stock.change.includes('+');
      
      // 模擬後端回傳的完整即時資料結構
      detail.value = {
        time: "2026/05/16 13:30",
        currentPrice: stock.price,
        currentVolume: Math.floor(Math.random() * 500 + 10).toString(),
        
        tradePrice: stock.price,
        openPrice: (priceNum * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2),
        highPrice: (priceNum * 1.02).toFixed(2),
        lowPrice: (priceNum * 0.98).toFixed(2),
        avgPrice: (priceNum * 1.001).toFixed(2),
        amount: (Math.random() * 100 + 10).toFixed(2),
        
        prevClose: (priceNum * (isUp ? 0.98 : 1.02)).toFixed(2),
        changePercent: stock.change + '%',
        changeValue: (priceNum * 0.015).toFixed(2),
        totalVolume: stock.volume,
        prevVolume: Math.floor(Math.random() * 6000).toLocaleString(),
        amplitude: (Math.random() * 4 + 1).toFixed(2) + '%',
        
        insideOrderVol: "44,590",
        insideOrderPercent: "50.61%",
        outsideOrderVol: "43,515",
        outsideOrderPercent: "49.39%",
        
        // 模擬五檔數據
        bidOrders: [
          { price: (priceNum - 0.05).toFixed(2), volume: "537" },
          { price: (priceNum - 0.10).toFixed(2), volume: "371" },
          { price: (priceNum - 0.15).toFixed(2), volume: "1,159" },
          { price: (priceNum - 0.20).toFixed(2), volume: "2,684" },
          { price: (priceNum - 0.25).toFixed(2), volume: "1,135" },
        ],
        askOrders: [
          { price: (priceNum + 0.05).toFixed(2), volume: "17" },
          { price: (priceNum + 0.10).toFixed(2), volume: "41" },
          { price: (priceNum + 0.15).toFixed(2), volume: "52" },
          { price: (priceNum + 0.20).toFixed(2), volume: "20" },
          { price: (priceNum + 0.25).toFixed(2), volume: "183" },
        ]
      };
      loading.value = false;
    }, 500);
  }
};

// 根據漲跌文字動態判斷顏色 Class
const getPriceClass = (change: string) => {
  if (change.includes('+')) return 'text-up';
  if (change.includes('-')) return 'text-down';
  return '';
};

// 計算五檔總計數量 (方便畫面上呈現小計)
const totalBidVol = computed(() => {
  return detail.value.bidOrders.reduce((sum, item) => sum + parseInt(item.volume.replace(/,/g, '') || '0'), 0).toLocaleString();
});
const totalAskVol = computed(() => {
  return detail.value.askOrders.reduce((sum, item) => sum + parseInt(item.volume.replace(/,/g, '') || '0'), 0).toLocaleString();
});

onMounted(fetchStockList);
</script>

<template>
  <div class="stock-app">
    <header>
      <div class="header-content">
        <h1>AI 股市分析監控中心 (台股)</h1>
        <div class="status-bar">當前市場總覽 | 顯示：{{ filteredStocks.length }} 檔</div>
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="輸入代碼或名稱搜尋股票..." 
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
        @click="selectStock(stock)"
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
      <div v-if="selectedStock" class="modal-overlay" @click.self="selectedStock = null">
        <div class="modal-content">
          <button class="close-btn" @click="selectedStock = null">×</button>
          
          <div class="modal-header-info">
            <div class="title-group">
              <h2>{{ selectedStock.name }} ({{ selectedStock.id }}) 即時行情</h2>
              <div class="live-ticker" :class="getPriceClass(selectedStock.change)">
                <span class="time">⏱ {{ detail.time }}</span>
                <span class="price-now">價 {{ detail.currentPrice }}</span>
                <span class="vol-now">量(張) {{ detail.currentVolume }}</span>
              </div>
            </div>
          </div>

          <div class="detail-layout">
            <div class="chart-section">
              <div class="section-title">分時即時走勢圖 / K 線圖</div>
              <div class="chart-placeholder">
                <div class="mock-chart-container">
                  <div class="grid-line" v-for="n in 5" :key="n"></div>
                  <div class="placeholder-text" v-if="loading">即時數據載入中...</div>
                  <div class="placeholder-text" v-else>📊 [動態圖表容器] 支援 Canvas / SVG 動態引進</div>
                </div>
              </div>
            </div>

            <div class="data-section">
              <div class="market-grid">
                <div class="grid-item"><span>成交</span><strong :class="getPriceClass(selectedStock.change)">{{ detail.tradePrice }}</strong></div>
                <div class="grid-item"><span>昨收</span><strong>{{ detail.prevClose }}</strong></div>
                <div class="grid-item"><span>開盤</span><strong class="text-up">{{ detail.openPrice }}</strong></div>
                <div class="grid-item"><span>漲跌幅</span><strong :class="getPriceClass(selectedStock.change)">{{ detail.changePercent }}</strong></div>
                <div class="grid-item"><span>最高</span><strong class="text-up">{{ detail.highPrice }}</strong></div>
                <div class="grid-item"><span>漲跌</span><strong :class="getPriceClass(selectedStock.change)">{{ detail.changeValue }}</strong></div>
                <div class="grid-item"><span>最低</span><strong class="text-down">{{ detail.lowPrice }}</strong></div>
                <div class="grid-item"><span>總量</span><strong>{{ detail.totalVolume }}</strong></div>
                <div class="grid-item"><span>均價</span><strong>{{ detail.avgPrice }}</strong></div>
                <div class="grid-item"><span>昨量</span><strong>{{ detail.prevVolume }}</strong></div>
                <div class="grid-item"><span>成交金額(億)</span><strong>{{ detail.amount }}</strong></div>
                <div class="grid-item"><span>振幅</span><strong>{{ detail.amplitude }}</strong></div>
              </div>

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
                  <div class="order-row" v-for="(item, index) in 5" :key="index">
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

            </div>
          </div>
          
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.stock-app { background-color: #0c0c0c; color: #e0e0e0; min-height: 100vh; padding: 20px; font-family: sans-serif; }

/* Header & Search */
.header-content { text-align: center; margin-bottom: 20px; }
.status-bar { color: #888; font-size: 0.9rem; margin: 10px 0; }
.search-container { display: flex; justify-content: center; }

.search-input {
  background-color: #1a1a1a; 
  border: 1px solid #333333; 
  border-radius: 6px;         
  color: #d1d1d1;             
  padding: 10px 15px;
  outline: none;             
  transition: border-color 0.3s ease;
  width: 100%; max-width: 500px;
}
.search-input:focus { border-color: #555; }
.search-input::placeholder { color: #555; }

/* 橫向列表 */
.stock-list-header, .stock-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  padding: 15px 30px;
  align-items: center;
  border-bottom: 1px solid #222;
}
.stock-list-header { 
  background: #1a1a1a; 
  font-weight: bold; 
  color: #888; 
  margin-top: 20px; 
  border-top: 1px solid #333; 
}

.stock-row { 
  background: #0f0f0f; 
  cursor: pointer; 
  transition: background 0.2s; 
}
.stock-row:hover { background: #1c1c1c; }

.col-product {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.id { color: #666; font-size: 0.85rem; margin-top: 2px; }

.data-cell {
  font-family: monospace;
  font-size: 1.1rem;
  text-align: right;
}
.col-buy, .col-sell { color: #aaaaaa; }

.name { color: #f1c40f; font-weight: bold; }
.text-up { color: #ff3b30; }   /* 紅色代表漲 (台股市場慣例) */
.text-down { color: #34c759; } /* 綠色代表跌 */
.text-vol { color: #3498db; }

/* 彈窗基本樣式 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: #1c1c1e; width: 95%; max-width: 1200px; border-radius: 8px; padding: 25px; position: relative; color: #fff; }

/* 彈窗頂部動態資訊列 */
.modal-header-info { margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
.modal-header-info h2 { margin: 0 0 5px 0; font-size: 1.4rem; color: #f1c40f; }
.live-ticker { font-size: 0.95rem; display: flex; gap: 20px; font-family: monospace; background: #000; padding: 6px 12px; display: inline-flex; border-radius: 4px; }
.live-ticker .time { color: #888; }

/* 雙欄左右切分布局 */
.detail-layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }

/* 左側走勢圖容器 */
.chart-section { background: #0a0a0a; border: 1px solid #2d2d2d; padding: 15px; border-radius: 6px; display: flex; flex-direction: column; }
.section-title { font-weight: bold; margin-bottom: 15px; border-left: 4px solid #f1c40f; padding-left: 10px; font-size: 1rem; }
.chart-placeholder { flex: 1; background: #111; border-radius: 4px; border: 1px dashed #444; position: relative; min-height: 400px; }
.mock-chart-container { position: absolute; width:100%; height:100%; top:0; left:0; display:flex; flex-direction:column; justify-content:space-between; padding: 20px 0; box-sizing: border-box; }
.grid-line { width: 100%; height: 1px; background: rgba(255,255,255,0.04); }
.placeholder-text { position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); color: #666; font-size: 0.95rem; text-align: center; z-index: 2; }

/* 右側數據面板 */
.data-section { display: flex; flex-direction: column; gap: 15px; }

/* 12格盤態網格 */
.market-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: #2d2d2d; border: 1px solid #2d2d2d; border-radius: 4px; overflow: hidden; }
.grid-item { background: #141416; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; }
.grid-item span { color: #888; }
.grid-item strong { font-family: monospace; font-size: 1.05rem; }

/* 內外盤比例條 */
.sentiment-bar-wrapper { display: flex; flex-direction: column; gap: 4px; margin-top: 5px; }
.bar-labels { display: flex; justify-content: space-between; font-size: 0.85rem; font-family: monospace; font-weight: bold; }
.proportion-bar { height: 8px; display: flex; border-radius: 4px; overflow: hidden; background: #333; }
.bar-inside { background: #34c759; transition: width 0.3s ease; }  /* 內盤偏綠 */
.bar-outside { background: #ff3b30; transition: width 0.3s ease; } /* 外盤偏紅 */

/* 五檔監控面板 */
.five-orders-container { background: #141416; border: 1px solid #2d2d2d; border-radius: 4px; padding: 10px; font-family: monospace; }
.orders-header, .orders-footer, .order-row { display: grid; grid-template-columns: 1.2fr 1.5fr 1.5fr 1.2fr; text-align: right; align-items: center; }
.orders-header { color: #888; font-size: 0.85rem; padding-bottom: 6px; border-bottom: 1px solid #2d2d2d; }
.orders-header span:first-child, .order-row .vol:first-child, .orders-footer span:first-child { text-align: left; }

.orders-body { padding: 4px 0; }
.order-row { padding: 6px 0; font-size: 1.05rem; border-bottom: 1px solid rgba(255,255,255,0.02); }
.bid-p { color: #34c759; font-weight: bold; padding-right: 15px; } /* 買進價 */
.ask-p { color: #ff3b30; font-weight: bold; padding-left: 15px; text-align: left; }  /* 賣出價 */
.order-row span:last-child { text-align: right; }

.orders-footer { border-top: 1px solid #2d2d2d; padding-top: 6px; font-size: 0.9rem; color: #aaa; }
.summary-label { color: #666; font-size: 0.8rem; }
.orders-footer .summary-label:last-of-type { text-align: left; padding-left: 15px; }

.close-btn { position: absolute; top: 15px; right: 20px; background: none; border: none; color: white; font-size: 2rem; cursor: pointer; z-index: 10; }

/* 動畫 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.stock-list-header div { text-align: right; }
.stock-list-header .col-product { text-align: left; }
</style>