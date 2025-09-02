
{const { criarEmbed } = require('../utils');const fs = 
  
  require('fs');
const caminho = './dados/jogadores.json';

function carregarDados() {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  return JSON.parse(fs.readFileSync(caminho));
}

function salvarDados(dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

function calcularNivel(pontos) {
  const niveis = [
    { nome: "Cobre", minimo: 0 },
    { nome: "Ferro", minimo: 100 },
    { nome: "Ouro", minimo: 300 },
    { nome: "Diamante", minimo: 500 },
    { nome: "Obsidiana", minimo: 700 },
    { nome: "Adamantium", minimo: 900},
  {nome: "Platina", minimo: 1000},
  {nome: "Celestial", minimo: 2000}
  ];

  // Retorna o nível com maior "minimo" que for menor ou igual aos pontos
  return niveis.reverse().find(n => pontos >= n.minimo).nome;
}

module.exports = {
  nome: 'perfil',

  async slash(interaction) {
    const id = interaction.user.id;
    const dados = carregarDados();
    if (!dados[id]) {
      dados[id] = {
        nome: interaction.user.username,
        dinheiro: 0,
        pontos: 0
      };
      salvarDados(dados);
    }
    const jogador = dados[id];
    const nivel = calcularNivel(jogador.pontos);

    await interaction.reply(
      `👤 ${jogador.nome}\n💰 Dinheiro: ${jogador.dinheiro}\n🏅 Pontos: ${jogador.pontos}\n🎖️ Nível: ${nivel}`
    );
  },

  texto(message, args) {
    const id = message.author.id;
    const dados = carregarDados();
    if (!dados[id]) {
      dados[id] = {
        nome: message.author.username,
        dinheiro: 0,
        pontos: 0
      };
      salvarDados(dados);
    }
    const jogador = dados[id];
    const nivel = calcularNivel(jogador.pontos);

    message.reply(
      `👤 ${jogador.nome}\n💰 Dinheiro: ${jogador.dinheiro}\n🏅 Pontos: ${jogador.pontos}\n🎖️ Nível: ${nivel}`
    );
  }
};}