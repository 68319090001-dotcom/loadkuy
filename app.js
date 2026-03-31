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

// ✅ เพิ่ม timeout ให้ fetch ด้วย AbortController
async function fetchWithTimeout(url, options = {}, timeoutMs = 35000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error("API error: " + res.status);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ✅ retry delay เพิ่มเป็น 3s และแจ้ง user ระหว่างรอ
async function fetchWithRetry(url, options = {}, retries = 3, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (err) {
      console.log(`Retry ${i + 1}/${retries}...`, err.message);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// 🔍 วิเคราะห์
analyzeBtn.onclick = async () => {
  const url = urlInput.value.trim();
  if (!url) return alert("ใส่ลิงก์ก่อน");

  analyzeBtn.disabled = true;
  analyzeBtn.classList.add("loading");
  analyzeBtn.innerText = "⏳ กำลังวิเคราะห์...";

  try {
    const data = await fetchWithRetry(
      `${api}/info?url=${encodeURIComponent(url)}`
    );

    currentUrl = url;
    mediaTitle.textContent = data.title || "ไม่มีชื่อ";
    mediaThumbnail.src = data.thumbnail || "";
    mediaThumbnail.style.display = data.thumbnail ? "block" : "none";
    mediaAuthor.textContent = "by " + (data.uploader || "Unknown");
    mediaDuration.textContent = data.duration
      ? "⏱ " + data.duration + " วินาที"
      : "";

    mediaCard.classList.remove("hidden");
  } catch (err) {
    console.log("ERROR:", err);
    if (err.name === "AbortError") {
      alert("หมดเวลา — เซิร์ฟเวอร์ตอบช้าเกินไป ลองใหม่อีกครั้ง");
    } else {
      alert("โหลดข้อมูลไม่ได้: " + err.message);
    }
  }

  analyzeBtn.disabled = false;
  analyzeBtn.classList.remove("loading");
  analyzeBtn.innerText = "🔍 วิเคราะห์";
};

// ⬇ ดาวน์โหลด
downloadBtn.onclick = async () => {
  if (!currentUrl) return alert("ยังไม่ได้วิเคราะห์");

  downloadBtn.disabled = true;
  downloadBtn.innerText = "⏳ กำลังโหลด...";

  try {
    const data = await fetchWithRetry(
      `${api}/download?url=${encodeURIComponent(currentUrl)}`
    );

    if (data.download_url) {
      window.open(data.download_url, "_blank");
    } else {
      alert("ไม่พบลิงก์ดาวน์โหลด");
    }
  } catch (err) {
    console.log("DOWNLOAD ERROR:", err);
    if (err.name === "AbortError") {
      alert("หมดเวลา — ไฟล์อาจใหญ่เกินไป หรือเซิร์ฟเวอร์ช้า ลองใหม่");
    } else {
      alert("โหลดไม่ได้: " + err.message);
    }
  }

  downloadBtn.disabled = false;
  downloadBtn.innerText = "⬇ ดาวน์โหลด";
};
