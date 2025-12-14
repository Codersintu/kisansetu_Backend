import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import "dotenv/config";
const JWT_SECRET: string = process.env.JWT_SECRET ?? "kisansetuapp";
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function authMidilware(req:Request,res:Response,next:NextFunction) {
  try {
    
  
    const header=req.headers["authorization"]
      if (!header) {
    return res.status(403).json({
      message: "u are not logged in"
    })}
    const decode=await jwt.verify(header as string,JWT_SECRET || "") as { userId:string} | undefined
    if (decode) {
        req.userId=decode.userId;
        next()
    }else {
    res.status(403).json({
      message: "u are not logged in"
    })
  }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      message: "Internal server error from middleware"
    })

  }
}