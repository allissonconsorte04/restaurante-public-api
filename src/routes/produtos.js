const express = require('express');
const router = express.Router();
const pool = require('../db/config');

// Rota para cadastrar produto
router.post('/', async (req, res) => {
    try {
        const { nome, preco } = req.body;

        const query = 'INSERT INTO produtos (nome, preco) VALUES ($1, $2) RETURNING *';
        const values = [nome, preco];

        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]); // Retorna o produto inserido
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        res.status(500).json({ message: 'Erro ao cadastrar produto' });
    }
});

router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM produtos';
        const result = await pool.query(query);

        res.status(200).json(result.rows); // Retorna a lista de produtos
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ message: 'Erro ao listar produtos' });
    }
});

router.get('/:produto_id', async (req, res) => {
    try {
        const produtoId = req.params.produto_id;

        const query = 'SELECT * FROM produtos WHERE id = $1';
        const result = await pool.query(query, [produtoId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter produto por ID: ', error);
        res.status(500).json({ message: 'Erro ao obter produto por ID' });
    }
})

router.delete('/:produto_id', async (req, res) => {
    try {
        const produtoId = req.params.produto_id;

        const query = 'DELETE FROM produtos WHERE id = $1';
        const result = await pool.query(query, [produtoId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Produto não encontrado' })
        }
        res.status(200).json({message: 'Produto excluído com sucesso!'});
    } catch (error) {
        console.error('Erro ao excluir produto por ID: ', error);
        res.status(500).json({ message: 'Erro ao excluir produto por ID' });
    }
})

router.put('/:produto_id', async(req, res) => {
    try{
        const produtoId = req.params.produto_id;
        const { nome, preco } = req.body;

        const query = 'UPDATE produtos SET nome = $1, preco = $2 WHERE id = $3 RETURNING *';
        const values = [nome, preco, produtoId];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Produto não encontardo'});
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar produto por ID: ', error);
        res.status(500).json({ message: 'Erro ao atualizar produto por ID' })
    }
})

module.exports = router;
