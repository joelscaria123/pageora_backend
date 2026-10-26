import { prisma } from "../lib/prisma.js";
import { generateArticle } from "../services/groq.js";
import { createSlug } from "../utils/slug.js";
import { randomUUID } from "node:crypto";
import supabase from "../services/supabase.js";

export const getProjects = async(req,res) => {

    try{

       const projects = await prisma.project.findMany({

          orderBy: {

             createdAt: "desc"
          },

          include: {

             _count: {

                 select: {

                     articles: true,
                 }
             }
          }
       });


       return res.status(200).json({

          success: true,
          count: projects.length,
          projects
       });
    }

    catch(error){

         console.log("Fetch Projects error:", error);

         return res.status(500).json({

            success: false,
            message: "Failed to fetch projects"
         })

    }
};


export const getArticles = async(req,res) => {

    try {
    const article = await prisma.article.findUnique({
      where: {
        slug: req.params.slug,
      },
      include: {
        project: true,
      },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    res.json({
      success: true,
      article,
    });
  } catch (error) {
    console.error("Failed to fetch article:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch article",
    });
  }
}




export const getProjectById = async(req,res) => {

     try{

        const { id } = req.params;

         const project = await prisma.project.findUnique({

             where: {id},
             include: {
                articles: {
                    orderBy: {
                        createdAt: "desc"
                    }
                }
             }
         });


         if(!project){

            return res.status(404).json({

                 success: false,
                 message: "Project not found"
            })
         }

         return res.status(200).json({

             success: true,
             project,
         });


     }

     catch(error){

        console.log("Fetch Project error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch project"
        })
     }
}




export const createProject = async (req, res) => {
  try {
    const { name, brandColor } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    if (brandColor && !/^#[0-9A-Fa-f]{6}$/.test(brandColor)) {
      return res.status(400).json({
        success: false,
        message: "Brand color must be valid hex color, eg. #6366f1",
      });
    }

    let logoUrl = null;

    console.log("Logo received:", !!req.file);

    if (req.file) {
      const fileExtension = req.file.originalname
        .split(".")
        .pop()
        ?.toLowerCase();

      const allowedExtensions = ["png", "jpg", "jpeg", "webp"];

      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: "Only PNG, JPG, JPEG, and WebP logos are allowed",
        });
      }

      const filePath = `${randomUUID()}.${fileExtension}`;

      const { data, error } = await supabase.storage
        .from("joel")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to upload logo to Supabase",
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("joel")
        .getPublicUrl(data.path);

      logoUrl = publicUrlData.publicUrl;

      console.log("Supabase logo URL:", logoUrl);
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        logoUrl: logoUrl || null,
        brandColor: brandColor || "#6366f1",
      },
    });

    return res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Create Project error:", {
      message: error.message,
      name: error.name,
      status: error.status,
    });

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create project",
    });
  }
};




export const createArticle = async(req,res) => {

     try{

         const{id: projectId} = req.params;
         const {topics} = req.body;

         if(!Array.isArray(topics) ||
                    topics.length<1 ||
                     topics.length > 10 || 
                     topics.some((topic) => 
                         typeof topic !== "string" || !topic.trim()
            )){

                return res.status(400).json({

                    success: false,
                    message: "Provide between 1 and 10 valid topics"
                })
            }


            const project = await prisma.project.findUnique({
                where: {id: projectId}
            })

            if(!project){

                return res.status(404).json({

                    success: false,
                    message: "Project not found",
                })
            }

            const articles = [];

            for (const rawTopic of topics){

                const topic = rawTopic.trim();

                try{

                    const content = await generateArticle(project.name, topic);

                    const article = await prisma.article.create({

                         data: {
                            topic,
                            slug: createSlug(topic),
                            content,
                            status: "COMPLETED",
                            projectId: project.id,
                         },
                    });

                    articles.push(article);

                }

                catch(error){

                     console.error(`Failed to generate ${topic}: `, error.message);

                     const article = await prisma.article.create({
                        data: {
                            topic,
                            slug: createSlug(topic),
                            content: "",
                            status: "FAILED",
                            projectId: project.id

                        },
                     });

                     articles.push(article);
                }


            }

            const succeeded = articles.filter(

                (article) => article.status === "COMPLETED"
            ).length;


            return res.status(201).json({

                success: succeeded >0,
                count: articles.length,
                succeeded,
                failed: articles.length - succeeded,
                articles,
            })

     }

     catch(error){

        console.error("Article route error:", error);
        return res.status(500).json({

            success: false,
            message: "Failed to process articles"
        })

     }
}