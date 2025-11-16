// src/controllers/officeController.js
import officeService from "../services/officeService.js";

/** ===================== OFFICE CRUD ===================== **/

export const createOffice = (req, res) =>
  officeService.create(req, res);

export const getAllOffices = (req, res) =>
  officeService.index(req, res);

export const getOfficeById = (req, res) =>
  officeService.getDetails(req, res);

export const updateOffice = (req, res) =>
  officeService.update(req, res);

export const deleteOffice = (req, res) =>
  officeService.softDelete(req, res);

/** ===================== OFFICE LEADERS ===================== **/

export const createOfficeLeader = (req, res) =>
  officeService.createLeader(req, res);

export const getAllOfficeLeaders = (req, res) =>
  officeService.leaderIndex(req, res);

export const getOfficeLeaderById = (req, res) =>
  officeService.leaderDetails(req, res);

export const updateOfficeLeader = (req, res) =>
  officeService.leaderUpdate(req, res);

export const deleteOfficeLeader = (req, res) =>
  officeService.leaderDelete(req, res);

/** ===================== OFFICE HIERARCHY ===================== **/

export const getOfficeHierarchy = (req, res) =>
  officeService.hierarchy(req, res);


