import express from "express";
import { verifyAdminWithToken, verifyToken, verifyUserWithToken } from "../middlewares/tokenVerify.js";
import { changeOrderStatus, createOrder, deleteOrder, getAllOrders, getOrderInfo, getUserOrders, updateOrder } from "../controllers/order.controller.js";

const router = express.Router();

//CREATE
router.post("/", verifyToken, createOrder);

//UPDATE
router.put("/:id", verifyAdminWithToken, updateOrder);

//DELETE
router.delete("/:id", verifyAdminWithToken, deleteOrder);

//////////////            CONFIRMED ORDERS         ////////////////

//GET USER ORDERS
router.get("/find/:id", verifyUserWithToken, getUserOrders);

//GET ALL ORDERS
router.get("/", verifyAdminWithToken, getAllOrders);

//CHANGE ORDER STATUS
router.put("/status/:id", verifyAdminWithToken, changeOrderStatus);

//GET ORDER INFO
router.get("/:id", getOrderInfo);

export default router;
