# 前端情报Agent

自动采集X（Twitter）、微信公众号等前端技术信息，AI自动摘要并推送到Web页面。

## 主要功能
- 定时采集X、微信公众号等前端资讯（可扩展）
- 调用OpenAI API自动摘要
- Web前端（React）展示情报

## 快速开始

### 1. 安装依赖
```bash
cd fe-intel-agent
npm install
cd client && npm install
```

### 2. 配置OpenAI API Key
在根目录新建 `.env` 文件：
```
OPENAI_API_KEY=你的key
```

### 3. 启动服务
```bash
# 启动后端
npm start
# 启动前端（开发模式）
cd client && npm start
```

### 4. 访问页面
浏览器访问 http://localhost:3000

## 目录结构
- server/  后端采集、摘要API
- client/  React前端展示

## 说明
- 采集X、微信公众号部分为演示代码，需替换为真实API或爬虫
- 支持定时任务自动采集
- 可扩展采集更多平台
