/**
 * 应用入口
 * 初始化游戏并启动
 */
window.SD = window.SD || {};

// 游戏状态（将在系统模块中初始化）
window.G = window.G || {};
window.G_RL = window.G_RL || null;

SD.App = {
  version: '1.0.0',
  
  init: function() {
    console.log('🎮 暗影地牢 RPG v' + this.version);
    
    // 初始化各系统
    this._initSystems();
    
    // 触发初始化完成事件
    SD.EventBus.emit(SD.Events.GAME_INIT, { version: this.version });
    
    // 渲染初始页面
    if (typeof switchTab === 'function') {
      switchTab('town');
    }
  },
  
  _initSystems: function() {
    // 按依赖顺序初始化
    // 注意：实际初始化逻辑在各自的系统模块中
    
    // 存档系统初始化
    if (SD.SaveSystem && SD.SaveSystem.init) {
      SD.SaveSystem.init();
    }
    
    // 英雄系统初始化
    if (SD.HeroSystem && SD.HeroSystem.init) {
      SD.HeroSystem.init();
    }
    
    // 战斗系统初始化
    if (SD.BattleSystem && SD.BattleSystem.init) {
      SD.BattleSystem.init();
    }
    
    // UI 系统初始化
    if (SD.UISystem && SD.UISystem.init) {
      SD.UISystem.init();
    }
  }
};

// DOM 加载完成后启动
document.addEventListener('DOMContentLoaded', function() {
  SD.App.init();
});
