import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [news, setNews] = useState([]);
  useEffect(() => {
    axios.get('/api/news').then(res => setNews(res.data));
  }, []);
  return (
    <div style={{ maxWidth: 700, margin: '2em auto', fontFamily: 'sans-serif' }}>
      <h1>前端情报Agent</h1>
      <p>自动采集X、微信公众号等前端技术资讯，AI自动摘要。</p>
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {news.map((item, i) => (
          <li key={i} style={{ marginBottom: '2em', borderBottom: '1px solid #eee', paddingBottom: '1em' }}>
            <a href={item.url} target="_blank" rel="noopener noreferrer"><strong>{item.title}</strong></a>
            <div style={{ color: '#888', fontSize: '0.9em' }}>{item.time}</div>
            <div style={{ margin: '0.5em 0' }}>{item.summary}</div>
            <details>
              <summary>原文内容</summary>
              <div style={{ whiteSpace: 'pre-wrap', color: '#555' }}>{item.content}</div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
