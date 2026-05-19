export interface Stock {
  name: string;
  id: string;
  buy: string;    
  sell: string;   
  price: string;  
  change: string; 
  volume: string; 
}

export interface BidAskRow {
  price: string;
  volume: string;
}

export interface StockDetail {
  time: string;          // 資料時間
  currentPrice: string;  // 即時成交價
  currentVolume: string; // 當前單量 (張)
  
  tradePrice: string;    // 成交
  openPrice: string;     // 開盤
  highPrice: string;     // 最高
  lowPrice: string;      // 最低
  avgPrice: string;      // 均價
  amount: string;        // 成交金額 (億)
  
  prevClose: string;     // 昨收
  changePercent: string; // 漲跌幅
  changeValue: string;   // 漲跌價差
  totalVolume: string;   // 總量
  prevVolume: string;    // 昨量
  amplitude: string;     // 振幅
  
  insideOrderVol: string;     // 內盤量
  insideOrderPercent: string; // 內盤比
  outsideOrderVol: string;    // 外盤量
  outsideOrderPercent: string;// 外盤比

  bidOrders: BidAskRow[]; // 委買
  askOrders: BidAskRow[]; // 委賣
}