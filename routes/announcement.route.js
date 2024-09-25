import express from "express";
import { addAnnouncement, deleteAnnouncement, disableAllAnnouncements, editAnnouncement, getAllAnnouncements, getAnnouncement, importAnnouncements } from "../controllers/announcement.controller.js";
import { verifyAdminWithToken } from "../middlewares/tokenVerify.js";

const router = express.Router();

//get announcement
router.get("/", getAnnouncement);

//add announcement
router.post("/", verifyAdminWithToken, addAnnouncement);

//Edit announcement Status
router.put("/:id", verifyAdminWithToken, editAnnouncement);

//disable all Announcement
router.delete("/active", verifyAdminWithToken, disableAllAnnouncements);

//get all announcement
router.get("/all", verifyAdminWithToken, getAllAnnouncements);

//delete announcement
router.delete("/:id", deleteAnnouncement);

//bulkImport announcement
router.post('/import', importAnnouncements);

export default router;
