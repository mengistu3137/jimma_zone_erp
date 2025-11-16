import express from "express";
import { authenticate, checkPermission } from "../middleware/authMiddleware.js";
import {
  getUser,
  getAllUsers,
  updateUser,
  deleteUser,
  restoreUser, restoreAllUsers
} from "../controllers/userController.js";

const router = express.Router();


router.get("/me", authenticate, checkPermission("view_self"), getUser);


router.get("/", authenticate, checkPermission("view_users"), getAllUsers);

router.put("/restore", authenticate, checkPermission("restore_user"), restoreAllUsers); 
router.put("/:id", authenticate, checkPermission("update_user"), updateUser);

router.delete("/:id", authenticate, checkPermission("delete_user"), deleteUser);
router.put("/restore/:id", authenticate, checkPermission("restore_user"), restoreUser);

export default router;
