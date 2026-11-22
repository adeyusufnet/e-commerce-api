import { Router } from "express";
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from "../controllers/product.controller.js";
import { validate } from "../middlewares/validate.js";
import { createProductSchema, updateProductSchema, listProductQuerySchema } from "../schemas/product.schema.js";

import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', validate(listProductQuerySchema, 'query'), getProducts);
router.get("/:id", getProductById);

router.post('/', authenticate, authorize('admin'), validate(createProductSchema), createProduct);
router.put('/:id', authenticate, authorize('admin'), validate(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;