// Este script consulta /session e, se houver usuário logado,
// adiciona um bloco no banner com nome, link para perfil e botão sair,
// e adiciona "Quadras" ao menu se o usuário for servidor.
document.addEventListener('DOMContentLoaded', function () {
  fetch('/session').then(r => r.json()).then(data => {
    if (!data || !data.loggedIn) return;

    const user = data.user;
    // adiciona bloco no banner
    const banner = document.querySelector('.banner');
    if (banner && !document.querySelector('.usuario-topo')) {
      const div = document.createElement('div');
      div.className = 'usuario-topo';
      div.innerHTML = `<span class="usuario-nome">Olá, ${user.nome} (${user.tipo})</span> <a href="/profile" class="btn-link">Perfil</a> <a href="/logout" class="btn-sair">Sair</a>`;
      banner.appendChild(div);
    }

    // se for servidor, adiciona link Quadras no menu (se ainda não existir)
    const menu = document.querySelector('.menu');
if (menu && user.tipo === 'servidor' && !menu.querySelector('a[href="/quadras"]')) {
  const a = document.createElement('a');
  a.href = '/quadras';
  a.textContent = '🏟 Quadras';
  menu.appendChild(a);
}

  }).catch(err => {
    console.error('Erro fetch /session', err);
  });
});
