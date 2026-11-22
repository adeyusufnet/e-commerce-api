import express from 'express';
import productRoutes from './routes/product.routes.js'
import authRoutes from './routes/auth.routes.js'
import orderRoutes from './routes/order.routes.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js'
import helmet from 'helmet';
import { globalLimiter } from './middlewares/rateLimiter.js';
import cors from 'cors'

const app = express();

// Lapis keamanan: dipasang paling atas sebelum route apapun
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || false }));
app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));

app.use("/auth", authRoutes)
app.use("/products", productRoutes)
app.use('/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler)

export default app;