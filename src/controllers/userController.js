import userService from "../services/userService.js";

export const getUser = async (req, res) => {
  const result = await userService.getUserById(req.user.id);
  res.status(result.success ? 200 : 404).json(result);
};

export const getAllUsers = async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  res.status(result.success ? 200 : 500).json(result);
};

export const updateUser = async (req, res) => {
  const result = await userService.updateUser(req.user, req.params.id, req.body);
  res.status(result.success ? 200 : 400).json(result);
};

export const deleteUser = async (req, res) => {
  const result = await userService.deleteUser(req.params.id);
  res.status(result.success ? 200 : 400).json(result);
};
export const restoreUser = async (req, res) => {
  const { id } = req.params; 
  const result = await userService.restoreUser({ id });

  res.status(result.success ? 200 : 400).json(result);
};

export const restoreAllUsers = async (req, res) => {
  const result = await userService.restoreUser();

  res.status(result.success ? 200 : 400).json(result);
};
