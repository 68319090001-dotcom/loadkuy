const api = "https://YOUR-APP.onrender.com";

const analyzeBtn = document.getElementById("analyzeBtn");
const downloadBtn = document.getElementById("downloadBtn");

const urlInput = document.getElementById("urlInput");

const mediaCard = document.getElementById("mediaCard");
const mediaTitle = document.getElementById("mediaTitle");
const mediaThumbnail = document.getElementById("mediaThumbnail");
const mediaAuthor = document.getElementById("mediaAuthor");
const mediaDuration = document.getElementById("mediaDuration");

let currentUrl = "";

analyzeBtn.onclick = async () => {
  const url = urlInput.value;
  if (!url) return alert("ใส่ลิงก์ก่อน");

  analyzeBtn.classList.add("loading");

  try {
    const res = await fetch(`${api}/info?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    currentUrl = url;

    mediaTitle.textContent = data.title;
    mediaThumbnail.src = data.thumbnail;
    mediaAuthor.textContent = "by " + data.uploader;
    mediaDuration.textContent = "⏱ " + data.duration + " sec";

    mediaCard.classList.remove("hidden");
  } catch {
    alert("โหลดข้อมูลไม่ได้");
  }

  analyzeBtn.classList.remove("loading");
};

downloadBtn.onclick = async () => {
  if (!currentUrl) return alert("ยังไม่ได้วิเคราะห์");

  downloadBtn.innerText = "กำลังโหลด...";

  try {
    const res = await fetch(`${api}/download?url=${encodeURIComponent(currentUrl)}`);
    const data = await res.json();

    window.open(data.download_url, "_blank");
  } catch {
    alert("โหลดไม่ได้");
  }

  downloadBtn.innerText = "ดาวน์โหลด";
};