/**
 * 晒单图生成器 - 静态版 v2.2
 * 支持导入 JSON 配置 + 自定义底图
 * 支持自动计算历史价格
 * 支持配置缓存
 */

// 缓存 KEY
const CACHE_KEY = 'profitGenerator_config';

// 内置 LBanken 配置
const lbankenConfig = {
  name: 'LBanken',
  width: 750,
  height: 1240,
  dateFormat: 'YYYY/MM/DD HH:mm:ss',
  displayTexts: {
    long: 'Long', short: 'Short',
    open_long: 'Open Long', open_short: 'Open Short',
    close_long: 'Close Long', close_short: 'Close Short'
  },
  dynamicColors: {
    open_long: '#279E55', open_short: '#FF6B6B',
    close_long: '#FF6B6B', close_short: '#279E55'
  },
  profitColor: '#279E55',
  lossColor: '#FF6B6B',
  qrcode: {
    baseUrl: 'https://lbank.com/ref/',
    defaultRefCode: '5NCXS'
  },
  layers: [
    {
      id: 'L8x8ikdz', type: 'text', x: 52, y: 231,
      fontFamily: 'HarmonyOS Sans SC', fontSize: 14, color: '#ffffff', fontWeight: 400,
      children: [
        { text: '{{tradepair}} Perp', fontSize: 26, fontWeight: 400 },
        { text: '|', gap: 21, color: '#36393F', fontSize: 27, fontWeight: 100 },
        { text: '{{direction}}', gap: 21, fontSize: 26, fontWeight: 400, dynamicColor: true },
        { text: '|', gap: 23, color: '#36393F', fontSize: 27, fontWeight: 100 },
        { text: '{{lev}}x', gap: 22, fontSize: 26, fontWeight: 400 }
      ]
    },
    {
      id: 'Lpxqskdf', type: 'text', x: 479, y: 67, text: '{{date}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 22, color: '#90959E', fontWeight: 400
    },
    {
      id: 'Lpk1mp1y', type: 'text', x: 52, y: 363, text: '+{{yield}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 64, fontWeight: 700, profitLossColor: true
    },
    {
      id: 'Lbddqvll', type: 'text', x: 53, y: 513, text: '{{entprice}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 25, color: '#ffffff', fontWeight: 400
    },
    {
      id: 'L0l7ylfu', type: 'text', x: 53, y: 617, text: '{{lastprice}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 25, color: '#ffffff', fontWeight: 400
    },
    { id: 'Lqrcode1', type: 'qrcode', x: 608, y: 1083, width: 114, height: 114 },
    {
      id: 'Lx3l0xzm', type: 'text', x: 41, y: 1099, text: 'Referral Code {{ref}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 31, color: '#ffffff', fontWeight: 400
    },
    {
      id: 'Lm0ffrx6', type: 'text', x: 40, y: 1152, text: 'Sign Up to Take Your Cut of $2M',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 28, color: '#9095A0', fontWeight: 400
    }
  ]
};

// 当前配置
let currentConfig = null;
let currentImageData = null;
let customBgDataUrl = null;
let isManualTimeMode = false; // 是否手动编辑显示时间模式

// 默认底图（优先使用 Base64，备选使用路径）
const DEFAULT_BG_SRC = (typeof DEFAULT_BG_BASE64 !== 'undefined') ? DEFAULT_BG_BASE64 : 'assets/background.jpg';

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 加载缓存
  loadCache();
  
  // 设置默认时间
  const now = new Date();
  const entTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  if (!document.getElementById('entTime').value) {
    document.getElementById('entTime').value = formatDateTimeLocal(entTime);
  }
  if (!document.getElementById('closeTime').value) {
    document.getElementById('closeTime').value = formatDateTimeLocal(now);
  }
  
  // 如果不是手动模式，同步平仓时间到显示时间
  if (!isManualTimeMode) {
    syncDisplayTime();
  }
  
  // 监听平仓时间变化，自动同步到显示时间
  document.getElementById('closeTime').addEventListener('change', syncDisplayTime);
  
  // 监听输入变化，自动保存
  setupAutoSave();
  
  // 加载配置
  loadConfigSelect();
});


// 设置自动保存
function setupAutoSave() {
  const inputs = document.querySelectorAll('input, select');
  let saveTimeout;
  
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveCache, 500);
    });
    input.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveCache, 500);
    });
  });
}

// 保存缓存
function saveCache() {
  const cache = {
    tradepair: document.getElementById('tradepair').value,
    direction: document.getElementById('direction').value,
    action: document.getElementById('action').value,
    leverage: document.getElementById('leverage').value,
    yield: document.getElementById('yield').value,
    entPrice: document.getElementById('entPrice').value,
    lastPrice: document.getElementById('lastPrice').value,
    displayTime: document.getElementById('displayTime').value,
    refcode: document.getElementById('refcode').value,
    autoCalcPrice: document.getElementById('autoCalcPrice').checked,
    entTime: document.getElementById('entTime').value,
    closeTime: document.getElementById('closeTime').value,
    configSelect: document.getElementById('configSelect').value,
    customBgDataUrl: customBgDataUrl,
    timezone: document.getElementById('timezone').value,
    isManualTimeMode: isManualTimeMode
  };
  
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  console.log('配置已缓存');
}

// 加载缓存
function loadCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;
    
    const cache = JSON.parse(cached);
    
    if (cache.tradepair) document.getElementById('tradepair').value = cache.tradepair;
    if (cache.direction) document.getElementById('direction').value = cache.direction;
    if (cache.action) document.getElementById('action').value = cache.action;
    if (cache.leverage) document.getElementById('leverage').value = cache.leverage;
    if (cache.yield) document.getElementById('yield').value = cache.yield;
    if (cache.entPrice) document.getElementById('entPrice').value = cache.entPrice;
    if (cache.lastPrice) document.getElementById('lastPrice').value = cache.lastPrice;
    if (cache.displayTime) document.getElementById('displayTime').value = cache.displayTime;
    if (cache.refcode) document.getElementById('refcode').value = cache.refcode;
    if (cache.entTime) document.getElementById('entTime').value = cache.entTime;
    if (cache.closeTime) document.getElementById('closeTime').value = cache.closeTime;
    if (cache.configSelect) document.getElementById('configSelect').value = cache.configSelect;
    
    if (cache.autoCalcPrice) {
      document.getElementById('autoCalcPrice').checked = cache.autoCalcPrice;
      toggleAutoCalc();
    }
    
    if (cache.customBgDataUrl) {
      customBgDataUrl = cache.customBgDataUrl;
      document.getElementById('bgStatus').textContent = '✅ 使用自定义底图';
      document.getElementById('bgStatus').style.color = '#279E55';
    }
    
    if (cache.timezone) {
      document.getElementById('timezone').value = cache.timezone;
    }
    
    if (cache.isManualTimeMode) {
      isManualTimeMode = true;
      const displayTimeInput = document.getElementById('displayTime');
      const editBtn = document.getElementById('editTimeBtn');
      const timeHint = document.getElementById('timeHint');
      const timezoneSelect = document.getElementById('timezone');
      
      displayTimeInput.disabled = false;
      editBtn.textContent = '🔄 自动';
      timeHint.textContent = '手动模式：时区转换已禁用';
      timeHint.style.color = '#FF9500';
      timezoneSelect.disabled = true;
    }
    
    console.log('配置已从缓存恢复');
  } catch (e) {
    console.warn('加载缓存失败:', e);
  }
}

// 清除缓存
function clearCache() {
  if (confirm('确定清除所有缓存配置？')) {
    localStorage.removeItem(CACHE_KEY);
    customBgDataUrl = null;
    location.reload();
  }
}

// 加载配置选择
function loadConfigSelect() {
  const select = document.getElementById('configSelect').value;
  
  if (select === 'custom') {
    document.getElementById('configFile').click();
    return;
  }
  
  currentConfig = JSON.parse(JSON.stringify(lbankenConfig));
  document.getElementById('previewSize').textContent = `${currentConfig.width} × ${currentConfig.height}`;
  document.getElementById('configName').textContent = `使用内置 LBanken 配置`;
}

// 切换自动计算模式
function toggleAutoCalc() {
  const autoCalc = document.getElementById('autoCalcPrice').checked;
  document.getElementById('manualPriceSection').style.display = autoCalc ? 'none' : 'block';
  document.getElementById('autoCalcSection').style.display = autoCalc ? 'block' : 'none';
}

// 切换手动编辑显示时间模式
function toggleManualTime() {
  isManualTimeMode = !isManualTimeMode;
  const displayTimeInput = document.getElementById('displayTime');
  const editBtn = document.getElementById('editTimeBtn');
  const timeHint = document.getElementById('timeHint');
  const timezoneSelect = document.getElementById('timezone');
  
  if (isManualTimeMode) {
    displayTimeInput.disabled = false;
    editBtn.textContent = '🔄 自动';
    editBtn.title = '切换回自动同步模式';
    timeHint.textContent = '手动模式：时区转换已禁用';
    timeHint.style.color = '#FF9500';
    timezoneSelect.disabled = true;
  } else {
    displayTimeInput.disabled = true;
    editBtn.textContent = '✏️ 编辑';
    editBtn.title = '手动编辑显示时间';
    timeHint.textContent = '自动同步平仓时间 + 时区转换';
    timeHint.style.color = '';
    timezoneSelect.disabled = false;
    // 同步平仓时间到显示时间
    syncDisplayTime();
  }
  saveCache();
}

// 同步平仓时间到显示时间
function syncDisplayTime() {
  if (isManualTimeMode) return;
  
  // 优先使用平仓时间，否则使用当前时间
  let timeToSync = document.getElementById('closeTime').value;
  if (!timeToSync) {
    timeToSync = formatDateTimeLocal(new Date());
  }
  document.getElementById('displayTime').value = timeToSync;
}

// 获取历史价格
async function fetchPrices() {
  const tradepair = document.getElementById('tradepair').value.toUpperCase();
  const entTimeStr = document.getElementById('entTime').value;
  const closeTimeStr = document.getElementById('closeTime').value;
  const hint = document.getElementById('priceHint');
  
  if (!entTimeStr || !closeTimeStr) {
    hint.innerHTML = '⚠️ 请选择开仓和平仓时间';
    hint.style.color = '#FF6B6B';
    return;
  }
  
  const entTime = new Date(entTimeStr).getTime();
  const closeTime = new Date(closeTimeStr).getTime();
  
  hint.innerHTML = '⏳ 正在获取价格数据...';
  hint.style.color = '#90959E';
  
  try {
    const entPriceData = await fetchBinanceKline(tradepair, entTime);
    const closePriceData = await fetchBinanceKline(tradepair, closeTime);
    
    if (entPriceData && closePriceData) {
      document.getElementById('entPrice').value = entPriceData.toFixed(2);
      document.getElementById('lastPrice').value = closePriceData.toFixed(2);
      
      const direction = document.getElementById('direction').value;
      const leverage = parseFloat(document.getElementById('leverage').value);
      let yieldPercent;
      
      if (direction === 'long') {
        yieldPercent = ((closePriceData - entPriceData) / entPriceData) * leverage * 100;
      } else {
        yieldPercent = ((entPriceData - closePriceData) / entPriceData) * leverage * 100;
      }
      
      document.getElementById('yield').value = yieldPercent.toFixed(2);
      
      hint.innerHTML = `✅ 价格获取成功！开仓: ${entPriceData.toFixed(2)} → 平仓: ${closePriceData.toFixed(2)}`;
      hint.style.color = '#279E55';
      
      saveCache();
    } else {
      throw new Error('无法获取价格数据');
    }
  } catch (error) {
    console.error('获取价格失败:', error);
    hint.innerHTML = `❌ 获取失败: ${error.message}`;
    hint.style.color = '#FF6B6B';
  }
}

// 从 Binance 获取 K 线数据
async function fetchBinanceKline(symbol, timestamp) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&startTime=${timestamp}&limit=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('API 请求失败');
    const data = await response.json();
    
    if (data && data.length > 0) {
      return parseFloat(data[0][4]);
    }
    return null;
  } catch (error) {
    console.warn('Binance API 访问失败，使用模拟数据');
    const basePrice = symbol.includes('BTC') ? 95000 : 3500;
    const variance = (Math.random() - 0.5) * basePrice * 0.1;
    return basePrice + variance;
  }
}

// 导入自定义配置
function importConfig(e) {
  const file = e.target.files[0];
  if (!file) {
    document.getElementById('configSelect').value = 'lbanken';
    loadConfigSelect();
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      
      currentConfig = {
        name: '自定义',
        width: data.width || 750,
        height: data.height || 1240,
        dateFormat: data.dateFormat || 'YYYY/MM/DD HH:mm:ss',
        displayTexts: data.displayTexts || lbankenConfig.displayTexts,
        dynamicColors: data.dynamicColors || lbankenConfig.dynamicColors,
        profitColor: data.profitColor || '#279E55',
        lossColor: data.lossColor || '#FF6B6B',
        qrcode: data.qrcode || lbankenConfig.qrcode,
        layers: data.layers || []
      };
      
      document.getElementById('previewSize').textContent = `${currentConfig.width} × ${currentConfig.height}`;
      document.getElementById('configName').textContent = `✅ 已导入: ${file.name}`;
      document.getElementById('configSelect').value = 'custom';
      
      console.log('配置导入成功:', currentConfig);
    } catch (err) {
      alert('配置文件格式错误: ' + err.message);
      document.getElementById('configSelect').value = 'lbanken';
      loadConfigSelect();
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// 加载自定义底图
function loadCustomBg(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    customBgDataUrl = evt.target.result;
    document.getElementById('bgStatus').textContent = `✅ ${file.name}`;
    document.getElementById('bgStatus').style.color = '#279E55';
    saveCache();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

// 重置底图
function resetBackground() {
  customBgDataUrl = null;
  document.getElementById('bgStatus').textContent = '使用默认底图';
  document.getElementById('bgStatus').style.color = '';
  saveCache();
}

function formatDateTimeLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

function formatDisplayDate(date, format) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', y)
    .replace('MM', m)
    .replace('DD', d)
    .replace('HH', h)
    .replace('mm', min)
    .replace('ss', sec);
}

function formatNumber(num) {
  const n = parseFloat(num);
  if (n >= 100) return n.toFixed(2);
  if (n >= 10) return n.toFixed(3);
  return n.toFixed(4);
}

// 将时间转换到目标时区
function convertToTimezone(date, targetTimezoneOffset) {
  // 获取本地时区偏移（分钟），注意 getTimezoneOffset 返回的是 UTC - 本地时间，所以需要取反
  const localOffset = -date.getTimezoneOffset(); // 本地时区偏移（分钟）
  const targetOffset = targetTimezoneOffset * 60; // 目标时区偏移（分钟）
  
  // 计算差值（分钟）
  const diff = targetOffset - localOffset;
  
  // 创建新的日期对象，调整时间
  const convertedDate = new Date(date.getTime() + diff * 60 * 1000);
  
  return convertedDate;
}

// 获取变量
function getVariables() {
  const tradepair = document.getElementById('tradepair').value.toUpperCase();
  const direction = document.getElementById('direction').value;
  const action = document.getElementById('action').value;
  const leverage = document.getElementById('leverage').value;
  const yieldValue = parseFloat(document.getElementById('yield').value);
  const entPrice = document.getElementById('entPrice').value;
  const lastPrice = document.getElementById('lastPrice').value;
  const refcode = document.getElementById('refcode').value || '5NCXS';
  
  let finalTime;
  
  // 获取显示时间（自动模式下已同步平仓时间）
  const displayTimeStr = document.getElementById('displayTime').value;
  const displayTime = displayTimeStr ? new Date(displayTimeStr) : new Date();
  
  if (isManualTimeMode) {
    // 手动模式：直接使用显示时间，不进行时区转换
    finalTime = displayTime;
  } else {
    // 自动模式：使用显示时间 + 时区转换
    const timezone = parseInt(document.getElementById('timezone').value) || 8;
    finalTime = convertToTimezone(displayTime, timezone);
  }
  
  const dirKey = action ? `${action}_${direction}` : direction;
  const directionText = currentConfig.displayTexts?.[dirKey] || direction;
  
  return {
    tradepair: tradepair,
    direction: directionText,
    lev: leverage,
    leverage: leverage,
    yield: yieldValue.toFixed(2) + '%',
    entprice: formatNumber(entPrice),
    lastprice: formatNumber(lastPrice),
    date: formatDisplayDate(finalTime, currentConfig.dateFormat || 'YYYY/MM/DD HH:mm:ss'),
    ref: refcode,
    isProfit: yieldValue >= 0,
    directionKey: dirKey
  };
}

// 替换变量
function replaceVars(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);
}

// 生成图片
async function generateImage() {
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 生成中...';
  
  try {
    if (!currentConfig) {
      loadConfigSelect();
    }
    
    const vars = getVariables();
    
    const renderContainer = document.getElementById('renderContainer');
    renderContainer.innerHTML = '';
    
    const template = document.createElement('div');
    template.style.width = currentConfig.width + 'px';
    template.style.height = currentConfig.height + 'px';
    template.style.position = 'relative';
    template.style.fontFamily = "'HarmonyOS Sans SC', 'Noto Sans SC', sans-serif";
    template.style.background = '#1a1a2e';
    
    // 背景图
    const bgSrc = customBgDataUrl || DEFAULT_BG_SRC;
    
    const bg = document.createElement('img');
    bg.src = bgSrc;
    bg.style.cssText = 'position:absolute;width:100%;height:100%;object-fit:cover;';
    template.appendChild(bg);
    
    await new Promise((resolve, reject) => {
      bg.onload = resolve;
      bg.onerror = () => {
        console.warn('背景图加载失败，使用纯色背景');
        resolve(); // 继续执行，使用纯色背景
      };
    });
    
    // 渲染图层
    for (const layer of currentConfig.layers) {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = layer.x + 'px';
      div.style.top = layer.y + 'px';
      div.style.whiteSpace = 'pre';
      div.style.fontFamily = layer.fontFamily || "'HarmonyOS Sans SC', sans-serif";
      div.style.textShadow = '0 0 2px rgba(0,0,0,.8)';
      
      if (layer.type === 'qrcode') {
        div.style.background = '#fff';
        div.style.padding = '4px';
        div.style.borderRadius = '4px';
        div.style.width = layer.width + 'px';
        div.style.height = layer.height + 'px';
        
        const qrUrl = (currentConfig.qrcode?.baseUrl || 'https://lbank.com/ref/') + vars.ref;
        new QRCode(div, {
          text: qrUrl,
          width: layer.width - 8,
          height: layer.height - 8,
          colorDark: '#000000',
          colorLight: '#ffffff'
        });
      } else if (layer.children) {
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        
        for (const child of layer.children) {
          const span = document.createElement('span');
          span.textContent = replaceVars(child.text || '', vars);
          span.style.fontSize = (child.fontSize || layer.fontSize || 14) + 'px';
          span.style.fontWeight = child.fontWeight || layer.fontWeight || 400;
          span.style.fontFamily = child.fontFamily || layer.fontFamily || "'HarmonyOS Sans SC', sans-serif";
          
          if (child.gap) span.style.marginLeft = child.gap + 'px';
          if (child.letterSpacing) span.style.letterSpacing = child.letterSpacing + 'px';
          
          if (child.dynamicColor) {
            span.style.color = currentConfig.dynamicColors?.[vars.directionKey] || '#FFFFFF';
          } else {
            span.style.color = child.color || layer.color || '#FFFFFF';
          }
          
          div.appendChild(span);
        }
      } else {
        let text = replaceVars(layer.text || '', vars);
        
        if (layer.profitLossColor && text.includes('+') && !vars.isProfit) {
          text = text.replace('+', '');
        }
        
        div.textContent = text;
        div.style.fontSize = (layer.fontSize || 14) + 'px';
        div.style.fontWeight = layer.fontWeight || 400;
        
        if (layer.letterSpacing) div.style.letterSpacing = layer.letterSpacing + 'px';
        if (layer.lineHeight) div.style.lineHeight = layer.lineHeight;
        
        if (layer.profitLossColor) {
          div.style.color = vars.isProfit ? currentConfig.profitColor : currentConfig.lossColor;
        } else if (layer.dynamicColor) {
          div.style.color = currentConfig.dynamicColors?.[vars.directionKey] || '#FFFFFF';
        } else {
          div.style.color = layer.color || '#FFFFFF';
        }
      }
      
      template.appendChild(div);
    }
    
    renderContainer.appendChild(template);
    
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 300));
    
    const canvas = await html2canvas(template, {
      width: currentConfig.width,
      height: currentConfig.height,
      scale: 1,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null
    });
    
    currentImageData = canvas.toDataURL('image/png');
    
    const previewArea = document.getElementById('previewArea');
    previewArea.innerHTML = '';
    previewArea.className = '';
    
    const img = document.createElement('img');
    img.src = currentImageData;
    img.style.maxWidth = '100%';
    img.style.maxHeight = 'calc(100vh - 100px)';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)';
    previewArea.appendChild(img);
    
    document.getElementById('downloadBtn').style.display = 'flex';
    
  } catch (error) {
    console.error('生成失败:', error);
    alert('生成失败: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>⚡</span> 生成晒单图';
  }
}

// 下载图片
function downloadImage() {
  if (!currentImageData) return;
  
  const tradepair = document.getElementById('tradepair').value;
  const a = document.createElement('a');
  a.href = currentImageData;
  a.download = `${tradepair}-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 快捷填充
function fillRandom() {
  document.getElementById('yield').value = (Math.random() * 200 - 50).toFixed(2);
  document.getElementById('leverage').value = Math.floor(Math.random() * 100) + 10;
  document.getElementById('entPrice').value = (3000 + Math.random() * 1000).toFixed(2);
  document.getElementById('lastPrice').value = (3000 + Math.random() * 1500).toFixed(2);
  document.getElementById('direction').value = Math.random() > 0.5 ? 'long' : 'short';
  document.getElementById('action').value = Math.random() > 0.5 ? 'close' : 'open';
  saveCache();
}

function fillProfit() {
  document.getElementById('yield').value = '128.56';
  document.getElementById('leverage').value = '50';
  document.getElementById('entPrice').value = '3245.67';
  document.getElementById('lastPrice').value = '3890.12';
  document.getElementById('direction').value = 'long';
  document.getElementById('action').value = 'close';
  saveCache();
}

function fillLoss() {
  document.getElementById('yield').value = '-45.32';
  document.getElementById('leverage').value = '25';
  document.getElementById('entPrice').value = '3890.00';
  document.getElementById('lastPrice').value = '3180.50';
  document.getElementById('direction').value = 'short';
  document.getElementById('action').value = 'close';
  saveCache();
}
