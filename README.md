# YZMM Status - 前端

服务器状态监控前端页面。

## 功能

- 网站状态监控
- 服务器资源展示 (CPU/内存/运行时间/负载)
- Minecraft 服务器状态
- 多语言支持 (中文/English/日本語)
- 明暗主题切换

## 技术栈

Vite + Vue 3。API 由 Cloudflare Pages Function (`functions/api/[[path]].js`) 代理到 Worker。

## 开发

```bash
npm install
npm run dev      # 本地开发（mock 数据，/api 代理到 status.rishu.cfd）
npm run build    # 构建到 dist/
npm run preview  # wrangler pages dev dist（本地验证 Function）
npm run deploy   # 构建并部署到 Cloudflare Pages
```

## License

MIT
