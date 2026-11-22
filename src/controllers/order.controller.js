import * as orderService from '../services/order.service.js';
import { parseId } from '../utils/parseId.js';

export const createOrder = async (req, res) => {
    const order = await orderService.createOrder(req.user.id, req.body.items);
    res.status(201).json({ message: 'Pesanan berhasil dibuat', data: order })
}

export const getOrders = async (req, res) => {
    const data = await orderService.findAll(req.user);
    res.json({ data, total: data.length })
};

export const getOrderById = async (req, res) => {
    const order = await orderService.findById(parseId(req.params.id, 'ID Pesanan'), req.user);
    res.json({ data: order });
}