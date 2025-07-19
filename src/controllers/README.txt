Adapte sua tabela infogeral para o fluxo de autenticação por telefone + código:

-- Altere o campo confirm_code para acomodar o JWT (que tem ~150+ caracteres)
ALTER TABLE infogeral ALTER COLUMN confirm_code TYPE VARCHAR(255);

-- Se o campo não existir, crie-o:
-- ALTER TABLE infogeral ADD COLUMN confirm_code VARCHAR(255);

Fluxo:
- Cadastro: POST /auth/register { humannumber, municipio, instance, ... }
- Geração de código: POST /code/generate { humannumber, webhook_url }
- Login: POST /auth/login { humannumber, code }

Você pode usar o CRUD genérico para as tabelas:
- funcionarios
- infogeral
- informacoes_to_vector
- n8n_chat_histories_dados_ia
- n8n_chat_histories_informacoes_ia
- usuarios 