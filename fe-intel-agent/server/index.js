const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// 存储采集与摘要结果
const DATA_PATH = path.join(__dirname, "data.json");
function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}
function loadData() {
  if (fs.existsSync(DATA_PATH)) {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  }
  return [];
}

// OpenAI摘要
const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);
async function summarize(text) {
  const res = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "请用简明中文总结以下前端技术资讯，突出要点。",
      },
      { role: "user", content: text },
    ],
    max_tokens: 256,
  });
  return res.data.choices[0].message.content.trim();
}

// 示例采集X（Twitter）内容（需替换为真实API或爬虫）
async function fetchX() {
  // 这里只做演示，实际应调用API或爬虫
  return [
    {
      title: "X前端热帖",
      url: "https://x.com/example",
      content: "React 19 发布，带来新特性...",
    },
  ];
}
// 示例采集微信公众号内容（需替换为真实API或爬虫）
async function fetchWeChat() {
  // 这里只做演示，实际应调用API或爬虫
  return [
    {
      title: "公众号：前端之巅",
      url: "https://mp.weixin.qq.com/example",
      content: "Vue 4.0 预览版发布...",
    },
  ];
}

// 定时采集与摘要
cron.schedule("0 * * * *", async () => {
  const xList = await fetchX();
  const wxList = await fetchWeChat();
  const all = [...xList, ...wxList];
  const summarized = [];
  for (const item of all) {
    const summary = await summarize(item.content);
    summarized.push({ ...item, summary, time: new Date().toISOString() });
  }
  saveData(summarized);
  console.log("定时采集与摘要完成");
});

// API: 获取最新情报
app.get("/api/news", (req, res) => {
  res.json(loadData());
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Agent后端已启动，端口", PORT);
});
