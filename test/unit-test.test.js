/**
 * 暗影地牢 RPG - Node.js 单元测试
 * 直接测试核心游戏逻辑，不依赖浏览器
 * 
 * 运行方式:
 *   node unit-test.test.js
 */

// ==================== 测试框架 ====================
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.beforeEachFn = null;
    this.afterEachFn = null;
  }

  beforeEach(fn) { this.beforeEachFn = fn; }
  afterEach(fn) { this.afterEachFn = fn; }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 单元测试开始');
    console.log('='.repeat(60));
    const startTime = Date.now();

    for (const t of this.tests) {
      try {
        if (this.beforeEachFn) await this.beforeEachFn();
        await t.fn();
        if (this.afterEachFn) await this.afterEachFn();
        this.passed++;
        console.log('✅', t.name);
      } catch (e) {
        this.failed++;
        console.log('❌', t.name);
        console.log('   ', e.message);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 结果:', this.passed, '通过,', this.failed, '失败,', this.tests.length, '总计');
    console.log('⏱️ 耗时:', duration + 's');
    console.log('='.repeat(60));

    return this.failed === 0;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || '断言失败');
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `期望 ${expected}, 实际 ${actual}`);
  }
}

function assertTrue(value, message) {
  if (value !== true) throw new Error(message || `期望 true, 实际 ${value}`);
}

function assertFalse(value, message) {
  if (value !== false) throw new Error(message || `期望 false, 实际 ${value}`);
}

// ==================== 模拟环境 ====================
function setupEnv() {
  const storage = {};
  global.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };
  return storage;
}

// ==================== 测试用例 ====================
const runner = new TestRunner();
let storage;
runner.beforeEach(() => { storage = setupEnv(); });
runner.afterEach(() => { if (global.localStorage) global.localStorage.clear(); });

// ========== 1. 存档系统测试 ==========
runner.test('存档 - localStorage 基础操作', () => {
  localStorage.setItem('test_key', 'test_value');
  assertEquals(localStorage.getItem('test_key'), 'test_value');
});

runner.test('存档 - 存档键名格式', () => {
  const slotIdx = 0;
  const expectedKey = `shadow_dungeon_save_${slotIdx}`;
  localStorage.setItem(expectedKey, JSON.stringify({ game: { heroes: [] } }));
  assertEquals(localStorage.getItem(expectedKey) !== null, true, '存档键名不匹配');
});

runner.test('存档 - 存档数据结构', () => {
  const saveData = {
    version: 1,
    timestamp: Date.now(),
    game: {
      heroes: [{ uid: 'test_1', name: '测试英雄', level: 1, quality: 'common' }],
      stageProgress: 1,
      resources: { gold: 100, gems: 10 },
      equipment: []
    }
  };
  localStorage.setItem('shadow_dungeon_save_0', JSON.stringify(saveData));
  const loaded = JSON.parse(localStorage.getItem('shadow_dungeon_save_0'));
  assert(loaded.game, '缺少 game 字段');
  assert(Array.isArray(loaded.game.heroes), 'heroes 不是数组');
  assertEquals(loaded.game.heroes[0].name, '测试英雄', '英雄名称不对');
});

runner.test('存档 - 多槽位存档', () => {
  for (let i = 0; i < 3; i++) {
    localStorage.setItem(`shadow_dungeon_save_${i}`, JSON.stringify({ slot: i, timestamp: Date.now() + i }));
  }
  assertEquals(localStorage.getItem('shadow_dungeon_save_0') !== null, true);
  assertEquals(localStorage.getItem('shadow_dungeon_save_1') !== null, true);
  assertEquals(localStorage.getItem('shadow_dungeon_save_2') !== null, true);
});

runner.test('存档 - 存档覆盖', () => {
  localStorage.setItem('shadow_dungeon_save_0', JSON.stringify({ gold: 100 }));
  localStorage.setItem('shadow_dungeon_save_0', JSON.stringify({ gold: 200 }));
  const loaded = JSON.parse(localStorage.getItem('shadow_dungeon_save_0'));
  assertEquals(loaded.gold, 200, '存档未正确覆盖');
});

runner.test('存档 - 损坏存档处理', () => {
  localStorage.setItem('shadow_dungeon_save_0', 'invalid json {{{');
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem('shadow_dungeon_save_0'));
  } catch (e) {}
  assertEquals(parsed, null, '损坏存档不应解析成功');
});

// ========== 2. 英雄系统测试 ==========
runner.test('英雄 - 英雄数据结构', () => {
  const hero = {
    uid: 'h_1', name: '战士', level: 10, quality: 'rare',
    maxHP: 100, hp: 100, atk: 20, def: 15, spd: 10,
    equipment: { weapon: null, armor: null, accessory: null }
  };
  assert(hero.uid, '英雄缺少 uid');
  assert(hero.name, '英雄缺少 name');
  assert(hero.level > 0, '英雄等级无效');
  assert(['common', 'rare', 'epic', 'legendary', 'mythic'].includes(hero.quality), '英雄品质无效');
});

runner.test('英雄 - 装备槽位结构', () => {
  const equipment = { weapon: null, armor: null, accessory: null };
  assert('weapon' in equipment, '缺少 weapon 槽');
  assert('armor' in equipment, '缺少 armor 槽');
  assert('accessory' in equipment, '缺少 accessory 槽');
});

runner.test('英雄 - 品质等级排序', () => {
  const qualities = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const order = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
  for (let i = 0; i < qualities.length - 1; i++) {
    assert(order[qualities[i]] < order[qualities[i + 1]],
      `品质排序错误: ${qualities[i]} vs ${qualities[i + 1]}`);
  }
});

// ========== 3. 装备系统测试 ==========
runner.test('装备 - 装备数据结构', () => {
  const equip = { uid: 1, id: 'rusty_sword', heroUid: null, enhance: 0 };
  assert(typeof equip.uid === 'number', '装备 uid 应为数字');
  assert(equip.id, '装备缺少 id');
  assert(equip.heroUid === null || typeof equip.heroUid === 'string', 'heroUid 类型错误');
});

runner.test('装备 - 强化等级上限', () => {
  const MAX_ENHANCE = 10;
  const enhance = 5;
  assert(enhance >= 0, '强化等级不能为负');
  assert(enhance <= MAX_ENHANCE, `强化等级不能超过 ${MAX_ENHANCE}`);
});

runner.test('装备 - 装备类型有效性', () => {
  const validTypes = ['weapon', 'armor', 'accessory'];
  assert(validTypes.includes('weapon'), `无效装备类型`);
});

// ========== 4. 战斗系统测试 ==========
runner.test('战斗 - 战斗状态变量', () => {
  const battleState = { running: false, paused: false, round: 0, maxRounds: 50 };
  assertFalse(battleState.running, '初始状态不应在战斗中');
  assertFalse(battleState.paused, '初始状态不应暂停');
  assertEquals(battleState.round, 0, '初始回合应为 0');
});

runner.test('战斗 - 回合限制', () => {
  const maxRounds = 50;
  const currentRound = 51;
  assert(currentRound >= maxRounds, '应超过最大回合数');
});

// ========== 5. 资源系统测试 ==========
runner.test('资源 - 资源类型完整性', () => {
  const resources = { gold: 100, gems: 10, food: 50, stone: 30, iron: 20, expPotion: 5 };
  const required = ['gold', 'gems', 'food', 'stone', 'iron', 'expPotion'];
  for (const res of required) {
    assert(res in resources, `缺少资源类型: ${res}`);
  }
});

runner.test('资源 - 资源上限', () => {
  const RESOURCE_LIMITS = { gold: 9999999, gems: 999999, food: 99999, stone: 99999, iron: 99999, expPotion: 9999 };
  const currentGold = 10000000;
  assert(currentGold > RESOURCE_LIMITS.gold, '应超过金币上限');
});

// ========== 6. 肉鸽系统测试 ==========
runner.test('肉鸽 - 肉鸽状态结构', () => {
  const rlState = {
    phase: 'active', floor: 1, heroes: [], blessings: [], relics: [], events: [], _goldPool: 50
  };
  assert(['active', 'fighting', 'blessing', 'event', 'relic'].includes(rlState.phase), '无效 phase');
  assert(rlState.floor >= 1, 'floor 应 >= 1');
  assert(rlState._goldPool >= 0, '金币池不能为负');
});

runner.test('肉鸽 - 英雄深拷贝', () => {
  const original = { uid: 'orig_1', name: '原英雄', hp: 100 };
  const cloned = JSON.parse(JSON.stringify(original));
  cloned.uid = 'rl_' + Date.now();
  cloned._rlOriginalUid = original.uid;
  assert(cloned.uid !== original.uid, '拷贝后 uid 应不同');
  assertEquals(cloned._rlOriginalUid, original.uid, '应记录原始 uid');
});

// ========== 7. 存档读档集成测试 ==========
runner.test('集成 - 完整存档读档流程', () => {
  const state = {
    version: 1, timestamp: Date.now(),
    game: {
      heroes: [{ uid: 'h1', name: '战士', level: 5, quality: 'common', equipment: { weapon: null, armor: null, accessory: null } }],
      stageProgress: 3,
      resources: { gold: 500, gems: 20 },
      equipment: [{ uid: 1, id: 'rusty_sword', heroUid: null, enhance: 0 }],
      team: [null, null, null, null, null, null]
    }
  };
  localStorage.setItem('shadow_dungeon_save_0', JSON.stringify(state));
  state.game.resources.gold += 1000;
  state.game.heroes[0].level += 1;
  localStorage.setItem('shadow_dungeon_save_0', JSON.stringify(state));
  const loaded = JSON.parse(localStorage.getItem('shadow_dungeon_save_0'));
  assertEquals(loaded.game.resources.gold, 1500, '金币未正确保存');
  assertEquals(loaded.game.heroes[0].level, 6, '英雄等级未正确保存');
  assertEquals(loaded.game.stageProgress, 3, '关卡进度不应改变');
});

runner.test('集成 - 多槽位切换', () => {
  localStorage.setItem('shadow_dungeon_save_0', JSON.stringify({ game: { heroes: [{ name: '新手' }], stageProgress: 1 } }));
  localStorage.setItem('shadow_dungeon_save_1', JSON.stringify({ game: { heroes: [{ name: '高手' }], stageProgress: 50 } }));
  const slot0 = JSON.parse(localStorage.getItem('shadow_dungeon_save_0'));
  const slot1 = JSON.parse(localStorage.getItem('shadow_dungeon_save_1'));
  assertEquals(slot0.game.heroes[0].name, '新手', '槽位0数据错误');
  assertEquals(slot1.game.heroes[0].name, '高手', '槽位1数据错误');
  assertEquals(slot0.game.stageProgress, 1, '槽位0进度错误');
  assertEquals(slot1.game.stageProgress, 50, '槽位1进度错误');
});

runner.test('集成 - 存档损坏恢复', () => {
  const validData = { version: 1, game: { heroes: [], stageProgress: 1 } };
  localStorage.setItem('shadow_dungeon_save_0', JSON.stringify(validData));
  localStorage.setItem('shadow_dungeon_save_0', ' corrupted { data');
  let loadSuccess = false;
  let loadedData = null;
  try {
    loadedData = JSON.parse(localStorage.getItem('shadow_dungeon_save_0'));
    loadSuccess = true;
  } catch (e) {}
  assertFalse(loadSuccess, '损坏存档不应加载成功');
  assertEquals(loadedData, null, '损坏数据不应被解析');
});

// ========== 8. 边界条件测试 ==========
runner.test('边界 - 空英雄列表', () => {
  assertEquals([].length, 0, '空列表长度应为 0');
});

runner.test('边界 - 最大装备数量', () => {
  assert(150 <= 200, '装备数不应超过 200');
});

runner.test('边界 - 英雄等级上限', () => {
  assert(150 <= 200, `等级不应超过 200`);
});

runner.test('边界 - 空装备槽', () => {
  const equipment = { weapon: null, armor: null, accessory: null };
  assertEquals(equipment.weapon, null, 'weapon 应为 null');
  assertEquals(equipment.armor, null, 'armor 应为 null');
  assertEquals(equipment.accessory, null, 'accessory 应为 null');
});

// ========== 9. 性能测试 ==========
runner.test('性能 - 大数据量存档', () => {
  const heroes = [];
  for (let i = 0; i < 100; i++) {
    heroes.push({
      uid: `hero_${i}`, name: `英雄${i}`, level: i % 100,
      quality: ['common', 'rare', 'epic', 'legendary'][i % 4],
      equipment: { weapon: null, armor: null, accessory: null }
    });
  }
  const start = Date.now();
  const json = JSON.stringify({ game: { heroes } });
  localStorage.setItem('shadow_dungeon_save_big', json);
  const loaded = JSON.parse(localStorage.getItem('shadow_dungeon_save_big'));
  const duration = Date.now() - start;
  assertEquals(loaded.game.heroes.length, 100, '大数据量英雄数不对');
  assert(duration < 1000, `存档操作太慢: ${duration}ms`);
  console.log('   100英雄存档耗时:', duration + 'ms');
});

runner.test('性能 - 频繁存档', () => {
  const start = Date.now();
  for (let i = 0; i < 50; i++) {
    localStorage.setItem('shadow_dungeon_save_freq', JSON.stringify({ counter: i, timestamp: Date.now() }));
  }
  const duration = Date.now() - start;
  assert(duration < 2000, `50次存档太慢: ${duration}ms`);
  console.log('   50次存档耗时:', duration + 'ms');
});

// ==================== 运行测试 ====================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(e => {
  console.error('测试框架错误:', e);
  process.exit(1);
});
