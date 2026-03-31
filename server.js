const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());

// serve หน้าเว็บ
app.use(express.static(path.join(__dirname)));

// ล้าง URL
function cleanUrl(url) {
  if (!url) return "";
  return url.split("?")[0].trim();
}

// 🔍 INFO (3 ชั้น fallback)
app.get("/info", async (req, res) => {
  let url = cleanUrl(req.query.url);

  // ✅ ชั้น 1: noembed
  try {
    const r1 = await fetch(`https://noembed.com/embed?url=${url}`);
    const d1 = await r1.json();

    if (d1.title) {
      return res.json({
        title: d1.title,
        thumbnail: d1.thumbnail_url || "",
        duration: 0,
        uploader: d1.author_name || "Unknown"
      });
    }
  } catch (e) {
    console.log("NOEMBED FAIL");
  }

  // ✅ ชั้น 2: yt-dlp (มี timeout)
  exec(
    `yt-dlp --no-warnings --no-playlist -j "${url}"`,
    { shell: true, timeout: 10000 },
    (err, stdout, stderr) => {
      if (!err) {
        try {
          const data = JSON.parse(stdout);

          return res.json({
            title: data.title,
            thumbnail: data.thumbnail,
            duration: data.duration,
            uploader: data.uploader
          });
        } catch {
          console.log("PARSE FAIL");
        }
      } else {
        console.log("YTDLP FAIL:", stderr);
      }

      // 💀 ชั้นสุดท้าย (ไม่ให้พัง)
      return res.json({
        title: "โหลดไม่ได้ (แต่ยังโหลดได้)",
        thumbnail: "",
        duration: 0,
        uploader: "Unknown"
      });
    }
  );
});

// ⬇ DOWNLOAD (มี timeout กันค้าง)
app.get("/download", (req, res) => {
  let url = cleanUrl(req.query.url);

  exec(
    `yt-dlp --no-warnings --no-playlist -f bestaudio -g "${url}"`,
    { shell: true, timeout: 15000 },
    (err, stdout, stderr) => {
      if (err) {
        console.log("DOWNLOAD ERROR:", err.killed ? "TIMEOUT" : stderr);
        return res.status(500).send("โหลดไม่ได้");
      }

      res.json({
        download_url: stdout.trim()
      });
    }
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
