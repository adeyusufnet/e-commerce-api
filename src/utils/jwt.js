import jwt from "jsonwebtoken"

export const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "id"
    })
}

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET)