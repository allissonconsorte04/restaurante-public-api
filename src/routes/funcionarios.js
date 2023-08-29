const express = require('express');
const router = express.Router();
const pool = require('../db/config');
const async = require('hbs/lib/async');

// Rota para cadastrar funcionário
router.post('/', async (req, res) => {
    try {
        const { nome, cargo, salario } = req.body;

        const query = 'INSERT INTO funcionarios (nome, cargo, salario) VALUES ($1, $2, $3) RETURNING *';
        const values = [nome, cargo, salario];

        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]); // Retorna o funcionário inserido
    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        res.status(500).json({ message: 'Erro ao cadastrar funcionário' });
    }
});

router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM funcionarios';
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar funcionarios: ', error);
        res.status(500).json({ message: 'Erro ao listar funcionarios.' })
    }
})

router.get('/:funcionario_id', async (req, res) => {
    try {
        const funcionarioId = req.params.funcionario_id;

        const query = 'SELECT * FROM funcionarios WHERE id = $1';
        const result = await pool.query(query, [funcionarioId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Funcionário não encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter funcionário por ID: ', error);
        res.status(500).json({ message: 'Erro ao obter funcionário por ID.' });
    }
})

router.delete('/:funcionario_id', async (req, res) => {
    try {
        const funcionarioId = req.params.funcionario_id;

        const query = 'DELETE FROM funcionarios WHERE id = $1';
        const result = await pool.query(query, [funcionarioId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Funcionário não encontrado' });
        }

        res.status(200).json({ message: 'Funcionário excluído com sucesso!' })
    } catch (error) {
        console.error('Erro ao excluir funcionário por ID: ', error);
        res.status(500).json({ message: 'Erro ao excluir funcionário por ID' });
    }
})

router.put('/:funcionario_id', async (req, res) => {
    try {
        const funcionarioId = req.params.funcionario_id;
        const { nome, cargo, salario } = req.body;

        const query = 'UPDATE funcionarios SET nome = $1, cargo = $2, salario = $3 WHERE id = $4 RETURNING *'
        const values = [nome, cargo, salario, funcionarioId];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Funcionário não encontardo' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar funcionário por ID: ', error);
        res.status(500).json({ message: 'Erro ao atualizar funcionário por ID' })
    }
})

module.exports = router;
