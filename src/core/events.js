/**
 * 事件总线 - 模块间解耦通信
 * 
 * 使用示例:
 *   SD.EventBus.on('battle:end', function(data) { ... });
 *   SD.EventBus.emit('battle:end', { victory: true });
 */
window.SD = window.SD || {};

SD.EventBus = {
  _handlers: {},
  _onceHandlers: {},
  
  // 订阅事件
  on: function(event, handler) {
    (this._handlers[event] = this._handlers[event] || []).push(handler);
    return this; // 链式调用
  },
  
  // 订阅一次性事件
  once: function(event, handler) {
    (this._onceHandlers[event] = this._onceHandlers[event] || []).push(handler);
    return this;
  },
  
  // 取消订阅
  off: function(event, handler) {
    if (!this._handlers[event]) return this;
    this._handlers[event] = this._handlers[event].filter(function(h) {
      return h !== handler;
    });
    return this;
  },
  
  // 触发事件
  emit: function(event, data) {
    var self = this;
    
    // 触发普通处理器
    (this._handlers[event] || []).forEach(function(handler) {
      try {
        handler(data);
      } catch (e) {
        console.error('[EventBus] 处理器错误:', event, e);
      }
    });
    
    // 触发一次性处理器
    var onceList = this._onceHandlers[event] || [];
    if (onceList.length > 0) {
      onceList.forEach(function(handler) {
        try {
          handler(data);
        } catch (e) {
          console.error('[EventBus] 一次性处理器错误:', event, e);
        }
      });
      delete this._onceHandlers[event];
    }
    
    return this;
  },
  
  // 获取事件监听器数量
  listenerCount: function(event) {
    return (this._handlers[event] || []).length + 
           (this._onceHandlers[event] || []).length;
  }
};

// 预定义事件名称（避免拼写错误）
SD.Events = {
  // 游戏生命周期
  GAME_INIT: 'game:init',
  GAME_SAVE: 'game:save',
  GAME_LOAD: 'game:load',
  
  // 战斗
  BATTLE_START: 'battle:start',
  BATTLE_END: 'battle:end',
  BATTLE_ROUND: 'battle:round',
  
  // 英雄
  HERO_CREATE: 'hero:create',
  HERO_LEVEL_UP: 'hero:levelUp',
  HERO_EQUIP: 'hero:equip',
  HERO_UNEQUIP: 'hero:unequip',
  
  // 资源
  RESOURCE_CHANGE: 'resource:change',
  
  // UI
  TAB_SWITCH: 'ui:tabSwitch',
  MODAL_OPEN: 'ui:modalOpen',
  MODAL_CLOSE: 'ui:modalClose',
  TOAST_SHOW: 'ui:toastShow'
};
