const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

// ✅ ไม่ตัด query string แล้ว
function cleanUrl(url) {
  if (!url) return "";
  return url.trim();
}

// 🔍 INFO
app.get("/info", async (req, res) => {
  const url = cleanUrl(req.query.url);
  if (!url) return res.status(400).json({ error: "ไม่มี URL" });

  // ชั้น 1: noembed (YouTube/Vimeo เท่านั้น)
  try {
    const r1 = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const d1 = await r1.json();
    if (d1.title && !d1.error) {
      return res.json({
        title: d1.title,
        thumbnail: d1.thumbnail_url || "",
        duration: 0,
        uploader: d1.author_name || "Unknown"
      });
    }
  } catch (e) {
    console.log("NOEMBED FAIL:", e.message);
  }

  // ชั้น 2: yt-dlp พร้อม timeout ที่นานขึ้น
  exec(
    `yt-dlp --no-warnings --no-playlist --socket-timeout 10 -j "${url}"`,
    { shell: true, timeout: 30000 }, // ✅ เพิ่มเป็น 30s
    (err, stdout) => {
      if (!err && stdout) {
        try {
          const data = JSON.parse(stdout);
          return res.json({
            title: data.title || "ไม่มีชื่อ",
            thumbnail: data.thumbnail || "",
            duration: data.duration || 0,
            uploader: data.uploader || data.channel || "Unknown"
          });
        } catch {
          console.log("PARSE FAIL");
        }
      }

      return res.json({
        title: "ไม่สามารถดึงข้อมูลได้",
        thumbnail: "",
        duration: 0,
        uploader: "Unknown"
      });
    }
  );
});

// ⬇ DOWNLOAD
app.get("/download", (req, res) => {
  const url = cleanUrl(req.query.url);
  if (!url) return res.status(400).json({ error: "ไม่มี URL" });

  // ✅ bestvideo+bestaudio แทน bestaudio อย่างเดียว
  exec(
    `yt-dlp --no-warnings --no-playlist --socket-timeout 10 -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -g "${url}"`,
    { shell: true, timeout: 30000 }, // ✅ เพิ่มเป็น 30s
    (err, stdout, stderr) => {
      if (err) {
        console.log("DOWNLOAD ERROR:", err.killed ? "TIMEOUT" : stderr);
        return res.status(500).json({ error: "โหลดไม่ได้" });
      }

      // yt-dlp อาจ return หลาย URL (video+audio แยก)
      const urls = stdout.trim().split("\n");
      return res.json({
        download_url: urls[0], // URL แรก = video
        audio_url: urls[1] || null
      });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 Server running on port " + PORT));
