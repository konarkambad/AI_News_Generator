import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// ─── Google News RSS helpers ────────────────────────────────────────────

function buildRssUrl(topic) {
    const q = encodeURIComponent(`${topic} when:30d`);
    return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

function unescapeXml(s) {
    return (s || "")
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function stripHtml(s) {
    return (s || "").replace(/<[^>]+>/g, "").trim();
}

function parseRssItems(xml, limit = 10) {
    const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit);
    return matches.map((m) => {
        const item = m[1];
        const titleRaw = (item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
        const linkRaw  = (item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
        const pubRaw   = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";
        const descRaw  = (item.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "";
        const srcRaw   = (item.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || "";

        const title       = unescapeXml(titleRaw).trim();
        const description = stripHtml(unescapeXml(descRaw));
        let   source      = unescapeXml(srcRaw).trim();
        let   cleanTitle  = title;

        // Google News titles often look like "Article title - Source Name".
        // If <source> tag is missing, try splitting the title on the last " - ".
        if (!source && title.includes(" - ")) {
            const parts = title.split(" - ");
            source = parts[parts.length - 1];
            cleanTitle = parts.slice(0, -1).join(" - ");
        }

        return {
            title:   cleanTitle,
            source:  source || "Unknown",
            date:    pubRaw.trim(),
            link:    linkRaw.trim(),
            snippet: description.slice(0, 400)
        };
    });
}

// ─── Output cleanup ─────────────────────────────────────────────────────

function stripJsonFences(text) {
    return (text || "")
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
}

// ─── Handler ────────────────────────────────────────────────────────────

const handler = async (event) => {
    try {
        const { newsTopic, newsAudience, newsTone, newsLanugage, newsLength } =
            JSON.parse(event.body);

        // 1. Pull recent real news from Google News RSS
        const rssUrl = buildRssUrl(newsTopic);
        const rssRes = await fetch(rssUrl);
        if (!rssRes.ok) {
            return {
                statusCode: 200,
                body: JSON.stringify({ error: "Could not fetch news sources right now. Please try again." })
            };
        }

        const rssXml   = await rssRes.text();
        const articles = parseRssItems(rssXml, 10);

        if (articles.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    error: `No recent news found for "${newsTopic}" in the last 30 days. Try a broader topic.`
                })
            };
        }

        // 2. Send the real articles to Claude for synthesis + analysis
        const sourcesBlock = articles
            .map(
                (a, i) =>
                    `[${i + 1}] "${a.title}"
Source: ${a.source}
Date:   ${a.date}
Snippet: ${a.snippet}`
            )
            .join("\n\n");

        const prompt = `You are an expert journalist. Below are ${articles.length} REAL news articles published in the last 30 days about "${newsTopic}". You must synthesize them into one article and analyze the source mix.

ARTICLES FOUND:
${sourcesBlock}

Tasks:
1. Write ONE synthesized news article in ${newsLanugage}, with a ${newsTone} tone, between ${newsLength} words, written for ${newsAudience}. The article must reflect what these real sources are reporting.
2. For each source, identify country of origin, political lean, and tone using your knowledge of these outlets.
3. Compute an overall bias score from 1 to 10, where 1 = perfectly balanced coverage and 10 = heavily one-sided.

Return ONLY raw JSON. No markdown. No code fences. No commentary before or after. Match this exact schema:

{
  "meta": {
    "biasScore": <integer 1-10>,
    "biasLabel": "<Low | Medium | High>",
    "dateRange": "<earliest article date> to <latest article date>, both as 'Mon DD, YYYY'",
    "sourceCount": <integer>,
    "recency": "<plain English, e.g. 'Latest article 2 days old'>",
    "sources": [
      {
        "name": "<outlet name>",
        "country": "<country>",
        "politicalLean": "<Left | Center-left | Center | Center-right | Right | Unknown>",
        "tone": "<one word: Factual | Opinion | Sensational | Analytical | Mixed>"
      }
    ]
  },
  "article": "<HTML only. Wrap in a single <div class=\\"news-contents\\">. Use <h1> for the title, <p> for paragraphs, <br> after each <p> and the <h1>. No code fences. No prose outside the HTML.>"
}`;

        const claudeRes = await anthropic.messages.create({
            model:      "claude-sonnet-4-6",
            max_tokens: 4000,
            messages:   [{ role: "user", content: prompt }]
        });

        const rawText = claudeRes.content?.[0]?.text || "";
        const cleaned = stripJsonFences(rawText);

        // 3. Parse Claude's JSON safely
        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    error: "The AI returned an unexpected response. Please try again."
                })
            };
        }

        return {
            statusCode: 200,
            body:       JSON.stringify({ data: parsed })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body:       JSON.stringify({ error: error.toString() })
        };
    }
};

module.exports = { handler };
