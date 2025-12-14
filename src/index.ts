import "dotenv/config";
import cors from "cors"
import express from "express"
import authRoute from "./route/user.js"
import postRoute from "./route/post.js"
import orderRoute from "./route/order.js"
const app=express()
app.use(express.json())
app.use(cors({
    origin:"https://kisansetu-project-bhan.vercel.app",
    methods:["GET","POST","PUT","DELETE"],
    credentials:true
}))
app.get("/", (req, res) => {
  res.send("KisanSetu Backend is Live 🚀");
});




app.use("/api/auth",authRoute)
app.use("/api/post",postRoute)
app.use("/api/order",orderRoute)
const PORT=3000;
app.listen(PORT,()=>{
    console.log(`server is running ${PORT}`)
})