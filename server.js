const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path"); // ✅ เพิ่ม

const app = express();
app.use(cors());

// ✅ เพิ่มตรงนี้
app.use(express.static(path.join(__dirname)));

app.get("/info", (req, res) => {
  const url = req.query.url;

  exec(`yt-dlp -j "${url}"`, (err, stdout) => {
    if (err) return res.status(500).send("error");

    try {
      const data = JSON.parse(stdout);

      res.json({
        title: data.title,
        thumbnail: data.thumbnail,
        duration: data.duration,
        uploader: data.uploader
      });
    } catch {
      res.status(500).send("parse error");
    }
  });
});

app.get("/download", (req, res) => {
  const url = req.query.url;

  exec(`yt-dlp -f bestaudio -g "${url}"`, (err, stdout) => {
    if (err) return res.status(500).send("error");

    res.json({
      download_url: stdout.trim()
    });
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
