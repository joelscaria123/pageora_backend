import express from "express";
import { createArticle, createProject, getArticles, getProjectById, getProjects } from "../controller/projectController.js";
import { upload } from "../services/multer.js";

const router = express.Router();

router.get("/", getProjects);

router.get("/articles/:slug", getArticles);

router.get("/:id", getProjectById);

router.post("/", upload.single("logo"), createProject);


router.post("/:id/articles", createArticle);

export default router;