// src/controllers/announcementController.js
import announcementService from "../services/announcementService.js";

export const createAnnouncement = (req, res) =>
  announcementService.create(req, res);

export const getAllAnnouncement = (req, res) =>
  announcementService.index(req, res);

export const getDetailById = (req, res) =>
  announcementService.getDetails(req, res);

export const updateAnnouncement = (req, res) =>
  announcementService.update(req, res);

export const softDeleteAnnouncement = (req, res) =>
  announcementService.softDelete(req, res);

export const restoreAnnouncement = (req, res) =>
  announcementService.restore(req, res);
