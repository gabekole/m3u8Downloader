const puppeteer = require('puppeteer-core');
const fs = require('fs');
const https = require('https');
const path = require('path');

let latestM3U8 = null;

(async () => {
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    const pages = await browser.pages();
    const page = pages[pages.length - 1];
    const title = await page.title();
    console.log("✅ Connected to tab:", title);
    
    // Listen for all requests to detect .m3u8
    page.on('request', (req) => {
        const url = req.url();
        if (url.endsWith('.m3u8')) {
            latestM3U8 = url;
            console.log("🎯 Captured .m3u8 URL:", url);
        }
    });
    
    // Inject download button + MutationObserver
    await page.evaluate(() => {
        function injectDownloadButton() {
            if (document.getElementById("video-dl-btn")) return;
            
            const btn = document.createElement("button");
            btn.id = "video-dl-btn";
            btn.innerText = "⬇ Download Video";
            btn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            padding: 12px 20px;
            background: #0070f3;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
          `;
            document.body.appendChild(btn);
        }
        
        injectDownloadButton();
        
        const observer = new MutationObserver(() => {
            injectDownloadButton();
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    });
    
    
    // Expose the segment download function
    await page.exposeFunction("triggerDownloadFromNode", async () => {
        if (!latestM3U8) {
            console.log("⚠️ No .m3u8 URL captured yet.");
            return;
        }
        
        const base = latestM3U8.substring(0, latestM3U8.lastIndexOf("/") + 1);
        console.log("📥 Fetching playlist:", latestM3U8);
        
        const m3u8Text = await page.evaluate(async (url) => {
            const res = await fetch(url);
            return await res.text();
        }, latestM3U8);
        
        const segments = m3u8Text
        .split("\n")
        .filter(line => line && !line.startsWith("#"))
        .map(line => base + line);
        
        if (segments.length === 0) {
            console.log("❌ No segments found in playlist.");
            return;
        }
        
        const folder = path.join(__dirname, 'downloads');
        if (!fs.existsSync(folder)) fs.mkdirSync(folder);
        
        const existing = fs.readdirSync(folder)
        .filter(f => /^video_(\d+)\.ts$/.test(f))
        .map(f => parseInt(f.match(/^video_(\d+)\.ts$/)[1], 10));
        
        const nextIndex = (existing.length > 0 ? Math.max(...existing) + 1 : 1)
        .toString()
        .padStart(3, '0');
        
        const filename = path.join(folder, `video_${nextIndex}.ts`);
        const file = fs.createWriteStream(filename);
        
        for (let i = 0; i < segments.length; i++) {
            console.log(`⬇ Segment ${i + 1} / ${segments.length}`);
            await new Promise((resolve, reject) => {
                https.get(segments[i], (res) => {
                    res.pipe(file, { end: false });
                    res.on("end", resolve);
                    res.on("error", reject);
                }).on("error", reject);
            });
        }
        
        file.end(() => {
            console.log(`✅ Download complete: ${filename}`);
        });
    });
    
    
    // One-time download listener setup
    await page.evaluate(() => {
        document.getElementById("video-dl-btn").addEventListener("click", () => {
            window.triggerDownloadFromNode();
        });
    });
    
    
    // Re-inject button and listener on each navigation or reload
    page.on('framenavigated', async () => {
        console.log("🔁 Page navigation detected, re-injecting download button...");
        
        await page.evaluate(() => {
            function injectDownloadButton() {
                if (document.getElementById("video-dl-btn")) return;
                
                const btn = document.createElement("button");
                btn.id = "video-dl-btn";
                btn.innerText = "⬇ Download Video";
                btn.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999999;
          padding: 12px 20px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
        `;
                btn.onclick = () => {
                    if (!window.__downloadInProgress) {
                        window.postMessage({ type: "DOWNLOAD_M3U8" }, "*");
                    }
                };
                document.body.appendChild(btn);
            }
            
            injectDownloadButton();
            
            if (!window.__downloadObserverAttached) {
                window.__downloadObserverAttached = true;
                
                const observer = new MutationObserver(() => {
                    injectDownloadButton();
                });
                
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
    });
    
    
    
    console.log("🟢 Ready! Play the video and click the '⬇ Download Video' button.");
})();
