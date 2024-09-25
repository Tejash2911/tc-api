import express from "express";
import { verifyAdminWithToken } from "../middlewares/tokenVerify.js";
import { addProduct, deleteProduct, getAllProducts, getProductInfo, searchProducts, updateProduct } from "../controllers/product.controller.js";

const router = express.Router();

//add new product req: login
router.post("/", verifyAdminWithToken, addProduct);

//update products
router.put("/:id", verifyAdminWithToken, updateProduct);

//delete product req:login
router.delete("/:id", verifyAdminWithToken, deleteProduct);

//get specific product info
router.get("/info/:id", getProductInfo);

//get all products
router.get("/all", getAllProducts);

//search products
router.get("/search/:s", searchProducts);

export default router;
