const api = "https://loadkuy.onrender.com";

const analyzeBtn = document.getElementById("analyzeBtn");
const downloadBtn = document.getElementById("downloadBtn");

const urlInput = document.getElementById("urlInput");

const mediaCard = document.getElementById("mediaCard");
const mediaTitle = document.getElementById("mediaTitle");
const mediaThumbnail = document.getElementById("mediaThumbnail");
const mediaAuthor = document.getElementById("mediaAuthor");
const mediaDuration = document.getElementById("mediaDuration");

let currentUrl = "";

// 🔥 retry กัน Render sleep
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);

      if (!res.ok) throw new Error("API error");

      return await res.json();
    } catch (err) {
      console.log(`Retry ${i + 1}...`, err);
      if (i === retries - 1) throw err;

      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// 🔍 วิเคราะห์
analyzeBtn.onclick = async () => {
  const url = urlInput.value;
  if (!url) return alert("ใส่ลิงก์ก่อน");

  analyzeBtn.classList.add("loading");

  try {
    const data = await fetchWithRetry(
      `${api}/info?url=${encodeURIComponent(url)}`
    );

    currentUrl = url;

    mediaTitle.textContent = data.title;
    mediaThumbnail.src = data.thumbnail;
    mediaAuthor.textContent = "by " + data.uploader;
    mediaDuration.textContent = data.duration
      ? "⏱ " + data.duration + " sec"
      : "";

    mediaCard.classList.remove("hidden");
  } catch (err) {
    console.log("ERROR:", err);
    alert("โหลดข้อมูลไม่ได้");
  }

  analyzeBtn.classList.remove("loading");
};

// ⬇ ดาวน์โหลด
downloadBtn.onclick = async () => {
  if (!currentUrl) return alert("ยังไม่ได้วิเคราะห์");

  downloadBtn.innerText = "⏳ กำลังโหลด...";

  try {
    const data = await fetchWithRetry(
      `${api}/download?url=${encodeURIComponent(currentUrl)}`
    );

    window.open(data.download_url, "_blank");
  } catch (err) {
    console.log("DOWNLOAD ERROR:", err);
    alert("โหลดไม่ได้");
  }

  downloadBtn.innerText = "⬇ ดาวน์โหลด";
};
