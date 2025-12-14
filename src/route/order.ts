import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import express from "express";
import { authMidilware } from "../authMidilware.js";
const router=express.Router()
const client=new PrismaClient();
router.post("/create", authMidilware, async (req, res) => {
  try {
    const buyerId = Number(req.userId);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = await client.$transaction(async (tx) => {
      let total = 0;
      const orderItemsData = [];

      for (const item of items) {
        if (!item.productId || !item.quantity) {
          throw new Error("Invalid item data");
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (product.quantity < item.quantity) {
          throw new Error(
            `Only ${product.quantity} left for ${product.title}`
          );
        }

        total += product.price * item.quantity;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          buyerId,
          total,
          status: "PLACED",
          items: {
            create: orderItemsData,
          },
        },
      });

      return newOrder; // ✅ ONLY RETURN DATA
    });

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });

  } catch (error: any) {
    console.error("Order error:", error.message);

    return res.status(400).json({
      message: error.message || "Order failed",
    });
  }
});


router.get("/my-orders", authMidilware, async (req, res) => {
  try {
    const buyerId = Number(req.userId);

    const orders = await client.order.findMany({
      where: { buyerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                vegetable: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ orders });

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});


export default router;