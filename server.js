const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());

// ✅ serve หน้าเว็บ
app.use(express.static(path.join(__dirname)));

// 🔥 ล้าง URL (กัน ?si= / parameter พัง)
function cleanUrl(url) {
  if (!url) return "";
  return url.split("?")[0].trim();
}

// 🔍 INFO
app.get("/info", (req, res) => {
  let url = cleanUrl(req.query.url);

  exec(
    `yt-dlp --no-warnings --no-playlist -j "${url}"`,
    { shell: true },
    (err, stdout, stderr) => {
      if (err) {
        console.log("MAIN ERROR:", stderr);

        // 🔥 fallback (ยังให้โหลดได้)
        exec(
          `yt-dlp "${url}" -g`,
          { shell: true },
          (err2) => {
            if (err2) {
              console.log("FALLBACK ERROR:", err2);
              return res.status(500).send("yt-dlp failed");
            }

            return res.json({
              title: "โหลดข้อมูลไม่ได้ (แต่ยังโหลดได้)",
              thumbnail: "",
              duration: 0,
              uploader: "Unknown"
            });
          }
        );

        return;
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
    }
  );
});

// ⬇ DOWNLOAD
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
