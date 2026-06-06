/**
 * 核心常量定义
 */
window.SD = window.SD || {};

SD.Constants = {
  // 存档版本
  SAVE_VERSION: 5,
  
  // 资源上限
  RESOURCE_LIMITS: {
    gold: 9999999,
    gems: 999999,
    food: 99999,
    stone: 99999,
    iron: 99999,
    expPotion: 9999
  },
  
  // 装备上限
  MAX_EQUIPMENT_COUNT: 200,
  
  // 强化上限
  MAX_ENHANCE_LEVEL: 10,
  
  // 英雄等级上限
  MAX_HERO_LEVEL: 200,
  
  // 存档槽位数
  MAX_SLOTS: 3,
  
  // 自动备份保留数
  MAX_AUTO_BACKUPS: 2,
  
  // 手动备份保留数
  MAX_MANUAL_BACKUPS: 5,
  
  // 队伍最大人数
  MAX_TEAM_SIZE: 6,
  
  // 战斗最大回合
  MAX_BATTLE_ROUNDS: 50,
  
  // 品质排序权重
  QUALITY_ORDER: {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    mythic: 5
  }
};

// 存档键名
SD.Constants.META_KEY = 'shadow_dungeon_meta_v5';
SD.Constants.SLOT_PREFIX = 'sd_slot_';
