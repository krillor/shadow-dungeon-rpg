# 🎮 暗影地牢 RPG - 自动化测试套件

## 测试脚本说明

本目录包含两套测试脚本，覆盖游戏的完整功能验证：

### 1. E2E 浏览器自动化测试 (`e2e-puppeteer.test.js`)

使用 Puppeteer 模拟真实浏览器环境，测试完整的用户交互流程。

**测试覆盖:**
- ✅ 页面加载与渲染
- ✅ 存档系统（创建、读取、覆盖、完整性验证）
- ✅ 读档功能（数据恢复、状态一致性）
- ✅ 导航栏所有标签页（城镇、英雄、编队、战斗、合成、装备、肉鸽、生肖）
- ✅ 英雄系统（列表、详情、交互）
- ✅ 编队系统（槽位显示）
- ✅ 战斗系统（界面、按钮）
- ✅ 装备系统（界面、一键穿戴）
- ✅ 合成系统（界面）
- ✅ 肉鸽系统（界面）
- ✅ 生肖系统（界面）
- ✅ 金手指/调试界面
- ✅ 性能测试（加载时间、内存泄漏）

**运行方式:**
```bash
# 安装依赖
npm install puppeteer

# 运行测试（有界面，适合调试）
node e2e-puppeteer.test.js

# 修改配置为 headless: true 可无界面运行
```

**配置项:**
```javascript
const CONFIG = {
  gameUrl: 'file:///path/to/index.html',  // 游戏页面路径
  headless: false,                         // true=无界面
  slowMo: 50,                              // 操作延迟(ms)
  timeout: 30000,                          // 全局超时
  screenshotDir: './screenshots',          // 截图保存目录
  viewport: { width: 1280, height: 900 }   // 视口大小
};
```

**输出:**
- 控制台实时报告（✅通过/❌失败）
- 失败测试自动截图保存到 `screenshots/` 目录
- HTML 测试报告 `screenshots/report.html`

---

### 2. Node.js 单元测试 (`unit-test.test.js`)

不依赖浏览器，直接测试核心数据结构和逻辑。

**测试覆盖:**
- ✅ 存档系统（localStorage 操作、数据结构、多槽位、损坏处理）
- ✅ 英雄系统（数据结构、装备槽、品质排序）
- ✅ 装备系统（数据结构、强化上限、类型验证）
- ✅ 战斗系统（状态变量、回合限制）
- ✅ 资源系统（类型完整性、上限检查）
- ✅ 肉鸽系统（状态结构、深拷贝验证）
- ✅ 集成测试（完整存档读档流程、多槽位切换、损坏恢复）
- ✅ 边界条件（空列表、最大值、空装备槽）
- ✅ 性能测试（大数据量存档、频繁存档）

**运行方式:**
```bash
# 直接运行（无需额外依赖）
node unit-test.test.js
```

**输出:**
```
🧪 单元测试开始
============================================================
✅ 存档 - localStorage 基础操作
✅ 存档 - 存档键名格式
✅ 存档 - 存档数据结构
...
============================================================
📊 结果: 25 通过, 0 失败, 25 总计
⏱️ 耗时: 0.05s
============================================================
```

---

## 交互路径覆盖

### 核心交互流程

```
1. 新手引导 → 城镇 → 战斗（第1关）
   - 验证: 战斗胜利后获得奖励、英雄升级

2. 城镇 → 英雄 → 查看详情 → 装备 → 自动穿戴
   - 验证: 装备正确显示、属性变化

3. 城镇 → 编队 → 添加英雄 → 保存队伍
   - 验证: 队伍槽位正确更新

4. 战斗 → 开始战斗 → 自动战斗 → 胜利/失败
   - 验证: 战斗日志、奖励发放、存档自动保存

5. 城镇 → 合成 → 选择材料 → 合成新英雄
   - 验证: 材料消耗、新英雄生成

6. 城镇 → 装备 → 强化 → 分解
   - 验证: 资源消耗、属性变化

7. 城镇 → 肉鸽 → 开始地牢 → 战斗 → 选择祝福 → 下一层
   - 验证: 肉鸽状态隔离、奖励发放

8. 城镇 → 生肖 → 挑战Boss → 战斗
   - 验证: 生肖币奖励、排行榜更新

9. 存档 → 读档 → 验证数据一致性
   - 验证: 所有数据正确恢复

10. 金手指 → 各种作弊功能
    - 验证: 功能正常、不影响存档
```

---

## 存档读档专项测试

### 测试场景

| 场景 | 预期结果 | 验证点 |
|------|---------|--------|
| 首次存档 | 成功写入 IndexedDB + localStorage | 双写验证 |
| 存档覆盖 | 新数据替换旧数据 | 时间戳更新 |
| 读档成功 | 数据完整恢复 | 英雄数、资源、关卡 |
| 读档失败 | 尝试备份恢复 | 自动备份机制 |
| 存档损坏 | 优雅降级 | 不崩溃、提示用户 |
| 多槽位 | 各槽位独立 | 数据不混淆 |
| 大数据量 | 性能可接受 | 100+英雄 < 1s |
| 频繁存档 | 无性能问题 | 50次 < 2s |

---

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Game E2E Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Puppeteer
        run: npm install puppeteer
      
      - name: Run Unit Tests
        run: node test/unit-test.test.js
      
      - name: Run E2E Tests
        run: node test/e2e-puppeteer.test.js
        env:
          PUPPETEER_EXECUTABLE_PATH: ${{ steps.setup-chrome.outputs.chrome-path }}
      
      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: test/screenshots/
```

---

## 扩展测试

### 添加新测试

**E2E 测试:**
```javascript
await t.test('我的新测试', async () => {
  // 1. 导航到页面
  await t.clickNav('town');
  
  // 2. 执行操作
  await t.page.click('#my-button');
  await page.waitForTimeout(300);
  
  // 3. 验证结果
  const result = await t.elementExists('#expected-element');
  if (!result) throw new Error('预期元素未出现');
});
```

**单元测试:**
```javascript
runner.test('我的新测试', () => {
  const data = { test: true };
  assert(data.test, '测试数据无效');
  assertEquals(data.test, true, '值不匹配');
});
```

---

## 故障排查

### 常见问题

**1. Puppeteer 启动失败**
```bash
# 安装系统依赖（Ubuntu/Debian）
sudo apt-get install -y libgbm-dev libxkbcommon-x11-0

# 或使用无沙箱模式
const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

**2. 游戏页面加载超时**
- 检查 `CONFIG.gameUrl` 路径是否正确
- 增加 `timeout` 值
- 确保 `index.html` 存在且可访问

**3. 元素选择器失败**
- 使用浏览器开发者工具检查实际 DOM 结构
- 更新选择器以匹配当前实现
- 添加 `waitForTimeout` 等待渲染完成

---

## 维护建议

1. **每次更新后运行**: 代码变更后执行完整测试套件
2. **定期回归测试**: 每周至少运行一次完整 E2E 测试
3. **截图对比**: 使用像素对比工具检测 UI 回归
4. **性能基线**: 记录性能指标，监控退化趋势
5. **更新选择器**: UI 变更时同步更新测试选择器
