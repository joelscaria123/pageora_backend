
import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });



export async function generateArticle(companyName, topic) {
  
     const response = await groq.chat.completions.create({

        model: "openai/gpt-oss-20b",
        messages:[

           {

              role: "system",
              content: `You are a professional blog writer. 
                        Write useful, well-structured articles in Markdown. Avoid filler and unsupported fatual claims.`
           },

           {

              role:"user",
              content:`Write an approximately 1000-word blog article for
                       ${companyName} about ${topic}. Include an introduction,
                       descriptive headings, practical information, and a conclusion.
                       Return only the article.` 
           }
        ],

        max_completion_tokens: 2500,
        temperature: 0.7,
        include_reasoning: false,
     })

     const content = response.choices[0]?.message?.content?.trim();

     if(!content){

        throw new Error("Groq returned an emoty article")
     }

     return content;
}



