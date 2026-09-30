-- Executar no SQL Editor do Supabase (https://supabase.com/dashboard/project/_/sql)

-- 1. Tabela de Remarcações
CREATE TABLE IF NOT EXISTS remarcacoes (
  id TEXT PRIMARY KEY,
  medico TEXT NOT NULL,
  data_remarcacao TEXT NOT NULL,
  dias INTEGER NOT NULL DEFAULT 0,
  qt_pacientes INTEGER NOT NULL DEFAULT 0,
  hora_call TEXT NOT NULL,
  contato TEXT NOT NULL,
  data TEXT NOT NULL,
  prazo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e permitir acesso público/anon para leitura e escrita
ALTER TABLE remarcacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total remarcacoes" ON remarcacoes FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabela de Grade de Consultas
CREATE TABLE IF NOT EXISTS consultas_grid (
  id TEXT PRIMARY KEY,
  slot_key TEXT UNIQUE NOT NULL,
  doctor_name TEXT NOT NULL,
  time_range TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'orange',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE consultas_grid ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total consultas_grid" ON consultas_grid FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabela de Grade de Exames
CREATE TABLE IF NOT EXISTS exames_grid (
  id TEXT PRIMARY KEY,
  slot_key TEXT UNIQUE NOT NULL,
  doctor_name TEXT NOT NULL,
  time_range TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE exames_grid ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total exames_grid" ON exames_grid FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabela de Recesso
CREATE TABLE IF NOT EXISTS recesso_weeks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  consultorios JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE recesso_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total recesso_weeks" ON recesso_weeks FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS recesso_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE recesso_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total recesso_data" ON recesso_data FOR ALL USING (true) WITH CHECK (true);

-- 5. Tabela Operacional (Grade Independente por Unidade e Módulo: Consultas e Exames)
CREATE TABLE IF NOT EXISTS operacional_data (
  id TEXT PRIMARY KEY,
  unit TEXT NOT NULL,
  consultorios JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE operacional_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total operacional_data" ON operacional_data FOR ALL USING (true) WITH CHECK (true);

-- 6. Tabela de Equipe Médica
CREATE TABLE IF NOT EXISTS equipe_medica (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  crm TEXT NOT NULL,
  rqe TEXT,
  celular TEXT,
  faz_exames BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE equipe_medica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total equipe_medica" ON equipe_medica FOR ALL USING (true) WITH CHECK (true);

-- 7. Tabela de Artigos da Intranet
CREATE TABLE IF NOT EXISTS intranet_articles (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  sub_category TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE intranet_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total intranet_articles" ON intranet_articles FOR ALL USING (true) WITH CHECK (true);

-- 8. Tabelas de Colunas (Médicos) das Grades de Consultas e Exames
CREATE TABLE IF NOT EXISTS consultas_columns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE consultas_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total consultas_columns" ON consultas_columns FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS exames_columns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE exames_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total exames_columns" ON exames_columns FOR ALL USING (true) WITH CHECK (true);

-- 9. Tabela de Usuários e Permissões (Logins com permissões por página e controle de edição exclusivo de Administrador)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público total app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);

-- Inserir usuário Administrador inicial
INSERT INTO app_users (id, username, password, name, role, permissions, can_edit)
VALUES (
  'user-admin-default',
  'admin',
  'admin123',
  'Administrador Geral',
  'admin',
  '["dashboard", "operacional", "remarcacoes", "equipe_medica", "consultas", "exames", "intranet"]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

