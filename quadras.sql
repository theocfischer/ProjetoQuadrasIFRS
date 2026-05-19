DROP TABLE IF EXISTS agendamentos;
DROP TABLE IF EXISTS quadras;
DROP TABLE IF EXISTS usuarios;

CREATE DATABASE IF NOT EXISTS Quadras;
USE Quadras;

CREATE TABLE IF NOT EXISTS usuarios (
  matricula VARCHAR(20) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  senha VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quadras (
  id_quadra INT AUTO_INCREMENT PRIMARY KEY,
  nome_quadra VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS agendamentos (
  id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
  matricula_usuario VARCHAR(20) NOT NULL,
  id_quadra INT NOT NULL,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'ativo',
  UNIQUE KEY uq_agendamento (matricula_usuario, data, horario),
  FOREIGN KEY (matricula_usuario) REFERENCES usuarios(matricula),
  FOREIGN KEY (id_quadra) REFERENCES quadras(id_quadra)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO usuarios (matricula, nome, tipo, senha)
VALUES ('2025001', 'João Silva', 'estudante', '1234')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO quadras (nome_quadra, descricao)
VALUES ('Quadra 1', 'Quadra coberta poliesportiva')
ON DUPLICATE KEY UPDATE descricao = VALUES(descricao);

INSERT INTO agendamentos (matricula_usuario, id_quadra, data, horario, observacoes)
SELECT '2025001', q.id_quadra, '2025-09-15', '14:00:00', 'Partida de futsal'
FROM quadras q
WHERE q.nome_quadra = 'Quadra 1'
ON DUPLICATE KEY UPDATE observacoes = VALUES(observacoes);
