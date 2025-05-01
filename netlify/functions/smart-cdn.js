// netlify/functions/smart-cdn.js

exports.handler = async function(event, context) {

  // HTML 内容基本保持不变
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BlogCDN 智能访问**</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-image: url('https://pic.imgdb.cn/item/66f6c978f21886ccc06c2337.jpg');
              background-size: cover;
              background-position: center;
              color: #333;
          }
          .container {
              background-color: rgba(255, 255, 255, 0.85);
              padding: 30px;
              border-radius: 10px;
              max-width: 400px;
              text-align: center;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          }
          h1 {
              font-size: 24px;
              color: #333;
              margin-bottom: 20px;
          }
          .cdn-list {
              margin-top: 20px;
              text-align: left;
          }
          .cdn-item {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              position: relative;
          }
          .cdn-item p {
              font-size: 16px;
              line-height: 1.5;
              color: #333;
              margin: 0;
              /* Adjust width if needed */
              /* width: 50%; */
          }
          .cdn-item span {
              margin-left: 10px; /* Add some space for the time */
              width: 60px; /* Fixed width for alignment */
              text-align: right;
          }
          .latency-bar {
              flex-grow: 1;
              height: 10px;
              background-color: #ddd;
              border-radius: 5px;
              overflow: hidden;
              margin-left: 10px;
              position: relative;
          }
          .latency-fill {
              height: 100%;
              background-color: #4caf50;
              width: 0;
              transition: width 0.3s ease;
          }
          .fastest {
              font-weight: bold;
              color: green;
              margin-top: 20px;
              font-size: 18px;
          }
          .visitor-count {
              font-size: 14px;
              color: #666;
              margin-top: 10px;
          }
          .ip-address {
              font-size: 14px;
              color: #555;
              margin-top: 15px;
              font-style: italic;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>BlogCDN 智能访问**</h1>
          <div class="cdn-list">
              <div class="cdn-item">
                  <p>CF BGP:</p> {/* Shorter name */}
                  <div class="latency-bar"><div class="latency-fill" id="cdn0-latency"></div></div>
                  <span id="cdn0-time">测量中...</span>
              </div>
              <div class="cdn-item">
                  <p>Netlify:</p>
                  <div class="latency-bar"><div class="latency-fill" id="cdn1-latency"></div></div>
                  <span id="cdn1-time">测量中...</span>
              </div>
              <div class="cdn-item">
                  <p>Vercel:</p>
                  <div class="latency-bar"><div class="latency-fill" id="cdn2-latency"></div></div>
                  <span id="cdn2-time">测量中...</span>
              </div>
              <div class="cdn-item">
                  <p>CF Pages:</p> {/* More specific name */}
                  <div class="latency-bar"><div class="latency-fill" id="cdn3-latency"></div></div>
                  <span id="cdn3-time">测量中...</span>
              </div>
              </div>
          <div class="fastest" id="fastest-cdn">
              最快 CDN: 测量中...
          </div>
          <div class="visitor-count">
              🧲🤣!!! 📈今日访问人数:<span id="visitCount">加载中...</span>
          </div>
          <div class="ip-address">
              您的 IP 地址: <span id="clientIP">加载中...</span>
          </div>

          <script>
              // 获取访问人数 (保持不变)
              fetch('https://tongji.090227.xyz/?id=hexo.gally.ddns-ip.net') // 请确保这里的ID适用于您的新部署或使用您自己的统计服务
                  .then(r => r.json())
                  .then(d => document.getElementById('visitCount').innerText = d.visitCount)
                  .catch(e => document.getElementById('visitCount').innerText = '加载失败');

              // 获取客户端 IP 地址 (保持不变)
              fetch('https://api.ipify.org?format=json')
                  .then(response => response.json())
                  .then(data => document.getElementById('clientIP').innerText = data.ip)
                  .catch(e => document.getElementById('clientIP').innerText = '加载失败');
          </script>

          <script>
              // 测试延迟的函数 (保持不变)
              async function testLatency(url, latencyElementId, timeElementId) {
                  const start = Date.now();
                  let latency = 9999; // Default to a high latency
                  try {
                      // Adding cache-busting query parameter
                      const testUrl = url + '?t=' + Date.now();
                      const response = await fetch(testUrl, { method: 'GET', cache: 'no-store' }); // Ensure fresh request
                      // We don't necessarily need to read the body for latency check
                      // await response.text(); 
                      if (response.ok) {
                          latency = Date.now() - start;
                      } else {
                         console.warn('Fetch failed for:', url, 'Status:', response.status);
                      }
                  } catch (error) {
                      console.error('Latency test error for:', url, error);
                      // Keep latency high if fetch fails
                  }
                  document.getElementById(timeElementId).textContent = latency < 9999 ? latency + 'ms' : '失败';

                  // Update latency bar visualization (adjust scaling as needed)
                  const maxLatencyForBar = 1000; // e.g., 1000ms = 0% width, 0ms = 100% width
                  const widthPercentage = Math.max(0, Math.min(100, 100 - (latency / maxLatencyForBar * 100)));
                  document.getElementById(latencyElementId).style.width = widthPercentage + '%';
                  // Change color based on latency maybe?
                  if (latency < 200) {
                     document.getElementById(latencyElementId).style.backgroundColor = '#4caf50'; // Green
                  } else if (latency < 500) {
                     document.getElementById(latencyElementId).style.backgroundColor = '#ffeb3b'; // Yellow
                  } else {
                     document.getElementById(latencyElementId).style.backgroundColor = '#f44336'; // Red
                     if (latency >= 9999) { // If failed explicitly show 0 width bar
                         document.getElementById(latencyElementId).style.width = '0%';
                     }
                  }

                  return latency;
              }

              async function measureAllLatencies() {
                  const cdnUrls = [
                      'https://hexo.gally.ddns-ip.net', // CF BGP
                      'https://hexo-gally.netlify.app', // Netlify
                      'https://hexo-gally.vercel.app',  // Vercel
                      'https://hexo-987.pages.dev'      // CF Pages
                  ];
                  const cdnNames = ['CF BGP', 'Netlify', 'Vercel', 'CF Pages'];
                  const latencyElementIds = ['cdn0-latency', 'cdn1-latency', 'cdn2-latency', 'cdn3-latency'];
                  const timeElementIds = ['cdn0-time', 'cdn1-time', 'cdn2-time', 'cdn3-time'];

                  const results = await Promise.all(
                      cdnUrls.map((url, index) => testLatency(url, latencyElementIds[index], timeElementIds[index]))
                  );

                  let fastestIndex = -1;
                  let minLatency = Infinity;

                  results.forEach((latency, index) => {
                      if (latency < minLatency) {
                          minLatency = latency;
                          fastestIndex = index;
                      }
                  });


                  if (fastestIndex !== -1) {
                      document.getElementById('fastest-cdn').textContent = '最快 CDN: ' + cdnNames[fastestIndex] + ' (' + minLatency + 'ms) ✅';
                      // 自动跳转到最快的 CDN
                       // Add a small delay before redirecting to allow user to see results
                       setTimeout(() => {
                           window.location.href = cdnUrls[fastestIndex];
                       }, 1500); // Delay for 1.5 seconds
                  } else {
                      document.getElementById('fastest-cdn').textContent = '未能确定最快的 CDN ❌';
                      // Handle the case where all tests fail - maybe redirect to a default?
                      // setTimeout(() => {
                      //     window.location.href = cdnUrls[0]; // Default to first CDN
                      // }, 1500);
                  }
              }

              // 开始测量延迟
              measureAllLatencies();
          </script>
      </div>
  </body>
  </html>
  `;

  // 返回 Netlify Function 响应
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-cache' // Prevent caching of the redirector page itself
    },
    body: htmlContent,
  };
}; 