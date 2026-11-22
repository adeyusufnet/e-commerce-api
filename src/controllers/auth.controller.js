import * as authService from '../services/auth.service.js';

export const register = async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'Registrasi berhasil', data: user });
};

export const login = async (req, res) => {
    const result = await authService.login(req.body);
    res.json({ message: 'Login berhasil', data: result });
};

export const me = async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    res.json({ data: user });
};

export const refresh = async (req, res) => {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.json({ message: 'Token diperbarui', data: tokens })
}

export const logout = async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.json({ message: 'Logout berhasil' })
}

export const logoutAll = async (req, res) => {
    await authService.logoutAll(req.user.id);
    res.json({ message: 'Berhasil logout dari semua perangkat' })
}