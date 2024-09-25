import express from "express";
import { verifyToken } from "../middlewares/tokenVerify.js";
import { abuseReview, addReview, getReviews, upvoteReview } from "../controllers/review.controller.js";

const router = express.Router();

//ADD REVIEW
router.post("/:productid", verifyToken, addReview);

//GET REVIEWS
router.get("/:id", getReviews);

//ABUSE REVIEW
router.put("/abuse/:id", verifyToken, abuseReview);

//UPVOTE REVIEW
router.put("/upvote/:id", verifyToken, upvoteReview);

export default router;
