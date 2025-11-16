import { AuthService } from "../services/authService.js";
const authService = new AuthService();

export const register = async (req, res) => {
  const result = await authService.register(req.body);
  if (result.success) {
    res.status(201).json({
      message: result.message,
      user: result.data,
    });
  } else {
    res.status(400).json({ error: result.message });
  }
};


export const login = async (req, res) => {
  const result = await authService.login(req.body);
  if (result.success) {
    res.json({
      message: result.message,
      token: result.data.token,
      user: result.data.user,
    });
  } else {
    res.status(401).json({ error: result.message });
  }
};
