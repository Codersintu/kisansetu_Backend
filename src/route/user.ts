import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import z from "zod"
import { authMidilware } from "../authMidilware.js";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "kisansetuapp";
const client = new PrismaClient();
const router = express.Router();

const userValidation=z.object({
  email:z.string().email({message:"Invalid email format"}),
  MobNumber:z.string().regex(/^[0-9]{10}$/, { message: "Mobile number must be 10 digits" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
})

router.post("/signup", async (req, res) => {
  try {
    const parsedData = userValidation.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        error: parsedData.error.issues[0]?.message,
      });
    }

    const { email, password, MobNumber } = parsedData.data;

    const existingUser = await client.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await client.user.create({
      data: {
        email,
        password: hashedPassword,
        MobNumber: BigInt(MobNumber),
      },
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        MobNumber: newUser.MobNumber.toString(),
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});



router.post("/login", async (req, res) => {
  try {
    const { MobNumber, password } = req.body;

    if (!MobNumber || !password) {
      return res.status(400).json({ error: "Please provide mobile number and password" });
    }

    const user = await client.user.findUnique({
      where: { MobNumber: BigInt(MobNumber) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.id, MobNumber: user.MobNumber.toString() },
      JWT_SECRET,
      { expiresIn: "7d" }
    );


    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        MobNumber: user.MobNumber.toString(),
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/update-profile",authMidilware, async (req, res) => {
  try {
    const userId=Number(req.userId);
    const parsedData=userValidation.safeParse(req.body);
    if(!parsedData.success){
      return res.status(400).json({
        error:parsedData.error.issues[0]?.message
      });
    }
    const { email, password, MobNumber } = parsedData.data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await client.user.update({
      where: { id: userId },
      data: {
        email,
        password: hashedPassword,
        MobNumber: BigInt(MobNumber),
      },
    });
    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id, 
        email: updatedUser.email,
        Number: updatedUser.MobNumber.toString(),
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/delete",authMidilware, async (req, res) => {
  try {
    const userId=Number(req.userId);
    console.log("Deleting user with ID:", userId);
    await client.user.delete({
      where: { id: userId },
    });
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/all-profile", async (req, res) => {
  try {
    const users = await client.user.findMany({
      select: {
        id: true,
        email: true,
        MobNumber: true,
      },
    });
    const formateUser=users.map((user)=>({
      ...user,
      MobNumber:user.MobNumber.toString()
    }))
    return res.status(200).json({ users: formateUser } );
  }
    catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  } 
});

router.get("/profile",authMidilware, async (req, res) => {
  try {
    const userId=Number(req.userId);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        MobNumber: true,
      },
    });
    const formateUser=user ? {
      ...user,
      MobNumber:user.MobNumber.toString()
    }:null;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ user:formateUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


    



export default router;
