# Configuração do CORS

## Como configurar as origens permitidas

A API agora suporta configuração flexível de CORS através da variável de ambiente `ALLOWED_ORIGINS`.

### Configuração no arquivo .env

Adicione a seguinte linha ao seu arquivo `.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://meusite.com,http://app.meudominio.com
```

### Formato da variável ALLOWED_ORIGINS

- **Separar URLs por vírgula**: `http://localhost:3000,https://meusite.com`
- **Incluir protocolo**: Sempre inclua `http://` ou `https://`
- **Incluir porta se necessário**: `http://localhost:3000`
- **Suporta subdomínios**: `https://app.meudominio.com`

### Exemplos de configuração

#### Desenvolvimento local:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080
```

#### Produção com múltiplos domínios:
```env
ALLOWED_ORIGINS=https://meusite.com,https://app.meusite.com,https://admin.meusite.com
```

#### Permitir todos os domínios (NÃO RECOMENDADO para produção):
```env
ALLOWED_ORIGINS=*
```

### Comportamento padrão

Se a variável `ALLOWED_ORIGINS` não estiver definida, a API permitirá automaticamente:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:8080`

### Logs de CORS

A API irá logar no console quando uma origem for bloqueada pelo CORS:
```
CORS bloqueado para origem: https://site-nao-permitido.com
```

### Recursos habilitados

- ✅ Credenciais (cookies, headers de autenticação)
- ✅ Métodos: GET, POST, PUT, DELETE, OPTIONS
- ✅ Headers: Content-Type, Authorization, X-Requested-With
- ✅ Requisições sem origin (aplicações mobile, Postman)

### Reiniciar o servidor

Após alterar a variável `ALLOWED_ORIGINS`, reinicie o servidor para aplicar as mudanças:

```bash
npm start
# ou
node src/app.js
``` 