import { Router } from "express";
import { createOrderSchema } from "../schemas/order.schema.js";
import { createOrder, getOrderById, getOrders } from "../controllers/order.controller.js";
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate); // semua route dibawah ini wajib login

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;