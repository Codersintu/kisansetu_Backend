import jwt from "jsonwebtoken";
import "dotenv/config";
const JWT_SECRET = process.env.JWT_SECRET ?? "kisansetuapp";
export async function authMidilware(req, res, next) {
    try {
        const header = req.headers["authorization"];
        if (!header) {
            return res.status(403).json({
                message: "u are not logged in"
            });
        }
        const decode = await jwt.verify(header, JWT_SECRET || "");
        if (decode) {
            req.userId = decode.userId;
            next();
        }
        else {
            res.status(403).json({
                message: "u are not logged in"
            });
        }
    }
    catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({
            message: "Internal server error from middleware"
        });
    }
}
//# sourceMappingURL=authMidilware.js.map