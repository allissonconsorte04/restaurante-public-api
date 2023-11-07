const express = require('express');
const router = express.Router();
const pool = require('../db/config');

router.post('/', async (req, res) => {
    try {
        const { cliente_id } = req.body;
        const status = 'aberto'
        const data = new Date();
        const valorTotal = 0;
        const query = 'INSERT INTO pedidos (data, status, cliente_id, valor_total) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [data, status, cliente_id, valorTotal]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao cadastrar pedido:', error);
        res.status(500).json({ message: 'Erro ao cadastrar pedido.' });
    }
});

router.get('/produtos-a-produzir', async(req, res) => {
    try {
        const dataAtual = new Date();
        const dataAtualFormatada = `${dataAtual.getFullYear()}-${(dataAtual.getMonth() + 1).toString().padStart(2, '0')}-${dataAtual.getDate().toString().padStart(2, '0')}`;
        console.log(dataAtual)
        console.log(dataAtualFormatada)

        const query = `
            SELECT p.nome AS nome_produto, i.pedido_id, i.quantidade, i.finished
            FROM pedidos ped
            JOIN itens_pedido i ON ped.id = i.pedido_id
            JOIN produtos p ON i.produto_id = p.id
            WHERE TO_CHAR(ped.data, 'YYYY-MM-DD') = $1
            AND (i.finished = false OR i.finished IS NULL)
            ORDER BY p.nome, i.pedido_id;
        `;


        const result = await pool.query(query, [dataAtualFormatada]);
        console.log('result, ', result)

        const produtosAProduzir = result.rows.map(row => ({
            nome_produto: row.nome_produto,
            pedido_id: row.pedido_id,
            quantidade: row.quantidade,
            finished: row.finished
        }));

        res.status(200).json(produtosAProduzir);
    } catch (error) {
        console.error('Erro ao obter produtos a serem produzidos: ', error)
        res.status(500).json({ message: 'Erro ao obter produtos a serem produzidos' })
    }
})

router.get('/:pedido_id', async (req, res) => {
    try {
        const pedidoId = req.params.pedido_id;

        const query = `SELECT pedidos.id, pedidos.data, pedidos.status, pedidos.cliente_id, pedidos.valor_total, itens_pedido.produto_id, itens_pedido.quantidade FROM pedidos LEFT JOIN itens_pedido ON pedidos.id = itens_pedido.pedido_id WHERE pedidos.id = $1`;
        const result = await pool.query(query, [pedidoId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        const pedidoInfo = {
            id: result.rows[0].id,
            data: result.rows[0].data,
            status: result.rows[0].status,
            cliente_id: result.rows[0].cliente_id,
            valor_total: result.rows[0].valor_total,
            itens: result.rows.map(row => ({
                produto_id: row.produto_id,
                quantidade: row.quantidade
            }))
        };

        res.status(200).json(pedidoInfo)
    } catch (error) {
        console.error('Erro ao obter pedido por ID: ', error);
        res.status(500).json({ message: 'Erro ao obter pedido por ID' });
    }
});

router.post('/adicionar-item/:pedido_id', async (req, res) => {
    try {
        const pedidoId = req.params.pedido_id;
        const { produto_id, quantidade } = req.body;

        const verificarExistenciaQuery = 'SELECT * FROM itens_pedido WHERE pedido_id = $1 AND produto_id = $2';
        const verificarExistenciaValues = [pedidoId, produto_id];

        const resultadoVerificacao = await pool.query(verificarExistenciaQuery, verificarExistenciaValues);

        if (resultadoVerificacao.rows.length > 0) {
            const quantidadeExistente = resultadoVerificacao.rows[0].quantidade;
            const novaQuantidade = quantidadeExistente + quantidade;

            const atualizarQuantidadeQuery = 'UPDATE itens_pedido SET quantidade = $1 WHERE pedido_id = $2 AND produto_id = $3';
            const atualizarQuantidadeValues = [novaQuantidade, pedidoId, produto_id];

            await pool.query(atualizarQuantidadeQuery, atualizarQuantidadeValues);
        } else {
            const addProductQuery = 'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade) VALUES ($1, $2, $3) RETURNING *';
            const addProductValues = [pedidoId, produto_id, quantidade];

            const resultAddProduct = await pool.query(addProductQuery, addProductValues);
        }

        const novoValorTotal = await calcularValorTotalPedido(pedidoId);

        const updateQuery = 'UPDATE pedidos SET valor_total = $1 WHERE id = $2';
        await pool.query(updateQuery, [novoValorTotal, pedidoId]);

        res.status(201).json({ message: 'Item do pedido adicionado/atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar item em pedido:', error);
        res.status(500).json({ message: 'Erro ao adicionar item em pedido' });
    }
});

router.post('/:pedido_id/fechar', async (req, res) => {
    try {
        const pedidoId = req.params.pedido_id;
        const { pessoas } = req.body;

        if (pessoas < 1 || pessoas > 4) {
            return res.status(400).json({ message: 'O número de pessoas deve ser entre 1 e 4'});
        }

        const valorTotalQuery = 'SELECT valor_total FROM pedidos WHERE id = $1';
        const valorTotalResult = await pool.query(valorTotalQuery, [pedidoId]);

        if (valorTotalResult.rows.length === 0){
            return res.status(404).json({message: 'Pedido não encontrado'})
        }

        const valorTotal = valorTotalResult.rows[0].valor_total;

        const valorPorPessoa = valorTotal / pessoas;

        // Execute a query SQL para fechar o pedido
        const query = 'INSERT INTO contas (valor_total, data_fechamento) VALUES ($1, CURRENT_DATE) RETURNING *';
        const values = [valorTotal];

        const resultConta = await pool.query(query, values);
        const contaId = resultConta.rows[0].id;

        // Associar o pedido à conta
        const queryAssociacao = 'INSERT INTO conta_cliente (conta_id, pedido_id) VALUES ($1, $2)';
        await pool.query(queryAssociacao, [contaId, pedidoId]);

        // Dividir a conta em no máximo 4 pessoas
        if (pessoas > 0 && pessoas <= 4) {
            const valorPorPessoa = valorTotal / pessoas;

            // Atualizar a conta com o valor por pessoa
            const queryAtualizacao = 'UPDATE contas SET valor_total = $1 WHERE id = $2';
            await pool.query(queryAtualizacao, [valorPorPessoa, contaId]);
        }

        res.status(201).json({ message: 'Pedido fechado com sucesso' });
    } catch (error) {
        console.error('Erro ao fechar pedido:', error);
        res.status(500).json({ message: 'Erro ao fechar pedido' });
    }
});

router.get('/:pedido_id/fechar', async (req, res) => {
    try {
        const pedidoId = req.params.pedido_id;
        const pessoas = req.query.pessoas;

        if (pessoas < 1 || pessoas > 4) {
            return res.status(400).json({ message: 'O número de pessoas deve ser entre 1 e 4'});
        }

        const valorTotalQuery = 'SELECT valor_total FROM pedidos WHERE id = $1';
        const valorTotalResult = await pool.query(valorTotalQuery, [pedidoId]);

        if (valorTotalResult.rows.length === 0){
            return res.status(404).json({message: 'Pedido não encontrado'})
        }

        const valorTotal = valorTotalResult.rows[0].valor_total;

        const valorPorPessoa = valorTotal / pessoas;

        // Dividir a conta em no máximo 4 pessoas
        if (pessoas > 0 && pessoas <= 4) {
            const valorPorPessoa = valorTotal / pessoas;
        }

        res.status(201).json({ message: 'Valor dividido com sucesso', valorPorPessoa });
    } catch (error) {
        console.error('Erro ao fechar pedido:', error);
        res.status(500).json({ message: 'Erro ao dividir conta' });
    }
});

router.put('/atualizar-item/:pedido_id/:produto_id', async (req, res) => {
    try {
        const pedidoId = req.params.pedido_id;
        const produtoId = req.params.produto_id;
        const { quantidade } = req.body;

        const atualizarItemQuery = 'UPDATE itens_pedido SET quantidade = $1 WHERE pedido_id = $2 AND produto_id = $3';
        const atualizarItemValues = [quantidade, pedidoId, produtoId];

        await pool.query(atualizarItemQuery, atualizarItemValues);

        const novoValorTotal = await calcularValorTotalPedido(pedidoId);

        const updateQuery = 'UPDATE pedidos SET valor_total = $1 WHERE id = $2';
        await pool.query(updateQuery, [novoValorTotal, pedidoId]);

        res.status(200).json({ message: 'Item do pedido atualizado com sucesso'});
    } catch (error) {
        console.error('Erro ao atualizar item em pedido: ', error);
        res.status(500).json({ message: 'Erro ao atualizar item em pedido' })
    }
})

async function calcularValorTotalPedido(pedidoId) {
    try {
        const query = `
            SELECT SUM(p.preco * ip.quantidade) as total
            FROM itens_pedido ip
            INNER JOIN produtos p ON ip.produto_id = p.id
            WHERE pedido_id = $1
        `;

        const result = await pool.query(query, [pedidoId]);

        if (result.rows.length === 0) {
            return 0;
        }

        return parseFloat(result.rows[0].total) || 0;
    } catch (error) {
        console.error('Erro ao calcular valor total do pedido: ', error);
        return 0;
    }
}

module.exports = router;
