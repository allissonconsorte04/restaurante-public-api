-- Script para criar tabelas no PostgreSQL

-- Tabela de clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
);

-- Tabela de produtos
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL
);

-- Tabela de pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    cliente_id INTEGER,
    valor_total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabela de itens de pedido
CREATE TABLE itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    finished BOOLEAN,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Tabela de contas
CREATE TABLE contas (
    id SERIAL PRIMARY KEY,
    valor_total DECIMAL(10, 2) NOT NULL,
    data_fechamento DATE NOT NULL
);

-- Tabela de associação entre conta e cliente
CREATE TABLE conta_cliente (
    conta_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    FOREIGN KEY (conta_id) REFERENCES contas(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    PRIMARY KEY (conta_id, cliente_id)
);
