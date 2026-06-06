/**
 * 工具函数库
 */
window.SD = window.SD || {};

SD.Utils = {
  // 随机选择数组元素
  pick: function(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  },
  
  // 随机整数 [min, max]
  randInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // 限制数值范围
  clamp: function(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },
  
  // 深拷贝
  deepClone: function(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      return obj;
    }
  },
  
  // 生成唯一ID
  generateUid: function(prefix) {
    return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  // 格式化数字（K/M/B/T）
  formatNumber: function(n) {
    if (n < 1000) return n.toString();
    var units = ['K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad', 'ae'];
    var unitIndex = 0;
    while (n >= 1000 && unitIndex < units.length - 1) {
      n /= 1000;
      unitIndex++;
    }
    return n.toFixed(1) + units[unitIndex];
  },
  
  // 防抖
  debounce: function(fn, delay) {
    var timer;
    return function() {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(null, args); }, delay);
    };
  },
  
  // 节流
  throttle: function(fn, limit) {
    var inThrottle;
    return function() {
      var args = arguments;
      if (!inThrottle) {
        fn.apply(null, args);
        inThrottle = true;
        setTimeout(function() { inThrottle = false; }, limit);
      }
    };
  }
};

// BigNumber 工具
SD.BigNumber = {
  toBig: function(v) {
    if (typeof v === 'bigint') return v;
    if (typeof v === 'string') return BigInt(v);
    return BigInt(Math.floor(v || 0));
  },
  add: function(a, b) { return this.toBig(a) + this.toBig(b); },
  sub: function(a, b) { return this.toBig(a) - this.toBig(b); },
  mul: function(a, b) { return this.toBig(a) * this.toBig(b); },
  div: function(a, b) {
    if (this.toBig(b) === 0n) return 0n;
    return this.toBig(a) / this.toBig(b);
  },
  gt: function(a, b) { return this.toBig(a) > this.toBig(b); },
  format: function(v) {
    var n = Number(this.toBig(v));
    if (n < 1000) return n.toString();
    var units = ['K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad', 'ae', 'af'];
    var unitIndex = 0;
    while (n >= 1000 && unitIndex < units.length - 1) {
      n /= 1000;
      unitIndex++;
    }
    return n.toFixed(1) + units[unitIndex];
  }
};

// 对数压缩
SD.LogScale = {
  compress: function(v) {
    if (v <= 0) return 0;
    if (v < 1000000) return v;
    return Math.log10(v) * 1000000;
  },
  decompress: function(v) {
    if (v <= 0) return 0;
    if (v < 1000000) return v;
    return Math.pow(10, v / 1000000);
  }
};
