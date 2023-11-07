require('dotenv').config()

const express = require('express');
const router = express.Router();
const pool = require('../db/config');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    const userQuery = 'SELECT * FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' })
    }

    const user = userResult.rows[0];

    if (password !== user.password) {
      return res.status(401).json({ message: 'Senha inválida' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.SECRET_JWT, {expiresIn: '1h'} )
    res.status(200).json({ message: 'Login bem-sucedido', token });
  } catch (error) {
    console.log(process.env.SECRET_JWT)
    res.status(500).json({ message: 'Erro ao fazer login' + error })
  }
})

module.exports = router;