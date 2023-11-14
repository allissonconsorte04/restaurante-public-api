const express = require('express');
const router = express.Router();
const pool = require('../db/config');

// Rota para cadastrar um novo cliente
router.post('/', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    const query = 'INSERT INTO clientes (nome, email, telefone) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [nome, email, telefone]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    res.status(500).json({ message: 'Erro ao cadastrar cliente.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { nome } = req.query;
    
    let query;
    let values;

    if (nome) {
      query = `SELECT * FROM clientes WHERE LOWER(nome) LIKE LOWER($1)`
      values = [`%${nome}%`];
    } else {
      query = `SELECT * FROM clientes`;
      values = [];
    }
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao listar clientes: ', error);
    res.status(500).json({ message: 'Erro ao listar clientes.' })
  }
})

router.get('/:cliente_id', async (req, res) => {
  try {
    const clienteId = req.params.cliente_id;

    const query = 'SELECT * FROM clientes WHERE id = $1';
    const result = await pool.query(query, [clienteId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cliente por ID: ', error)
    res.status(500).json({ message: 'Erro ao obter cliente por ID' });
  }
})

router.delete('/:cliente_id', async (req, res) => {
  try {
    const clienteId = req.params.cliente_id;

    const query = 'DELETE FROM clientes WHERE id = $1';
    const result = await pool.query(query, [clienteId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' })
    }

    res.status(200).json({ message: 'Cliente excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir cliente por ID: ', error);
    res.status(500).json({ message: 'Erro ao excluir cliente por ID' });
  }
});

router.put('/:cliente_id', async (req, res) => {
  try {
    const clienteId = req.params.cliente_id;
    const { nome, email, telefone } = req.body;

    const query = 'UPDATE clientes SET nome = $1, email = $2, telefone = $3 WHERE id = $4 RETURNING *';
    const values = [nome, email, telefone, clienteId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' })
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente por ID: ', error);
    res.status(500).json({ message: 'Erro ao atualizar cliente por ID' })
  }
})

module.exports = router;
