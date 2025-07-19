#!/bin/sh

# Função para aguardar o PostgreSQL estar pronto
wait_for_postgres() {
    echo "Aguardando PostgreSQL estar pronto..."
    while ! pg_isready -h postgres -p 5432 -U postgres > /dev/null 2>&1; do
        sleep 1
    done
    echo "PostgreSQL está pronto!"
}

# Função para aguardar o Redis estar pronto
wait_for_redis() {
    echo "Aguardando Redis estar pronto..."
    while ! redis-cli -h redis ping > /dev/null 2>&1; do
        sleep 1
    done
    echo "Redis está pronto!"
}

# Aguardar serviços estarem prontos
wait_for_postgres
wait_for_redis

# Iniciar a aplicação
echo "Iniciando aplicação..."
exec node src/app.js 