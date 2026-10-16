# 不吱岛 · 菜菜岛主生日庆典

React + TypeScript 活动首页与页面导航骨架，保留原有本地图片排版编辑器。本次庆祝菜菜的生日，吱吱作为共同岛主和庆生搭档出现。

## 启动与验证

```bash
npm ci
npm run dev
npm test
npm run build
```

## 当前页面

采用 URL hash 导航，无新增路由依赖，支持直达链接、刷新以及浏览器前进/后退，部署时无需为每个活动页面配置服务端回退。

| 地址 | 页面 | 当前内容 |
| --- | --- | --- |
| `#/` | 庆典码头 | 邀请卡、公告、签到/任务入口和活动导航 |
| `#/check-in` | 签到 | 签到功能筹备提示 |
| `#/office` | 岛民事务所 | 任务与奖励功能筹备提示 |
| `#/post-office` | 肥啾邮局 | 祝福功能筹备提示 |
| `#/collection` | 回忆收藏室 | 抽卡与仓库功能筹备提示 |
| `#/mailbox` | 岛主信箱 | 与首页共用的公告列表 |
| `#/editor` | 排版工作台 | 原有排版编辑器 |

未知地址展示返回码头入口。手机导航通过按钮展开，切换页面后收起；导航提供当前页标记和键盘焦点样式。页面切换时更新标题并聚焦主内容。`index.html` 补充移动端 viewport 和中文语言声明。

当前没有接入签到记录、金币账本、代码核验、抽卡、祝福提交或服务端公告管理。活动页显示明确的筹备状态，不会生成虚假的奖励或提交结果。公告内容目前维护在 `src/App.tsx` 的 `announcements` 中，首页与岛主信箱使用同一数据源。

## 后续拆分文件结构

当前优先集中改造 `src/App.tsx` 和 `src/styles.css`；以下为下一阶段建议结构，尚未创建对应文件：

```text
src/
  App.tsx                          # 根布局与页面调度
  navigation/
    activityPages.ts                # 页面元数据与路径类型
    useHashPage.ts                  # hash 监听、标题与焦点处理
  components/
    celebration/
      CelebrationHeader.tsx        # 品牌、顶部导航与手机菜单
      CelebrationFooter.tsx        # 页脚与工作台入口
      AnnouncementList.tsx         # 首页/信箱共用公告展示
      ActivityPlaceholder.tsx      # 活动未开放状态
    ...                            # 现有编辑器组件保留
  pages/
    CelebrationHome.tsx            # 庆典码头
    CheckInPage.tsx                 # 签到
    IslandOfficePage.tsx            # 岛民事务所
    BirdPostOfficePage.tsx          # 肥啾邮局
    MemoryCollectionPage.tsx        # 回忆收藏室
    IslandMailboxPage.tsx           # 岛主信箱/公告
    LayoutEditorPage.tsx            # 从 App 迁移现有 LayoutEditor
    NotFoundPage.tsx                # 未知地址
  data/
    announcements.ts               # 共用公告，后续可替换为 API
  styles.css                       # 全局基础与样式入口
  styles/
    celebration.css                # 活动布局与响应式样式
    editor.css                     # 现有编辑器样式
```

先提取导航配置、公告数据和共用布局，再逐页迁移；保持现有 hash 地址与数据存储键不变。首页任务入口指向事务所，首页公告入口指向信箱，避免维护两套公告。

## 排版工作台

通过页脚进入 `#/editor`：

1. 在左侧新建或切换排版页面。
2. 上传 PNG、WebP、GIF 或 JPG 图片，点击缩略图添加到画布。
3. 拖动图片移动，右下角控制点缩放，上方圆点旋转。
4. 在图层中调整层级、隐藏、锁定或删除元素。
5. 自动保存写入当前浏览器的本地数据；“导出”创建完整 ZIP 备份，“导入”恢复为新项目。

首次进入工作台才初始化编辑器，活动首页不依赖 IndexedDB。工作台首次打开后保持挂载，导航离开时隐藏，保留撤销历史和待执行的自动保存。编辑器 CSS 的 header 规则限定在 `.editor` 中，避免影响活动导航。

删除画布元素不会删除资产库原图。多个同浏览器窗口会收到保存更新；这不是跨设备同步。清除浏览器数据前请先导出备份。
