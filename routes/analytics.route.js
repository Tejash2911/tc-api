import express from "express";
import { getOrderPriceForStats, getOrdersForStats, getPopularSizeColor, getSales, getTopCategories, getTopProducts } from "../controllers/analytics.controller.js";

const router = express.Router();

// get top products for chart
router.get("/topproducts", getTopProducts);

// Sales statistics route
router.get("/sales", getSales);

// get popular size and color for chart
router.get("/popularsizecolor", getPopularSizeColor);

// get orders for stats
router.get("/order", getOrdersForStats);

// get order price for stats
router.get("/orderprice", getOrderPriceForStats);

// get top categories for chart
router.get("/topcat", getTopCategories);

export default router;
