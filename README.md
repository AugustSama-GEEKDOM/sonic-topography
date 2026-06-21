# Sonic Topography - Wallpaper Engine Edition

基于 [sonic-topography](https://github.com/yin-yizhen/sonic-topography) 改造的 Wallpaper Engine 音频可视化壁纸。

使用 React + Three.js (R3F) + Vite + Web Audio 构建，支持音频频谱驱动的 3D 地形可视化，兼容 Wallpaper Engine 的 `file://` 协议运行环境。

## 功能

- 3D 音频响应式地形可视化（频谱驱动高度/颜色/波纹/流星）
- **Wallpaper Engine 系统音频桥接** — 通过 `wallpaperRegisterAudioListener` 捕获系统音频
- **全局 FPS 限制** — 读取用户 Wallpaper Engine 性能设置中的帧率上限
- **鼠标跟随视角** — 移动鼠标控制摄像机轨道
- **液态玻璃媒体信息面板** — 右上角展示当前播放曲目信息（framer-motion 动画）
- **动态主题** — 支持 Wallpaper Engine 媒体集成自动切换主题色
- 内置 Demo 音频和同步 LRC 歌词
- 网易云音乐搜索（需本地服务器代理）
- 音频文件上传 / 拖拽播放
- 歌单保存到浏览器 `localStorage`
- **用户自定义属性** — 音频灵敏度、光亮强度、视角跟随灵敏度可调

## 用户自定义属性

在 Wallpaper Engine 编辑器中添加以下属性（Edit → Change Project Settings → Add Property）：

| 属性 Key | 类型 | 范围 | 默认值 | 说明 |
|---|---|---|---|---|
| `audiosensitivity` | Slider | 0.1 – 5.0 | 1.0 | 音频响应灵敏度倍率 |
| `glowintensity` | Slider | 0.0 – 3.0 | 1.0 | 地形光亮强度倍率 |
| `camerasensitivity` | Slider | 0.1 – 3.0 | 1.0 | 鼠标跟随视角灵敏度 |

> 所有 Slider 需启用 **Fraction** 选项（Precision 设为 1，即 0.1 步进）。

## Wallpaper Engine 部署

### 方法一：直接使用 `dist/` 文件夹

1. 克隆本仓库
2. 打开 Wallpaper Engine → 创建壁纸 → 选择 Web 类型
3. 指向 `dist/index.html` 即可

无需额外构建，`dist/` 已包含单文件 IIFE 打包产物，兼容 `file://` 协议。

### 方法二：自行构建

```powershell
npm install
npm run build
```

产物在 `dist/` 目录。

## 开发运行

```powershell
npm install
npm run dev
```

打开 `http://127.0.0.1:3000`

## 本地生产运行（含网易云代理）

```powershell
npm run build
npm start
```

打开 `http://127.0.0.1:4173`

## Demo 文件

```text
public/demo.mp3
public/demo.lrc
```

## 注意事项

- Wallpaper Engine 环境下网易云搜索功能不可用（无本地服务器），仅本地播放 / 系统音频可视化有效
- `file://` 协议下 CORS 已处理，构建产物可直接离线运行
- FPS 限制在 Wallpaper Engine 性能设置中调整，程序自动读取
- `dist/` 目录已纳入版本管理，方便直接部署

## 常用命令

```powershell
npm run lint      # TypeScript 类型检查
npm run build     # 生产构建
npm start         # 启动本地服务器
```
