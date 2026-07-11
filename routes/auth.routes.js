const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/index");
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

const saltRounds = 10;

// POST /auth/signup
// Registo básico — sem plano (plano é atribuído após pagamento)
router.post("/signup", async (req, res) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    birthDate,
    nationality,
    address,
    nif,
    weight,
    height,
    phoneNumber,
  } = req.body;

  // Validações básicas
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      message: "Email, password, firstName e lastName são obrigatórios.",
    });
  }

  try {
    // Verifica se email ou username já existem
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email ou username já existe." });
    }

    // Hash da password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insere o utilizador — sem plano, status pending
    const [result] = await pool.execute(
      `INSERT INTO users 
        (username, email, password, first_name, last_name, birth_date,
         nationality, address, nif, weight, height, phone_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        username || null,
        email,
        hashedPassword,
        firstName,
        lastName,
        birthDate || null,
        nationality || null,
        address || null,
        nif || null,
        weight || null,
        height || null,
        phoneNumber || null,
      ]
    );

    // Busca o utilizador criado (sem a password)
    const [rows] = await pool.execute(
      `SELECT id, username, email, first_name, last_name, birth_date,
              nationality, address, nif, weight, height, phone_number, status
       FROM users WHERE id = ?`,
      [result.insertId]
    );
    const user = rows[0];

    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, type: "user" },
      process.env.TOKEN_SECRET,
      { expiresIn: "6h" }
    );

    res.status(201).json({
      authToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        birthDate: user.birth_date,
        nationality: user.nationality,
        address: user.address,
        nif: user.nif,
        weight: user.weight,
        height: user.height,
        phoneNumber: user.phone_number,
        status: user.status,
        plan: null, // sem plano até pagar
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code,
    });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Introduz email e password." });
  }

  try {
    // Busca o utilizador com a subscrição ativa (se existir)
    const [rows] = await pool.execute(
      `SELECT 
        id, username, email, password, first_name, last_name from users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const foundUser = rows[0];

    if (!foundUser) {
      return res.status(401).json({ message: "Utilizador não encontrado." });
    }

    // Verifica password
    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Monta o objeto do plano (null se não tiver subscrição ativa)
    const plan = foundUser.sub_id
      ? {
          id: foundUser.sub_id,
          subscriptionPlan: foundUser.plan_type,
          value: foundUser.sub_value,
          startsAt: foundUser.starts_at,
          expiresAt: foundUser.expires_at,
        }
      : null;

    // Gera token JWT
    const payload = {
      id: foundUser.id,
      email: foundUser.email,
      status: foundUser.status,
    };
    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    res.status(200).json({
      authToken,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        firstName: foundUser.first_name,
        lastName: foundUser.last_name,
        birthDate: foundUser.birth_date,
        nationality: foundUser.nationality,
        address: foundUser.address,
        nif: foundUser.nif,
        weight: foundUser.weight,
        height: foundUser.height,
        phoneNumber: foundUser.phone_number,
        status: foundUser.status,
        plan, // null se ainda não pagou
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// GET /auth/verify
router.get("/verify", isAuthenticated, (req, res) => {
  res.status(200).json(req.payload);
});

module.exports = router;