import type { NextFunction, Request, Response } from "express";
import "dotenv/config";
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}
export declare function authMidilware(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authMidilware.d.ts.map