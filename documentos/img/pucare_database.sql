-- Tabela: Usuario
CREATE TABLE Usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    apelido VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL
);

-- Tabela: Torneio
CREATE TABLE Torneio (
    id_torneio SERIAL PRIMARY KEY,
    id_loja INT, -- Usuario admin
    nome VARCHAR(100) NOT NULL,
    torment_rel VARCHAR(50) NOT NULL, -- tipo do torneio
    status VARCHAR(20) NOT NULL,
    pontuacao_vitoria INT DEFAULT 3,
    pontuacao_bye INT DEFAULT 0,
    qnt_rodadas INT NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP,

    CONSTRAINT fk_torneio_usuario FOREIGN KEY (id_loja) REFERENCES Usuario(id_usuario)
);

-- Tabela: Inscricao
CREATE TABLE Inscricao (
    id_inscricao SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_torneio INT NOT NULL,
    deck VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    data_inscricao TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_inscricao_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT fk_inscricao_torneio FOREIGN KEY (id_torneio) REFERENCES Torneio(id_torneio)
);

-- Tabela: Ranking
CREATE TABLE Ranking (
    id_ranking SERIAL PRIMARY KEY,
    id_torneio INT NOT NULL,
    id_usuario INT NOT NULL,
    vitorias INT DEFAULT 0,
    empates INT DEFAULT 0,
    derrotas INT DEFAULT 0,
    byes INT DEFAULT 0,
    pontuacao_total INT DEFAULT 0,
    buchholz INT DEFAULT 0,
    sonneborn_berger INT DEFAULT 0,

    CONSTRAINT fk_ranking_torneio FOREIGN KEY (id_torneio) REFERENCES Torneio(id_torneio),
    CONSTRAINT fk_ranking_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- Tabela: Rodada
CREATE TABLE Rodada (
    id_rodada SERIAL PRIMARY KEY,
    numero INT NOT NULL,
    id_torneio INT NOT NULL,
    status VARCHAR(20) NOT NULL,

    CONSTRAINT fk_rodada_torneio FOREIGN KEY (id_torneio) REFERENCES Torneio(id_torneio)
);

-- Tabela: Mesa
CREATE TABLE Mesa (
    id_mesa SERIAL PRIMARY KEY,
    id_rodada INT NOT NULL,
    numero_mesa INT NOT NULL,
    time_vencedor VARCHAR(10),
    pontuacao_time1 INT DEFAULT 0,
    pontuacao_time2 INT DEFAULT 0,

    CONSTRAINT fk_mesa_rodada FOREIGN KEY (id_rodada) REFERENCES Rodada(id_rodada)
);

-- Tabela: MesaJogador
CREATE TABLE MesaJogador (
    id_mesa INT NOT NULL,
    id_usuario INT NOT NULL,
    time INT NOT NULL,

    PRIMARY KEY (id_mesa, id_usuario),
    CONSTRAINT fk_mesajogador_mesa FOREIGN KEY (id_mesa) REFERENCES Mesa(id_mesa),
    CONSTRAINT fk_mesajogador_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);
