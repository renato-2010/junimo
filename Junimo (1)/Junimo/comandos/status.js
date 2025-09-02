const fs = require('fs');
const caminho = './dados/status.json';

function carregarDados() {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  return JSON.parse(fs.readFileSync(caminho));
}

function salvarDados(dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

module.exports = {
  nome: 'status',

  texto(message, args) {
    let id = message.author.id;

    // Se mencionou alguém, mostra o status dessa pessoa
    if (message.mentions.users.size > 0) {
      id = message.mentions.users.first().id;
    }

    const dados = carregarDados();
    if (!dados[id]) {
      dados[id] = {
        nome: message.guild.members.cache.get(id)?.user.username || 'Desconhecido',
        vida: 100,
        mana: 100,
        sanidade: 100,
        energia: 100
      };
      salvarDados(dados);
    }

    const jogador = dados[id];

    message.reply(
      `📋 **Status de ${jogador.nome}**\n` +
      `❤️ Vida: ${jogador.vida}\n` +
      `🔵 Mana: ${jogador.mana}\n` +
      `🌀 Sanidade: ${jogador.sanidade}\n` +
      `⚡ Energia: ${jogador.energia}`
    );
  }
};
