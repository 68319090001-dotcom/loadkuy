const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());

// ✅ serve หน้าเว็บ
app.use(express.static(path.join(__dirname)));

// 🔥 ล้าง URL
function cleanUrl(url) {
  if (!url) return "";
  return url.split("?")[0].trim();
}

// 🔍 INFO (ใช้ noembed แทน yt-dlp → กัน 500)
app.get("/info", async (req, res) => {
  let url = cleanUrl(req.query.url);

  try {
    const response = await fetch(`https://noembed.com/embed?url=${url}`);
    const data = await response.json();

    res.json({
      title: data.title || "Unknown",
      thumbnail: data.thumbnail_url || "",
      duration: 0,
      uploader: data.author_name || "Unknown"
    });
  } catch (e) {
    console.log("INFO ERROR:", e);
    res.status(500).send("info failed");
  }
});

// ⬇ DOWNLOAD (ยังใช้ yt-dlp)
app.get("/download", (req, res) => {
  let url = cleanUrl(req.query.url);

  exec(
    `yt-dlp --no-warnings --no-playlist -f bestaudio -g "${url}"`,
    { shell: true },
    (err, stdout, stderr) => {
      if (err) {
        console.log("DOWNLOAD ERROR:", stderr);
        return res.status(500).send("download failed");
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
