import { Router } from "express";
import * as adopterController from "./adopters.controller";

const router = Router();

/**
 * CREATE ADOPTER
 */
router.post("/", (req, res) => {
  void adopterController.createAdopter(req, res);
});

/**
 * GET ALL ADOPTERS
 */
router.get("/", (req, res) => {
  void adopterController.listAdopters(req, res);
});

/**
 * GET ADOPTER BY ID
 */
router.get("/:id", (req, res) => {
  void adopterController.getAdopterById(req, res);
});

/**
 * UPDATE ADOPTER
 */
router.put("/:id", (req, res) => {
  void adopterController.updateAdopter(req, res);
});

/**
 * DELETE ADOPTER
 */
router.delete("/:id", (req, res) => {
  void adopterController.deleteAdopter(req, res);
});

export default router;
