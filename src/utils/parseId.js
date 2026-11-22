import { AppError } from "./AppError.js";

export const parseId = (value, label = 'ID') => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new AppError(`${label} tidak valid`, 400);
    return id;
}