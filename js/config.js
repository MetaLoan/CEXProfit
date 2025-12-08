/**
 * 共享配置文件
 * 被 app.js 和 editor.html 共同引用
 * 配置从 /config 目录动态加载
 */

// 默认配置（仅作为后备，正常应从 JSON 加载）
const lbankenConfig = {
  name: 'LBanken',
  width: 1050,
  height: 1696,
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
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
  layers: []  // 空，强制从 JSON 加载
};

// 替换变量
function replaceVars(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);
}

// 格式化数字
function formatNumber(num) {
  const n = parseFloat(num);
  if (n >= 100) return n.toFixed(2);
  if (n >= 10) return n.toFixed(3);
  return n.toFixed(4);
}

// 格式化显示日期
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

// 格式化 datetime-local 输入值
function formatDateTimeLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${sec}`;
}


