# 🎯 m3u8 Video Sniffer

**Video Sniffer** is a Puppeteer-powered tool that automatically detects `.m3u8` video streams from a Chrome tab and injects a **"⬇ Download Video"** button to download the stream as a `.ts` file.

---

## ⚙️ Features

- ✅ Attaches to an existing Chrome tab
- 🔎 Detects HLS video streams (`.m3u8`) in real-time
- 🧲 Injects a floating **Download Video** button into the active page
- 📥 Downloads and stitches all `.ts` segments into a single file
- 💾 Saves each video in a `downloads/` folder with auto-incremented names (`video_001.ts`, `video_002.ts`, ...)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install puppeteer-core
```

> ⚠️ This project uses `puppeteer-core` to connect to an **existing** Chrome instance.

---

### 2. Launch Chrome with Remote Debugging

Close all Chrome windows, then launch it manually:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-debug"
```

Replace `C:\Program Files\Google\Chrome\Application\chrome.exe` with your chrome executable location.

> You can change the `user-data-dir` to keep session cookies (useful for login).

---

### 3. Run the Sniffer

```bash
node video-sniffer.js
```

---

## 🧠 How It Works

- Connects to your open Chrome tab via the [Chrome DevTools Protocol](https://chromedevtools.dev/)
- Listens to all network requests and captures the first valid `.m3u8` playlist
- Injects a `⬇ Download Video` button directly into the page DOM
- When clicked:
  - Fetches the full `.m3u8` playlist
  - Downloads each `.ts` segment sequentially
  - Saves a combined `.ts` file in `./downloads/`

---

## 📁 Output Structure

```
video-sniffer/
├── downloads/
│   ├── video_001.ts
│   ├── video_002.ts
│   └── ...
├── video-sniffer.js
└── README.md
```

---

## 📌 Notes

- The script **does not re-encode** — it simply merges segments for playback.
- This is for **educational and archival purposes**. Make sure you comply with any terms of service for content you access.
- It works with websites using [HLS](https://developer.apple.com/streaming/) video delivery (`.m3u8` streams).

---

## ✅ Future Ideas

- Auto-convert to `.mp4` using `ffmpeg`
- Add subtitle or metadata support
- Create a batch download queue
- Headless download mode (no UI injection)

---

## 🧑‍💻 Author

Built by [Your Name] — feel free to contribute or fork!

---

Would you like a companion `package.json` or a `.bat` launcher to simplify startup?