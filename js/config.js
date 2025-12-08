/**
 * 共享配置文件
 * 被 app.js 和 editor.html 共同引用
 */

// 内置 LBanken 配置
const lbankenConfig = {
  name: 'LBanken',
  width: 1050,
  height: 1696,
  dateFormat: 'YYYY-MM-DD HH:mm',
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
      id: 'L8x8ikdz', type: 'text', x: 42, y: 285,
      fontFamily: 'HarmonyOS Sans SC', fontSize: 20, color: '#ffffff', fontWeight: 400,
      letterSpacing: 0, lineHeight: 1.2,
      children: [
        { text: '{{tradepair}} Perp', fontSize: 36, fontWeight: 400 },
        { text: '|', gap: 29, color: '#36393F', fontSize: 38, fontWeight: 100 },
        { text: '{{direction}}', gap: 29, fontSize: 36, fontWeight: 400, dynamicColor: true },
        { text: '|', gap: 32, color: '#36393F', fontSize: 38, fontWeight: 100 },
        { text: '{{lev}}x', gap: 31, fontSize: 36, fontWeight: 400, color: '#90959E' }
      ]
    },
    {
      id: 'Lpxqskdf', type: 'text', x: 708, y: 65, text: '{{date}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 31, color: '#90959E', fontWeight: 400,
      letterSpacing: -0.14, lineHeight: 1.2
    },
    {
      id: 'Lpk1mp1y', type: 'text', x: 42, y: 421, text: '+{{yield}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 53, fontWeight: 700,
      letterSpacing: 0, lineHeight: 1.2, profitLossColor: true
    },
    {
      id: 'Lbddqvll', type: 'text', x: 43, y: 575, text: '{{entprice}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 42, color: '#ffffff', fontWeight: 400,
      letterSpacing: 1, lineHeight: 1.2
    },
    {
      id: 'L0l7ylfu', type: 'text', x: 43, y: 725, text: '{{lastprice}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 42, color: '#ffffff', fontWeight: 400,
      letterSpacing: 1, lineHeight: 1.2
    },
    { id: 'Lqrcode1', type: 'qrcode', x: 869, y: 1487, width: 160, height: 160 },
    {
      id: 'Lx3l0xzm', type: 'text', x: 49, y: 1523, text: 'Referral Code {{ref}}',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 39, color: '#ffffff', fontWeight: 400,
      letterSpacing: 0.14, lineHeight: 1.2
    },
    {
      id: 'Lm0ffrx6', type: 'text', x: 48, y: 1588, text: 'Sign Up to Take Your Cut of $2M',
      fontFamily: 'HarmonyOS Sans SC', fontSize: 35, color: '#9095A0', fontWeight: 400,
      letterSpacing: 0, lineHeight: 1.2
    }
  ]
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

/**
 * 渲染图层到容器
 * @param {HTMLElement} container - 渲染容器
 * @param {Array} layers - 图层配置
 * @param {Object} vars - 变量对象
 * @param {Object} config - 配置对象
 * @param {Object} options - 可选参数 { globalFont, showOutline }
 */
function renderLayersToContainer(container, layers, vars, config, options = {}) {
  const { globalFont, showOutline = false } = options;
  container.innerHTML = '';
  
  layers.forEach((layer, index) => {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = layer.x + 'px';
    div.style.top = layer.y + 'px';
    div.style.whiteSpace = 'pre';
    div.style.fontFamily = layer.fontFamily || globalFont || "'HarmonyOS Sans SC', sans-serif";
    div.style.textShadow = '0 0 2px rgba(0,0,0,.8)';
    div.dataset.id = layer.id;
    div.dataset.index = index;
    
    if (layer.type === 'qrcode') {
      div.style.background = '#fff';
      div.style.padding = '4px';
      div.style.borderRadius = '4px';
      div.style.width = layer.width + 'px';
      div.style.height = layer.height + 'px';
      
      const qrUrl = (config.qrcode?.baseUrl || 'https://lbank.com/ref/') + vars.ref;
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
        span.style.fontFamily = child.fontFamily || layer.fontFamily || globalFont || "'HarmonyOS Sans SC', sans-serif";
        
        if (child.gap) span.style.marginLeft = child.gap + 'px';
        if (child.letterSpacing) span.style.letterSpacing = child.letterSpacing + 'px';
        
        if (child.dynamicColor) {
          span.style.color = config.dynamicColors?.[vars.directionKey] || '#FFFFFF';
        } else {
          span.style.color = child.color || layer.color || '#FFFFFF';
        }
        
        div.appendChild(span);
      }
    } else {
      let text = replaceVars(layer.text || '', vars);
      
      // 处理盈亏符号
      if (layer.profitLossColor && text.includes('+') && !vars.isProfit) {
        text = text.replace('+', '');
      }
      
      div.textContent = text;
      div.style.fontSize = (layer.fontSize || 14) + 'px';
      div.style.fontWeight = layer.fontWeight || 400;
      
      if (layer.letterSpacing) div.style.letterSpacing = layer.letterSpacing + 'px';
      if (layer.lineHeight) div.style.lineHeight = layer.lineHeight;
      
      if (layer.profitLossColor) {
        div.style.color = vars.isProfit ? config.profitColor : config.lossColor;
      } else if (layer.dynamicColor) {
        div.style.color = config.dynamicColors?.[vars.directionKey] || '#FFFFFF';
      } else {
        div.style.color = layer.color || '#FFFFFF';
      }
    }
    
    container.appendChild(div);
  });
}

/**
 * 根据输入获取变量对象
 * @param {Object} inputs - 输入值对象
 * @param {Object} config - 配置对象
 * @returns {Object} 变量对象
 */
function getVariablesFromInputs(inputs, config) {
  const {
    tradepair = 'ETHUSDT',
    direction = 'long',
    action = 'close',
    leverage = 50,
    yieldValue = 0,
    entPrice = 0,
    lastPrice = 0,
    displayTime = new Date(),
    refcode = '5NCXS'
  } = inputs;
  
  const dirKey = action ? `${action}_${direction}` : direction;
  const directionText = config.displayTexts?.[dirKey] || direction;
  
  return {
    tradepair: tradepair.toUpperCase(),
    direction: directionText,
    lev: leverage,
    leverage: leverage,
    yield: parseFloat(yieldValue).toFixed(2) + '%',
    entprice: formatNumber(entPrice),
    lastprice: formatNumber(lastPrice),
    date: formatDisplayDate(displayTime, config.dateFormat || 'YYYY/MM/DD HH:mm:ss'),
    ref: refcode,
    isProfit: parseFloat(yieldValue) >= 0,
    directionKey: dirKey
  };
}
