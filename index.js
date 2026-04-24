let response = "";
document
  .getElementsByClassName("generate-button")[0]
  .addEventListener("click", async () => {
    const newsTopic = document.getElementById("topic").value;
    const newsAudience = document.getElementById("audience").value;
    const newsTone = document.getElementById("tone").value;
    const newsLanguage = document.getElementById("language").value;
    const newsLength = document.getElementById("length").value;
    const buttonText = document.getElementsByClassName("btn-text")[0];
    const generateButton =
      document.getElementsByClassName("generate-button")[0];
    const newsPreview = document.getElementsByClassName("news-preview")[0];
    const thumbsupBtn = document.getElementsByClassName("thumbsup-btn")[0];
    const thumbsdownBtn = document.getElementsByClassName("thumbsdown-btn")[0];
    newsPreview.innerHTML = '<div class="loader"></div>';
    generateButton.disabled = true;
    buttonText.innerHTML = "Please Wait";
    generateButton.style.background =
      "linear-gradient(to right, rgb(255, 81, 47) 0%, rgb(221, 36, 118) 51%, rgb(255, 81, 47) 100%)";
    generateButton.style.opacity = 1;
    generateButton.addEventListener("click", () => {
      gtag("event", "submit", { newsTopic: newsTopic });
      fetchReply();
    });
    thumbsupBtn.style.opacity = 1;
    thumbsdownBtn.style.opacity = 1;
    thumbsupBtn.style.pointerEvents = "auto";
    thumbsdownBtn.style.pointerEvents = "auto";
    document
      .querySelector(".thumbsup-btn > svg")
      .setAttribute("fill", "currentColor");
    document
      .querySelector(".thumbsdown-btn > svg")
      .setAttribute("fill", "currentColor");
    try {
      response = await fetchReply(
        newsTopic,
        newsAudience,
        newsTone,
        newsLanguage,
        newsLength
      );
      newsPreview.innerHTML += response;
      generateButton.disabled = false;
      buttonText.innerHTML = "Generate News";
      generateButton.style.background =
        "linear-gradient(to right, #2563eb, #4f46e5)";
      generateButton.style.opacity = 0.8;
      document.querySelector("div.loader").remove();
      // Add styles to the header of the news.
      document.querySelector("div.news-preview h1").style.fontSize = "22px";
      document.querySelector("div.news-preview h1").style.fontWeight = 600;
      document.querySelector("div.news-preview h1").style.textAlign = "center";
    } catch (error) {
      console.error("Error When Generating News", error);
      alert("An error occurred while we try to write the news for you.");
      generateButton.disabled = false;
      buttonText.innerHTML = "Generate News";
      generateButton.style.background =
        "linear-gradient(to right, #2563eb, #4f46e5)";
      generateButton.style.opacity = 0.8;
    }
  });

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
    // Create a Blob object with the content of the response variable
    const blob = new Blob([output], { type: "text/html" });
    // Create a URL for the Blob object
    const url = URL.createObjectURL(blob);
    // Create an anchor element dynamically
    const link = document.createElement("a");
    link.href = url;
    link.download = "news.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    gtag("event", "feedback", { download: 1 });
  });

document.getElementsByClassName("copy-btn")[0].addEventListener("click", () => {
  if (response.length == 0) {
    return;
  }
  navigator.clipboard.writeText(response);
  alert("News successfully copied!");
  gtag("event", "feedback", { copy: 1 });
});

document
  .getElementsByClassName("thumbsup-btn")[0]
  .addEventListener("click", () => {
    document.getElementsByClassName("thumbsup-btn")[0].style.pointerEvents =
      "none";
    document.getElementsByClassName("thumbsdown-btn")[0].style.pointerEvents =
      "none";
    document
      .querySelector(".thumbsup-btn > svg")
      .setAttribute("fill", "#4eae31");
    gtag("event", "feedback", { satisfied: 1 });
  });

document
  .getElementsByClassName("thumbsdown-btn")[0]
  .addEventListener("click", () => {
    document.getElementsByClassName("thumbsup-btn")[0].style.pointerEvents =
      "none";
    document.getElementsByClassName("thumbsdown-btn")[0].style.pointerEvents =
      "none";
    document
      .querySelector(".thumbsdown-btn > svg")
      .setAttribute("fill", "#e62a39");
    gtag("event", "feedback", { satisfied: 0 });
  });
document.getElementsByClassName("light-btn")[0].addEventListener("click",()=>{
  // Toggle the 'dark' class on the body element
  document.body.classList.toggle('dark');
  // Toggle all relevant elements for dark mode
  const elementsToToggle = [
    '.container',
    '.icon-button',
    '.tooltip',
    '.tooltip-text',
    '.form-container',
    '.news-container',
    '.label',
    '.news-title',
    '.text-muted',
    '.text-small',
    '.footer',
    '.footer-links a',
    '.input',
    '.select',
    '.news-preview',
    '.preview-text'
  ];
  elementsToToggle.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.toggle('dark');
    });
  });
  document.getElementsByClassName("dark-btn")[0].style.display = "block";
  document.getElementsByClassName("light-btn")[0].style.display = "none";
})
document.getElementsByClassName("dark-btn")[0].addEventListener("click",()=>{
  // Toggle the 'dark' class on the body element
  document.body.classList.toggle('dark');
  // Toggle all relevant elements for dark mode
  const elementsToToggle = [
    '.container',
    '.icon-button',
    '.tooltip',
    '.tooltip-text',
    '.form-container',
    '.news-container',
    '.label',
    '.news-title',
    '.text-muted',
    '.text-small',
    '.footer',
    '.footer-links a',
    '.input',
    '.select',
    '.news-preview',
    '.preview-text'
  ];
  elementsToToggle.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      element.classList.toggle('dark');
    });
  });
  document.getElementsByClassName("light-btn")[0].style.display = "block";
  document.getElementsByClassName("dark-btn")[0].style.display = "none";
})
async function fetchReply(
  newsTopic,
  newsAudience,
  newsTone,
  newsLanugage,
  newsLength
) {
  const url = "/.netlify/functions/fetchAI";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        newsTopic,
        newsAudience,
        newsTone,
        newsLanugage,
        newsLength,
      }),
    });

    const data = await response.json();
    console.info("API Response:", data); // Log API response
    const cleanText = data.reply.content[0].text;
    return cleanText;
  } catch (error) {
    console.error("Fetch API Error:", error); // Log fetch errors
    alert(
      "An error occurred while fetching the response. Check the console for details."
    );
  }
}
