import express from 'express';
import dotenv from 'dotenv';
import projectRoutes from './routes/projectRoutes.js';
import cors from 'cors';

dotenv.config({quiet: true});

const app = express();

app.use(cors({ origin: "https://brandpress-frontend.onrender.com"}));

app.use(express.json());


app.use("/api/projects", projectRoutes);



const PORT = process.env.PORT;


app.listen(PORT, () => {

    console.log(`Server running on PORT`, PORT);
})

