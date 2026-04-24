const { Configuration, OpenAIApi } = require('openai');
const { getJson } = require("serpapi");

const OpenAI = require("openai");

import { traceable } from "langsmith/traceable";
 
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const SERPAPI_KEY = process.env.SERP_API_KEY;

function truncateText(text, maxLength = 200) {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

const handler = traceable(async (event) => {
    try {
        if (!event.body) {
            console.error("Error: event.body is undefined or empty");
            return { statusCode: 400, body: JSON.stringify({ error: "Request body is missing" }) };
        }

        const requestBody = JSON.parse(event.body);
        const { productName, productDesc, targetMarket } = requestBody;

        if (!productName || !productDesc || !targetMarket) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        console.error("Processing Product Search for:", productName, productDesc, targetMarket);

        //  Step 1: Generate a refined search query using OpenAI
        const refineSearch = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: `Refine this product search query for Google Shopping:\nProduct Name: ${productName}\nDescription: ${productDesc}\nTarget Market: ${targetMarket}`,
            presence_penalty: 0,
            frequency_penalty: 0.3,
            max_tokens: 50,
            temperature: 0
        });

        const refinedQuery = refineSearch.choices[0].text.trim();

        console.error("Refined Search Query:", refinedQuery);

        //  Step 2: Perform Google Shopping Search
        const searchResults = await getJson({
            engine: "google_shopping",
            api_key: SERPAPI_KEY,
            q: refinedQuery
        });

        console.error("Raw Search Results:", searchResults["shopping_results"]);

        //  Limit results to prevent exceeding OpenAI's 4097 token limit
        const topResults = searchResults["shopping_results"]?.slice(0, 5).map(item => ({
            title: item.title,
//            link: item.link,
            price: item.price,
            description: truncateText(item.description || "", 200) // Truncate descriptions
        })) || [];

        // Step 3: Format search results using OpenAI
        const formattedResponse = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: `Summarize these Google Shopping search results by listing the title of the top three products in bullet points:\n${JSON.stringify(topResults)}\nLimit it to the top 3 options.`,
            presence_penalty: 0,
            frequency_penalty: 0.3,
            max_tokens: 200,
            temperature: 0
        });

        console.error("Reformatted Response:", formattedResponse.choices[0].text);

        return {
            statusCode: 200,
            body: JSON.stringify({
                results: formattedResponse.choices[0].text
            })
        };
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
    }
}, { name: "generateCompetitors",
    project: process.env.LANGSMITH_PROJECT
 });

module.exports = { handler };