# 暗影地牢 RPG - 代码解耦优化方案

## 当前问题分析

当前 `index.html` 约 **1108KB，26294 行**，所有代码（HTML/CSS/JS）集中在单个文件中：

### 主要耦合问题

1. **全局命名空间污染**：所有变量挂在全局，~200+ 全局函数/变量
2. **无模块边界**：系统间直接互相调用，难以追踪依赖
3. **CSS/JS/HTML 混合**：样式、逻辑、结构全部耦合
4. **测试困难**：无法单独测试某个系统
5. **协作冲突**：多人同时修改同一文件极易冲突

### 代码结构（按注释分隔识别）

```
index.html (1108KB)
├── <head>
│   ├── Meta 标签 (20行)
│   ├── 外部 CDN (3行)
│   └── <style> CSS 样式 (~2600行)
│       ├── 基础/重置样式
│       ├── 组件样式（卡片/按钮/模态框）
│       ├── 页面样式（城镇/战斗/英雄）
│       ├── 动画定义
│       └── 响应式适配
└── <body>
    └── <script> JavaScript (~23500行)
        ├── 工具库（BigNumber/LogScale）
        ├── 数据定义（HERO/EQUIP/ROLE TEMPLATES）
        ├── 核心系统（存档/状态/事件）
        ├── 游戏系统（英雄/装备/战斗/合成/肉鸽/生肖）
        ├── UI 渲染（所有页面渲染函数）
        ├── 云存档（TapTap/Supabase）
        └── 初始化
```

---

## 解耦方案：模块化架构

### 目标
- 保持**单文件 HTML 输出**（兼容现有部署方式）
- 开发时**多文件模块化**
- 构建时**自动合并**回单个 HTML

### 架构设计

```
src/
├── core/                    # 核心基础设施
│   ├── utils.js            # 工具函数（BigNumber, LogScale, pick, clamp）
│   ├── events.js           # 事件总线（解耦模块间通信）
│   └── constants.js        # 游戏常量（RESOURCE_LIMITS, SAVE_VERSION）
│
├── data/                    # 数据定义（只读配置）
│   ├── heroes.js           # HERO_TEMPLATES, ROLES
│   ├── equipment.js        # EQUIP_TEMPLATES, EQUIP_SETS
│   ├── skills.js           # SKILLS, SKILL_TREE
│   ├── stages.js           # STAGE_FEATURES, CHAPTER2_STORY
│   ├── zodiac.js           # ZODIAC_BOSSES, ZODIAC_BACKSTORY
│   ├── roguelike.js        # ROGUE_BLESSINGS, ROGUE_EVENTS, ROGUE_RELICS
│   └── synthesis.js        # SYNTHESIS_SCROLLS, HIDDEN_FUSIONS
│
├── systems/                 # 游戏系统（业务逻辑）
│   ├── save/               # 存档系统
│   │   ├── index.js        # saveGame, loadGame
│   │   ├── indexeddb.js    # dbGet, dbSet
│   │   ├── localstorage.js # lsGet, lsSet
│   │   └── backup.js       # 自动备份/恢复
│   │
│   ├── hero/               # 英雄系统
│   │   ├── index.js        # createHero, levelUp, breakThrough
│   │   ├── equipment.js    # equipItem, unequipItem, getHeroStats
│   │   └── talent.js       # talent tree
│   │
│   ├── battle/             # 战斗系统
│   │   ├── index.js        # runBattle, createBattleUnit
│   │   ├── ai.js           # 智能AI
│   │   └── visual.js       # 战斗动画/特效
│   │
│   ├── synthesis/          # 合成系统
│   │   ├── index.js        # 核心合成逻辑
│   │   ├── scrolls.js      # 卷轴系统
│   │   └── dice.js         # 命运骰子
│   │
│   ├── roguelike/          # 肉鸽系统
│   │   ├── index.js        # rlStartRun, rlGameOver
│   │   ├── battle.js       # 肉鸽战斗
│   │   └── rewards.js      # 祝福/遗物/事件
│   │
│   ├── zodiac/             # 生肖系统
│   │   ├── index.js        # zodiacBossBattle
│   │   └── shop.js         # 生肖商店
│   │
│   ├── building/           # 建筑系统
│   ├── recruit/            # 招募系统
│   ├── achievement/        # 成就系统
│   └── cloud/              # 云存档（TapTap + Supabase）
│
├── ui/                      # UI 渲染层
│   ├── components/         # 通用组件
│   │   ├── toast.js        # showToast
│   │   ├── modal.js        # showModal/closeModal
│   │   ├── hero-card.js    # buildHeroCard
│   │   └── equip-card.js   # buildEquipRow
│   │
│   ├── pages/              # 页面渲染
│   │   ├── town.js         # renderTown
│   │   ├── heroes.js       # renderHeroes, showHeroDetail
│   │   ├── team.js         # renderTeam
│   │   ├── battle.js       # renderBattle
│   │   ├── synthesis.js    # renderSynthesis
│   │   ├── equipment.js    # renderEquipment
│   │   ├── roguelike.js    # renderRoguelike
│   │   ├── zodiac.js       # renderZodiac
│   │   └── cheats.js       # renderCheats
│   │
│   └── styles/             # CSS 样式
│       ├── base.css        # 基础/重置
│       ├── components.css  # 组件样式
│       ├── pages.css       # 页面布局
│       └── animations.css  # 动画
│
├── app.js                   # 应用入口（初始化、路由）
└── index.html              # HTML 模板（仅结构）

build/
├── build.js                # Node.js 构建脚本
└── watch.js                # 开发时自动重建

dist/
└── index.html              # 构建输出（单文件）
```

---

## 关键技术方案

### 1. 模块格式：IIFE + 命名空间

不使用 ES Module（避免构建复杂度），使用传统 IIFE 但组织到命名空间：

```javascript
// src/core/utils.js
window.SD = window.SD || {};
SD.Utils = {
  pick: function(arr) { return arr[Math.floor(Math.random()*arr.length)]; },
  clamp: function(v, min, max) { return Math.max(min, Math.min(max, v)); },
  // ...
};

// src/systems/hero/index.js
window.SD = window.SD || {};
SD.HeroSystem = {
  createHero: function(templateId) { /* ... */ },
  levelUp: function(heroUid, levels) { /* ... */ },
  // ...
};

// 使用
SD.HeroSystem.createHero('warrior');
```

### 2. 事件总线解耦

```javascript
// src/core/events.js
SD.EventBus = {
  _handlers: {},
  on: function(event, handler) {
    (this._handlers[event] = this._handlers[event] || []).push(handler);
  },
  emit: function(event, data) {
    (this._handlers[event] || []).forEach(function(h) { h(data); });
  }
};

// 使用示例：
// 战斗系统触发事件
SD.EventBus.emit('battle:end', { victory: true, rewards: {...} });

// 存档系统监听
SD.EventBus.on('battle:end', function(data) {
  if (data.victory) SD.SaveSystem.autoSave();
});

// UI 系统监听
SD.EventBus.on('hero:levelUp', function(data) {
  SD.UIToast.show(data.heroName + ' 升级了！');
});
```

### 3. 构建脚本：合并为单 HTML

```javascript
// build/build.js
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_FILE = path.join(__dirname, '../dist/index.html');

// 读取顺序（依赖关系）
const JS_FILES = [
  'core/constants.js',
  'core/utils.js',
  'core/events.js',
  'data/heroes.js',
  'data/equipment.js',
  // ... 按依赖顺序
  'app.js'
];

const CSS_FILES = [
  'ui/styles/base.css',
  'ui/styles/components.css',
  'ui/styles/pages.css',
  'ui/styles/animations.css'
];

function build() {
  // 1. 读取 HTML 模板
  let html = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');
  
  // 2. 合并 CSS
  const css = CSS_FILES.map(f => fs.readFileSync(path.join(SRC_DIR, f), 'utf8')).join('\n');
  html = html.replace('<!-- CSS_PLACEHOLDER -->', `<style>${css}</style>`);
  
  // 3. 合并 JS
  const js = JS_FILES.map(f => fs.readFileSync(path.join(SRC_DIR, f), 'utf8')).join('\n');
  html = html.replace('<!-- JS_PLACEHOLDER -->', `<script>${js}</script>`);
  
  // 4. 输出
  fs.mkdirSync(path.dirname(DIST_FILE), { recursive: true });
  fs.writeFileSync(DIST_FILE, html);
  
  console.log('✅ 构建完成:', DIST_FILE);
  console.log('📦 大小:', (html.length/1024).toFixed(1) + 'KB');
}

build();
```

### 4. 开发工作流

```bash
# 开发模式（监听文件变化自动重建）
node build/watch.js

# 生产构建
node build/build.js

# 验证构建输出
node test/code-audit.test.js dist/index.html
```

---

## 迁移步骤（渐进式）

### 阶段1：基础设施（1-2天）
1. 创建 `src/` 目录结构
2. 提取 `core/utils.js`（BigNumber, LogScale 等纯工具）
3. 提取 `core/events.js`（事件总线）
4. 创建 `build/build.js`
5. 验证构建输出与原始文件一致

### 阶段2：数据层（2-3天）
1. 提取所有数据定义到 `src/data/`
2. 验证游戏仍能正常运行

### 阶段3：系统层（5-7天）
1. 逐个提取系统到 `src/systems/`
2. 每次提取后运行测试验证
3. 优先提取：存档 → 英雄 → 装备 → 战斗

### 阶段4：UI层（3-4天）
1. 提取 CSS 到 `src/ui/styles/`
2. 提取渲染函数到 `src/ui/pages/`
3. 提取通用组件到 `src/ui/components/`

### 阶段5：优化（2-3天）
1. 引入事件总线解耦直接调用
2. 消除循环依赖
3. 添加模块单元测试

---

## 收益

| 维度 | 当前 | 解耦后 |
|-----|------|--------|
| 文件大小 | 1108KB 单文件 | 相同（构建后） |
| 代码行数 | 26294 行 | 相同 |
| 模块数量 | 1 | ~30+ |
| 全局变量 | ~200+ | < 10（仅 SD 命名空间） |
| 可测试性 | ❌ 无法单元测试 | ✅ 每个模块可独立测试 |
| 协作冲突 | ❌ 极高 | ✅ 极低 |
| 代码复用 | ❌ 无法复用 | ✅ 模块可复用 |
| 构建步骤 | 无 | 一键构建 |

---

## 风险与缓解

| 风险 | 缓解措施 |
|-----|---------|
| 构建引入bug | 每次提取后运行完整测试套件对比 |
| 性能下降 | 构建输出与原始文件做字节级对比 |
| 学习成本 | 保持 IIFE 格式，不引入新语法 |
| 部署复杂 | 构建输出仍是单 HTML，部署方式不变 |
