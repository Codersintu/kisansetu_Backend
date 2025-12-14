import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import express from "express";
import z from "zod";
import { authMidilware } from "../authMidilware.js";
const router = express.Router();
const client = new PrismaClient();
const productValidation = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(20, { message: "Title must be at most 20 characters" }),
    description: z.string().min(3, { message: "Description must be at least 3 characters" }).max(100, { message: "Description must be at most 100 characters" }),
    vegetable: z.string().min(3, { message: "Vegetable must be at least 3 characters" }).max(10, { message: "Vegetable must be at most 10 characters" }),
    price: z.number().int().positive({ message: "price must be greater than 0" }),
    quantity: z.number().int().positive({ message: "quantity must be greater than 0" }),
    unit: z.enum(["kg", "piece", "dozen", "litre"], { message: "unit must be either kg, piece,litre or dozen" }),
    isCompleted: z.boolean().optional(),
    img: z.string().url({ message: "Img must be a valid URL" }).optional()
});
router.post("/create", authMidilware, async (req, res) => {
    try {
        const parsedData = productValidation.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                error: parsedData.error.issues[0]?.message
            });
        }
        const { title, description, vegetable, price, quantity, unit, isCompleted, img } = parsedData.data;
        const newProduct = await client.product.create({
            data: {
                title,
                description,
                vegetable,
                price,
                quantity,
                unit,
                isCompleted: isCompleted ?? false,
                img: img ?? "",
                sellerId: Number(req.userId)
            }
        });
        return res.status(201).json({
            message: "Post created successfully",
            post: newProduct
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
});
router.get("/all", async (req, res) => {
    try {
        const products = await client.product.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.status(200).json({
            products
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
});
router.get("/my-posts", authMidilware, async (req, res) => {
    try {
        const userId = Number(req.userId);
        const products = await client.product.findMany({
            where: {
                sellerId: userId
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.status(200).json({ products });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
});
router.delete("/delete/:id", authMidilware, async (req, res) => {
    try {
        const productId = parseInt(req.params.id || "");
        const sellerId = Number(req.userId);
        const product = await client.product.findUnique({
            where: {
                id: productId,
                sellerId: sellerId
            }
        });
        if (!product) {
            return res.status(404).json({
                error: "Post not found"
            });
        }
        if (product.sellerId !== sellerId) {
            return res.status(403).json({
                error: "You are not authorized to delete this post"
            });
        }
        await client.product.delete({
            where: {
                id: productId
            }
        });
        return res.status(200).json({
            message: "Post deleted successfully"
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
});
router.put("/update/:id", authMidilware, async (req, res) => {
    try {
        const productId = parseInt(req.params.id || "");
        const sellerId = Number(req.userId);
        const product = await client.product.findUnique({
            where: {
                id: productId
            }
        });
        if (!product) {
            return res.status(404).json({
                error: "Post not found"
            });
        }
        if (product.sellerId !== sellerId) {
            return res.status(403).json({
                error: "You are not authorized to update this post"
            });
        }
        const parsedData = productValidation.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                error: parsedData.error.issues[0]?.message
            });
        }
        const { title, description, vegetable, price, quantity, unit, isCompleted, img } = parsedData.data;
        const updatedProduct = await client.product.update({
            where: {
                id: productId
            },
            data: {
                title,
                description,
                vegetable,
                price,
                quantity,
                unit,
                isCompleted: isCompleted ?? product.isCompleted,
                img: img ?? product.img
            }
        });
        return res.status(200).json({
            message: "Post updated successfully",
            post: updatedProduct
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
});
export default router;
//# sourceMappingURL=post.js.map