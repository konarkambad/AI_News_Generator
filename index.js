let response = "";

// ── Helpers ────────────────────────────────────────────────────────────

function cleanHtml(html) {
  return (html || "")
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function escapeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMetadata(meta) {
  if (!meta) return "";

  const sources = (meta.sources || [])
    .map(
      (s) =>
        `<li><strong>${escapeHtml(s.name)}</strong> <span class="meta-country">(${escapeHtml(
          s.country
        )})</span> &middot; ${escapeHtml(s.politicalLean)} &middot; ${escapeHtml(s.tone)}</li>`
    )
    .join("");

  return `
    <div class="news-metadata">
      <div class="meta-row">
        <span class="meta-pair"><span class="meta-label">Bias:</span> ${escapeHtml(
          String(meta.biasScore)
        )}/10 (${escapeHtml(meta.biasLabel)})</span>
        <span class="meta-pair"><span class="meta-label">Sources:</span> ${escapeHtml(
          String(meta.sourceCount)
        )}</span>
        <span class="meta-pair"><span class="meta-label">Date range:</span> ${escapeHtml(
          meta.dateRange
        )}</span>
        <span class="meta-pair"><span class="meta-label">Recency:</span> ${escapeHtml(
          meta.recency
        )}</span>
      </div>
      <details class="meta-sources">
        <summary>Source breakdown</summary>
        <ul>${sources}</ul>
      </details>
    </div>
  `;
}

// ── Main: generate button ──────────────────────────────────────────────

document
  .getElementsByClassName("generate-button")[0]
  .addEventListener("click", async () => {
    const newsTopic    = document.getElementById("topic").value;
    const newsAudience = document.getElementById("audience").value;
    const newsTone     = document.getElementById("tone").value;
    const newsLanguage = document.getElementById("language").value;
    const newsLength   = document.getElementById("length").value;

    const buttonText     = document.getElementsByClassName("btn-text")[0];
    const generateButton = document.getElementsByClassName("generate-button")[0];
    const newsPreview    = document.getElementsByClassName("news-preview")[0];
    const thumbsupBtn    = document.getElementsByClassName("thumbsup-btn")[0];
    const thumbsdownBtn  = document.getElementsByClassName("thumbsdown-btn")[0];

    newsPreview.innerHTML        = '<div class="loader"></div>';
    generateButton.disabled      = true;
    buttonText.innerHTML         = "Please Wait";
    generateButton.style.background =
      "linear-gradient(to right, rgb(255, 81, 47) 0%, rgb(221, 36, 118) 51%, rgb(255, 81, 47) 100%)";
    generateButton.style.opacity = 1;

    if (typeof gtag === "function") {
      gtag("event", "submit", { newsTopic: newsTopic });
    }

    thumbsupBtn.style.opacity        = 1;
    thumbsdownBtn.style.opacity      = 1;
    thumbsupBtn.style.pointerEvents  = "auto";
    thumbsdownBtn.style.pointerEvents = "auto";
    document.querySelector(".thumbsup-btn > svg").setAttribute("fill", "currentColor");
    document.querySelector(".thumbsdown-btn > svg").setAttribute("fill", "currentColor");

    try {
      const result = await fetchReply(
        newsTopic,
        newsAudience,
        newsTone,
        newsLanguage,
        newsLength
      );

      response = cleanHtml(result.article);
      newsPreview.innerHTML = renderMetadata(result.meta) + response;

      generateButton.disabled = false;
      buttonText.innerHTML    = "Generate News";
      generateButton.style.background = "linear-gradient(to right, #2563eb, #4f46e5)";
      generateButton.style.opacity    = 0.8;

      const h1 = document.querySelector("div.news-preview h1");
      if (h1) {
        h1.style.fontSize  = "22px";
        h1.style.fontWeight = 600;
        h1.style.textAlign = "center";
      }
    } catch (error) {
      console.error("Error When Generating News", error);
      newsPreview.innerHTML = `<p class="text-muted" style="padding:16px;">${escapeHtml(
        error.message || "Something went wrong while generating the news. Please try again."
      )}</p>`;
      generateButton.disabled = false;
      buttonText.innerHTML    = "Generate News";
      generateButton.style.background = "linear-gradient(to right, #2563eb, #4f46e5)";
      generateButton.style.opacity    = 0.8;
    }
  });

// ── Download ───────────────────────────────────────────────────────────

document
  .getElementsByClassName("download-btn")[0]
  .addEventListener("click", () => {
    if (response.length == 0) {
      return;
    }
    const output = `<!DOCTYPE html>
                    <html lang="en">
                      <head>
                         <meta charset="UTF-8"/>
                         <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                         <title>Your News</title>
                         <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7375901080347470"
     crossorigin="anonymous"></script>
                         <link rel="icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/2964/2964063.png">
	                       <link rel="preconnect" href="https://fonts.googleapis.com">
	                       <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	                       <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700&display=swap" rel="stylesheet">
                      </head>
                      <body>
                        ${response}
                      </body>
                    </html>`;
    const blob = new Blob([output], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "news.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (typeof gtag === "function") {
      gtag("event", "feedback", { download: 1 });
    }
  });

// ── Copy ───────────────────────────────────────────────────────────────

document.getElementsByClassName("copy-btn")[0].addEventListener("click", () => {
  if (response.length == 0) {
    return;
  }
  navigator.clipboard.writeText(response);
  alert("News successfully copied!");
  if (typeof gtag === "function") {
    gtag("event", "feedback", { copy: 1 });
  }
});

// ── Feedback ───────────────────────────────────────────────────────────

document
  .getElementsByClassName("thumbsup-btn")[0]
  .addEventListener("click", () => {
    document.getElementsByClassName("thumbsup-btn")[0].style.pointerEvents = "none";
    document.getElementsByClassName("thumbsdown-btn")[0].style.pointerEvents = "none";
    document.querySelector(".thumbsup-btn > svg").setAttribute("fill", "#4eae31");
    if (typeof gtag === "function") {
      gtag("event", "feedback", { satisfied: 1 });
    }
  });

document
  .getElementsByClassName("thumbsdown-btn")[0]
  .addEventListener("click", () => {
    document.getElementsByClassName("thumbsup-btn")[0].style.pointerEvents = "none";
    document.getElementsByClassName("thumbsdown-btn")[0].style.pointerEvents = "none";
    document.querySelector(".thumbsdown-btn > svg").setAttribute("fill", "#e62a39");
    if (typeof gtag === "function") {
      gtag("event", "feedback", { satisfied: 0 });
    }
  });

// ── Dark / light mode toggle ───────────────────────────────────────────

document.getElementsByClassName("light-btn")[0].addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const elementsToToggle = [
    ".container",
    ".icon-button",
    ".tooltip",
    ".tooltip-text",
    ".form-container",
    ".news-container",
    ".label",
    ".news-title",
    ".text-muted",
    ".text-small",
    ".footer",
    ".footer-links a",
    ".input",
    ".select",
    ".news-preview",
    ".preview-text"
  ];
  elementsToToggle.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.classList.toggle("dark");
    });
  });
  document.getElementsByClassName("dark-btn")[0].style.display  = "block";
  document.getElementsByClassName("light-btn")[0].style.display = "none";
});

document.getElementsByClassName("dark-btn")[0].addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const elementsToToggle = [
    ".container",
    ".icon-button",
    ".tooltip",
    ".tooltip-text",
    ".form-container",
    ".news-container",
    ".label",
    ".news-title",
    ".text-muted",
    ".text-small",
    ".footer",
    ".footer-links a",
    ".input",
    ".select",
    ".news-preview",
    ".preview-text"
  ];
  elementsToToggle.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.classList.toggle("dark");
    });
  });
  document.getElementsByClassName("light-btn")[0].style.display = "block";
  document.getElementsByClassName("dark-btn")[0].style.display  = "none";
});

// ── API call ───────────────────────────────────────────────────────────

async function fetchReply(newsTopic, newsAudience, newsTone, newsLanugage, newsLength) {
  const url = "/.netlify/functions/fetchAI";

  const res = await fetch(url, {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ newsTopic, newsAudience, newsTone, newsLanugage, newsLength })
  });

  const payload = await res.json();
  console.info("API Response:", payload);

  if (payload.error) throw new Error(payload.error);
  if (!payload.data) throw new Error("Unexpected response from server.");

  return payload.data; // { meta, article }
}
