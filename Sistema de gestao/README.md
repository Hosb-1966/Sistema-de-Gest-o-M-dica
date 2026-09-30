# Sistema de Gestão Médica Integrada — Painel Clínico & Call Center

Sistema web moderno e responsivo para gestão clínica hospitalar, escala médica operacional, controle de remarcações, grade de exames/consultas, intranet institucional de procedimentos e controle de acessos por permissões.

---

## 🚀 Funcionalidades Principais

- **Autenticação & Controle de Acessos (RBAC):**
  - Perfil **Administrador** com permissão exclusiva de edição, criação e exclusão.
  - Perfil **Usuário/Atendimento** em modo de consulta com liberação pontual por página definida pelo Administrador.
  - Painel de gerenciamento de permissões de usuários.
- **Módulo Gestão:**
  - **Dashboard:** Métricas e visão geral da clínica.
  - **Operacional:** Escala de consultórios e períodos (Manhã / Tarde), status de vagas e desmontados.
  - **Remarcações:** Gerenciamento ágil de reagendamentos de pacientes com filtros e status.
  - **Equipe Médica:** Cadastro completo de médicos, especialidades e dados de contato.
- **Módulo Call Center:**
  - **Consultas & Exames:** Grades semanais de médicos por consultório/sala com padronização visual e suporte a vagas.
  - **Intranet:** Base de conhecimento oficial de procedimentos, scripts de atendimento, regras de convênios e preparo de exames.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion, Recharts
- **Bundler:** Vite
- **Banco de Dados:** Supabase (PostgreSQL) com persistência e fallback local

---

## 📦 Como Rodar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (Opcional para Supabase)
Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
```
> *Nota: O sistema possui fallback automático caso as credenciais do Supabase não sejam fornecidas.*

### 4. Executar em modo desenvolvimento
```bash
npm run dev
```
O projeto estará disponível em: `http://localhost:3000` (ou na porta indicada pelo Vite).

### 5. Compilar para Produção
```bash
npm run build
```

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

Para inicializar as tabelas no Supabase:
1. Acesse o painel do seu projeto no [Supabase](https://supabase.com).
2. Vá em **SQL Editor**.
3. Execute o script contido no arquivo `supabase_schema.sql` deste repositório.

---

## 🔐 Acessos Iniciais Padrão

- **Administrador:**
  - Usuário: `admin`
  - Senha: `admin123`
- **Operador (Atendimento):**
  - Usuário: `atendimento`
  - Senha: `user123`
