import * as productService from "../services/product.service.js"
import { parseId } from "../utils/parseId.js";

export const getProducts = async (req, res) => {
    const { value, hit } = await productService.findAll(req.validatedQuery);
    res.set('X-Cache', hit ? 'HIT' : 'MISS').json(value)
}

export const getProductById = async (req, res) => {
    const { value, hit } = await productService.findById(parseId(req.params.id));
    res.set('X-Cache', hit ? 'HIT' : 'MISS').json({ data: value })
}

export const createProduct = async (req, res) => {
    const product = await productService.create(req.body);
    res.status(201).json({ message: "Produk ditambahkan", data: product })
}

export const updateProduct = async (req, res) => {
    const product = await productService.update(parseId(req.params.id), req.body);
    res.json({ message: 'Produk diperbarui', data: product })
}

export const deleteProduct = async (req, res) => {
    await productService.remove(parseId(req.params.id));
    res.json({ message: 'Produk dihapus' })
}