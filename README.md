# YZMM Status - 前端

服务器状态监控前端页面。

## 功能

- 网站状态监控
- 服务器资源展示 (CPU/内存/运行时间/负载)
- Minecraft 服务器状态
- 多语言支持 (中文/English/日本語)
- 明暗主题切换

## 部署

上传到 Cloudflare Pages 或任何静态托管。

## 配置

编辑 `app.js` 中的 `CONFIG`：

```javascript
const CONFIG = {
    apiBase: '/api',  // API 地址
    refreshInterval: 10000,  // 刷新间隔(毫秒)
    devMode: false  // 生产环境设为 false
};
```

## License

MIT
