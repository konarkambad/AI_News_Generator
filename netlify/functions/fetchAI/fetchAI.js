import OpenAI from "openai";
import { traceable } from "langsmith/traceable";
 

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
 
  
const handler = traceable(async (event) => {
    
    try { 
        const requestBody = JSON.parse(event.body);
        const { newsTopic, newsAudience, newsTone, newsLanugage, newsLength } = requestBody;


        const input = `I want to act as a journalist that writes news articles. Your task is to generate a news article about the topic of ${newsTopic} 
        in a ${newsTone} tone. The article should be written in the ${newsLanugage} language. Make sure to limit the length of the news article with in the range of ${newsLength} words. 
        The target audience for this article is ${newsAudience}.Ensure the content is relevant, fact-based, and engaging. 
        The article must follow journalistic standards, is factually accurate, and provides a balanced viewpoint on the topic. Wrap everything inside one single div tag with class news-contents. 
        Wrap the news title in html h1 tag and the paragraphs in p tags. Add a br tag after every p tags and the h1 tag`;

        const response = await openai.completions.create({
            model: 'gpt-3.5-turbo-instruct',
            prompt: input,
            presence_penalty: 0,
            frequency_penalty: 0.3,
            max_tokens: 3000,
            temperature: 0,
        })
        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: response    //reply: response.choices[0].text.trim()  
            })
        }
        
    } catch (error) {
        return { statusCode: 500, body: error.toString() }
    }
}, { name: "generateAdCopy",
    project: process.env.LANGSMITH_PROJECT
 });

module.exports = { handler }
