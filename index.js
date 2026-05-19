const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'views')));
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'troque_esta_chave_para_uma_secreta', 
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));

const conexao = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'Quadras'
});

conexao.connect(function(err) {
  if (err) {
    console.error('Erro ao conectar no banco:', err);
    process.exit(1);
  }
  console.log('Banco de Dados Conectado');
});

const Usuario = require('./model/Usuario');
const Agendamento = require('./model/agendamento');


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/cadastro.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'cadastro.html')));
app.get('/agendamento.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'agendamento.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));


app.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});


app.post('/login', (req, res) => {
  const matricula = req.body.matricula;
  const senha = req.body.senha;

  conexao.query('SELECT * FROM usuarios WHERE matricula = ?', [matricula], function(err, results) {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.status(500).send('Erro no servidor');
    }
    if (results.length === 0) {
      return res.status(401).send('Usuário não encontrado');
    }

    const user = results[0];
    bcrypt.compare(senha, user.senha, function(err, same) {
      if (err) {
        console.error('Erro no bcrypt:', err);
        return res.status(500).send('Erro no servidor');
      }
      if (!same) {
        return res.status(401).send('Senha incorreta');
      }

      req.session.user = { matricula: user.matricula, nome: user.nome, tipo: user.tipo };
      res.redirect('/profile');
    });
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.get('/profile', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  const u = req.session.user;
  const html = `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Perfil</title><link rel="stylesheet" href="style.css"></head><body>
    <div class="banner"><div class="logo"><img src="logo-ifrs.png" alt="Logo do IFRS"></div><div class="titulo">Sistema de Agendamento IFRS</div></div>
    <div class="menu"><a href="index.html">🏠 Início</a><a href="cadastro.html">🔐 Login</a><a href="agendamento.html">📅 Agendamento</a><a href="/horarios">⏰ Horários</a></div>
    <div class="container">
      <h2>Meu Perfil</h2>
      <p><strong>Nome:</strong> ${u.nome}</p>
      <p><strong>Matrícula:</strong> ${u.matricula}</p>
      <p><strong>Tipo:</strong> ${u.tipo}</p>
      <p><a class="btn-voltar" href="index.html">Voltar</a></p>
    </div>
    <script src="/js/session.js"></script>
  </body></html>`;
  res.send(html);
});


app.post('/salvarusuario', function (req, res) {
  const u = new Usuario();
  u.matricula = req.body.matricula;
  u.nome = req.body.nome;
  u.tipo = req.body.tipo;
  const plainSenha = req.body.senha || '';

  bcrypt.hash(plainSenha, 10, function(err, hash) {
    if (err) {
      console.error('Erro ao gerar hash:', err);
      return res.status(500).send('Erro no servidor');
    }
    u.senha = hash;
    u.inserir(conexao, function(err) {
      if (err) {
        console.error('Erro inserindo usuário:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).send('Matrícula já cadastrada. Faça login usando a página de Login.');
        }
        return res.status(500).send('Erro ao salvar usuário');
      }

      res.redirect(`/resposta?op=usuario&matricula=${encodeURIComponent(u.matricula)}&nome=${encodeURIComponent(u.nome)}&tipo=${encodeURIComponent(u.tipo)}&novo=1`);

    });
  });
});


app.post('/salvaragendamento', function (req, res) {
  const a = new Agendamento();
  a.matricula_usuario = req.body.matricula_usuario;

  a.id_quadra = parseInt(req.body.id_quadra, 10);
  a.data = req.body.data;
  a.horario = req.body.horario;
  a.observacoes = req.body.observacoes;

  if (!a.id_quadra || isNaN(a.id_quadra)) {
    return res.status(400).send('Selecione uma quadra válida.');
  }

  conexao.query('SELECT * FROM usuarios WHERE matricula = ?', [a.matricula_usuario], function(err, users) {
    if (err) {
      console.error('Erro na validação da matrícula:', err);
      return res.status(500).send('Erro ao validar matrícula');
    }
    if (users.length === 0) {
      return res.status(400).send('Matrícula não cadastrada. Faça o cadastro antes de agendar.');
    }

    conexao.query('SELECT * FROM quadras WHERE id_quadra = ?', [a.id_quadra], function(err, quadras) {
      if (err) {
        console.error('Erro na validação da quadra:', err);
        return res.status(500).send('Erro ao validar quadra');
      }
      if (quadras.length === 0) {
        return res.status(400).send('Quadra inválida. Selecione uma quadra existente.');
      }


      a.inserir(conexao, function(err, result) {
        if (err) {
          console.error('Erro inserindo agendamento:', err);

          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Já existe um agendamento para esta matrícula nessa data/horário.');
          }
          return res.status(500).send('Erro ao salvar agendamento: ' + (err.code || err.message));
        }
       
        const nomeQuadra = quadras[0].nome_quadra || '';
        res.redirect(`/resposta?op=agendamento&matricula=${encodeURIComponent(a.matricula_usuario)}&data=${encodeURIComponent(a.data)}&horario=${encodeURIComponent(a.horario)}&quadra=${encodeURIComponent(nomeQuadra)}`);
      });

    }); 

  }); 
});


app.post('/agendamento/cancelar', function (req, res) {
  const matricula = req.body.matricula;
  const data = req.body.data;
  let horario = req.body.horario || '';
  if (horario.length === 5) horario = horario + ':00';

  conexao.query(
    'UPDATE agendamentos SET status = ? WHERE matricula_usuario = ? AND data = ? AND horario = ?',
    ['cancelado', matricula, data, horario],
    function (err, result) {
      if (err) {
        console.error('Erro ao cancelar agendamento:', err);
        return res.status(500).send('Erro ao cancelar agendamento');
      }
      res.redirect('/horarios');
    }
  );
});


app.get('/horarios', function (req, res) {
  conexao.query(
    "SELECT a.*, q.nome_quadra FROM agendamentos a LEFT JOIN quadras q ON a.id_quadra = q.id_quadra ORDER BY a.data DESC, a.horario",
    function (err, resultados) {
      if (err) {
        console.error(err);
        return res.status(500).send('Erro ao buscar agendamentos');
      }

      const user = (req.session && req.session.user) ? req.session.user : null;
      const usuarioTopoHtml = user
        ? `<div class="usuario-topo">Olá, ${user.nome} (${user.tipo}) <a href="/profile" class="btn-link">Perfil</a> <a href="/logout" class="btn-sair">Sair</a></div>`
        : '';

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const futuros = [];
      const passados = [];

      resultados.forEach(a => {

const dataStr = (a.data instanceof Date) ? a.data.toISOString().split('T')[0] : a.data;
const dataAg = new Date(dataStr + "T00:00:00");

if (dataAg.getTime() >= hoje.getTime()) {
  futuros.push(a);
} else {
  passados.push(a);
}

      });

function montaTabela(agendamentos, incluirAcoes) {
  let html = `<table class="tabela-agendamentos"><thead><tr>
      <th>Data</th><th>Horário</th><th>Matrícula</th><th>Quadra</th><th>Observações</th><th>Status</th>`;
  if (incluirAcoes) html += `<th>Ações</th>`;
  html += `</tr></thead><tbody>`;

  agendamentos.forEach(a => {

    const dataStr = a.data instanceof Date ? a.data.toISOString().split('T')[0] : a.data;
    const horarioStr = (typeof a.horario === 'string') ? a.horario.slice(0, 5) : (a.horario ? String(a.horario).slice(0,5) : '');

    const dataAg = new Date(dataStr + "T00:00:00");

    const isCancelled = a.status === 'cancelado';
    let statusFinal = a.status || '';

    if (statusFinal === 'ativo' && dataAg.getTime() < hoje.getTime()) {
      statusFinal = 'concluído';
    }

    html += `<tr>
      <td>${dataStr}</td>
      <td>${horarioStr}</td>
      <td>${a.matricula_usuario}</td>
      <td>${a.nome_quadra || ''}</td>
      <td>${a.observacoes || ''}</td>
      <td>${statusFinal}</td>`;

    if (incluirAcoes) {
      html += `<td>`;
      if (!isCancelled) {
        html += `
          <form method="GET" action="/agendamento/editar" style="margin-bottom:6px;">
            <input type="hidden" name="matricula" value="${a.matricula_usuario}">
            <input type="hidden" name="data" value="${dataStr}">
            <input type="hidden" name="horario" value="${horarioStr}">
            <button class="btn-editar" type="submit">Alterar</button>
          </form>
          <form method="POST" action="/agendamento/cancelar">
            <input type="hidden" name="matricula" value="${a.matricula_usuario}">
            <input type="hidden" name="data" value="${dataStr}">
            <input type="hidden" name="horario" value="${horarioStr}">
            <button class="btn-cancelar" type="submit">Cancelar</button>
          </form>
        `;
      } else {
        html += `—`;
      }
      html += `</td>`;
    }

    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

      let html = `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Horários</title><link rel="stylesheet" href="style.css"></head><body>
      <div class="banner"><div class="logo"><img src="logo-ifrs.png" alt="Logo IFRS"></div>
      <div class="titulo">Sistema de Agendamento IFRS</div>${usuarioTopoHtml}</div>
      <div class="menu"><a href="index.html">🏠 Início</a><a href="cadastro.html">🔐 Login</a>
      <a href="agendamento.html">📅 Agendamento</a><a href="/horarios" class="active">⏰ Horários</a></div>
      <div class="container container-horarios">`;

      html += `<h2>Próximos Agendamentos</h2>`;
      html += futuros.length > 0 ? montaTabela(futuros, true) : `<p>Não há próximos agendamentos.</p>`;

      html += `<h2>Histórico de Agendamentos</h2>`;
      html += passados.length > 0 ? montaTabela(passados, false) : `<p>Não há agendamentos passados.</p>`;

      html += `</div><div class="btn-voltar-container">
      <a href="index.html" class="btn-voltar">⬅ Voltar para o Início</a></div>
      <script src="/js/session.js"></script></body></html>`;

      res.send(html);
    }
  );
});


app.get('/agendamento/editar', function (req, res) {
  const matricula = req.query.matricula;
  const data = req.query.data;
  let horario = req.query.horario || '';
  if (horario.length === 5) horario = horario + ':00';

  conexao.query('SELECT * FROM agendamentos WHERE matricula_usuario = ? AND data = ? AND horario = ?', [matricula, data, horario], function (err, results) {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao buscar agendamento');
    }
    if (results.length === 0) return res.status(404).send('Agendamento não encontrado');

    const a = results[0];
    const dataStr = a.data instanceof Date ? a.data.toISOString().split('T')[0] : a.data;
    const horarioStr = (typeof a.horario === 'string') ? a.horario.slice(0,5) : a.horario;

    conexao.query('SELECT id_quadra, nome_quadra FROM quadras ORDER BY nome_quadra', function(err, quadrasRes) {
      if (err) return res.status(500).send('Erro ao buscar quadras');

      let optionsHtml = '';
      quadrasRes.forEach(q => {
        const selAttr = (q.id_quadra === a.id_quadra) ? 'selected' : '';
        optionsHtml += `<option value="${q.id_quadra}" ${selAttr}>${q.nome_quadra}</option>`;
      });

      const html = `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Editar Agendamento</title><link rel="stylesheet" href="style.css"></head><body>
        <div class="container"><h2>Editar Agendamento</h2>
        <form method="POST" action="/agendamento/editar">
          <input type="hidden" name="matricula" value="${a.matricula_usuario}">
          <input type="hidden" name="oldData" value="${dataStr}">
          <input type="hidden" name="oldHorario" value="${horarioStr}">

          <label>Matrícula:</label>
          <input type="text" value="${a.matricula_usuario}" readonly>

          <label>Quadra:</label>
          <select name="id_quadra" required>
            ${optionsHtml}
          </select>

          <label>Data:</label>
          <input type="date" name="data" value="${dataStr}" required>

          <label>Horário:</label>
          <input type="time" name="horario" value="${horarioStr}" required>

          <label>Observações:</label>
          <textarea name="observacoes" rows="3">${a.observacoes || ''}</textarea>

          <button type="submit">Salvar alterações</button>
          <a href="/horarios" style="margin-left:10px;">Cancelar</a>
        </form></div><script src="/js/session.js"></script></body></html>`;

      res.send(html);
    });
  });
});

app.post('/agendamento/editar', function (req, res) {
  const matricula = req.body.matricula;
  const oldData = req.body.oldData;
  let oldHorario = req.body.oldHorario || '';
  const id_quadra = parseInt(req.body.id_quadra, 10);
  const data = req.body.data;
  let horario = req.body.horario || '';
  const observacoes = req.body.observacoes;

  if (oldHorario.length === 5) oldHorario = oldHorario + ':00';
  if (horario.length === 5) horario = horario + ':00';

  conexao.query(
    'UPDATE agendamentos SET id_quadra = ?, data = ?, horario = ?, observacoes = ? WHERE matricula_usuario = ? AND data = ? AND horario = ?',
    [id_quadra, data, horario, observacoes, matricula, oldData, oldHorario],
    function (err, result) {
      if (err) {
        console.error('Erro ao atualizar agendamento:', err);
        return res.status(500).send('Erro ao atualizar agendamento: ' + (err.code || err.message));
      }
      res.redirect('/horarios');
    }
  );
});

app.get('/resposta', function(req, res) {
  const op = req.query.op || '';
  let titulo = 'Operação concluída';
  let mensagem = '';
  let detalhes = '';

if (op === 'usuario') {
  titulo = 'Cadastro concluído';
  if (req.query.novo === '1') {
    mensagem = 'Usuário cadastrado com sucesso. Agora faça login para acessar o sistema.';
  } else {
    mensagem = 'Usuário cadastrado com sucesso.';
  }
  detalhes = `<p><strong>Nome:</strong> ${req.query.nome || ''}</p><p><strong>Matrícula:</strong> ${req.query.matricula || ''}</p><p><strong>Tipo:</strong> ${req.query.tipo || ''}</p>`;
}
 else if (op === 'agendamento') {
    titulo = 'Agendamento salvo';
    mensagem = 'Seu agendamento foi registrado com sucesso.';
    detalhes = `<p><strong>Matrícula:</strong> ${req.query.matricula || ''}</p><p><strong>Quadra:</strong> ${req.query.quadra || ''}</p><p><strong>Data:</strong> ${req.query.data || ''}</p><p><strong>Horário:</strong> ${req.query.horario || ''}</p>`;
  } else {
    mensagem = 'A operação foi concluída.';
  }

  const html = `<!DOCTYPE html><html lang="pt-br"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Resposta</title><link rel="stylesheet" href="style.css"></head><body>
    <div class="banner"><div class="logo"><img src="logo-ifrs.png" alt="Logo IFRS"></div><div class="titulo">Sistema de Agendamento IFRS</div></div>
    <div class="menu"><a href="index.html">🏠 Início</a><a href="cadastro.html">🔐 Login</a><a href="agendamento.html">📅 Agendamento</a><a href="/horarios">⏰ Horários</a></div>
    <div class="container">
      <h2>${titulo}</h2>
      <p class="mensagem-sucesso">${mensagem}</p>
      <div class="detalhes-resposta">${detalhes}</div>
      <p>O que você quer fazer agora?</p>
      <p>
        <a class="btn-voltar" href="index.html">Voltar ao Início</a>
        <a class="btn-voltar" href="/horarios" style="margin-left:10px;">Ver Horários</a>
        ${op === 'agendamento' ? '<a class="btn-voltar" href="agendamento.html" style="margin-left:10px;">Fazer outro agendamento</a>' : ''}
        ${op === 'usuario' ? '<a class="btn-voltar" href="login.html" style="margin-left:10px;">Ir para Login</a>' : ''}
      </p>
    </div>
    <script src="/js/session.js"></script>
  </body></html>`;
  res.send(html);
});

app.get('/quadras', function (req, res) {
  if (!req.session.user || req.session.user.tipo !== 'servidor') {
    return res.status(403).send('Acesso negado. Apenas servidores podem acessar.');
  }

  conexao.query('SELECT * FROM quadras ORDER BY nome_quadra', function (err, results) {
    if (err) return res.status(500).send('Erro ao buscar quadras');

    let html = `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Quadras</title><link rel="stylesheet" href="style.css"></head><body>
      <div class="banner"><div class="logo"><img src="logo-ifrs.png" alt="Logo IFRS"></div><div class="titulo">Sistema de Agendamento IFRS</div></div>
      <div class="menu"><a href="index.html">🏠 Início</a><a href="cadastro.html">🔐 Login</a><a href="agendamento.html">📅 Agendamento</a><a href="/horarios">⏰ Horários</a><a href="/quadras" class="active">🏟 Quadras</a></div>
      <div class="container">
        <h2>Gerenciar Quadras</h2>
        <table class="tabela-agendamentos">
          <thead><tr><th>Nome</th><th>Descrição</th><th>Ações</th></tr></thead>
          <tbody>`;

    results.forEach(q => {
      html += `<tr>
        <td>${q.nome_quadra}</td>
        <td>${q.descricao || ''}</td>
        <td>
          <form method="POST" action="/quadras/deletar" style="display:inline">
            <input type="hidden" name="id_quadra" value="${q.id_quadra}">
            <button class="btn-cancelar" type="submit">Excluir</button>
          </form>
        </td>
      </tr>`;
    });

    html += `</tbody></table>
      <h3>Adicionar Nova Quadra</h3>
      <form method="POST" action="/quadras/adicionar">
        <label>Nome:</label><input type="text" name="nome_quadra" required>
        <label>Descrição:</label><textarea name="descricao" required></textarea>
        <button type="submit">Adicionar</button>
      </form>
      </div><script src="/js/session.js"></script></body></html>`;

    res.send(html);
  });
});

app.post('/quadras/adicionar', function (req, res) {
  if (!req.session.user || req.session.user.tipo !== 'servidor') {
    return res.status(403).send('Acesso negado');
  }
  const nome = req.body.nome_quadra;
  const desc = req.body.descricao;
  conexao.query('INSERT INTO quadras (nome_quadra, descricao) VALUES (?, ?)', [nome, desc], function (err) {
    if (err) {
      console.error('Erro ao adicionar quadra:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).send('Já existe uma quadra com esse nome.');
      }
      return res.status(500).send('Erro ao adicionar quadra: ' + err.message);
    }
    res.redirect('/quadras');
  });
});

app.post('/quadras/deletar', function (req, res) {
  if (!req.session.user || req.session.user.tipo !== 'servidor') {
    return res.status(403).send('Acesso negado');
  }
  const id = parseInt(req.body.id_quadra, 10);
  if (!id || isNaN(id)) return res.status(400).send('ID inválido');

  conexao.query('DELETE FROM quadras WHERE id_quadra = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao excluir quadra:', err);
      return res.status(500).send('Erro ao excluir quadra: ' + err.message);
    }
    res.redirect('/quadras');
  });
});

app.get('/quadras/lista', function (req, res) {
  conexao.query('SELECT id_quadra, nome_quadra, descricao FROM quadras ORDER BY nome_quadra', function (err, results) {
    if (err) {
      console.error('Erro em /quadras/lista:', err);
      return res.status(500).json([]);
    }
    res.json(results);
  });
});


const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
