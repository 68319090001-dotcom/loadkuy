const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());

// ✅ แสดงหน้าเว็บ
app.use(express.static(path.join(__dirname)));

// 🔥 ฟังก์ชันล้าง URL (แก้ YouTube ?si= พัง)
function cleanUrl(url) {
  if (!url) return "";

  // ตัด parameter หลัง ?
  url = url.split("?")[0];

  return url.trim();
}

// 🔍 INFO
app.get("/info", (req, res) => {
  let url = cleanUrl(req.query.url);

  exec(`yt-dlp -j "${url}"`, { shell: true }, (err, stdout, stderr) => {
    if (err) {
      console.log("INFO ERROR:", stderr);
      return res.status(500).send(stderr);
    }

    try {
      const data = JSON.parse(stdout);

      res.json({
        title: data.title,
        thumbnail: data.thumbnail,
        duration: data.duration,
        uploader: data.uploader
      });
    } catch (e) {
      console.log("PARSE ERROR:", stdout);
      res.status(500).send("parse error");
    }
  });
});

// ⬇ DOWNLOAD
app.get("/download", (req, res) => {
  let url = cleanUrl(req.query.url);

  exec(`yt-dlp -f bestaudio -g "${url}"`, { shell: true }, (err, stdout, stderr) => {
    if (err) {
      console.log("DOWNLOAD ERROR:", stderr);
      return res.status(500).send(stderr);
    }

    res.json({
      download_url: stdout.trim()
    });
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
