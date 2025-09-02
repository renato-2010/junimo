// comandos/inventario.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const dadosPath = path.join(__dirname, '../dados/inventarios.json');

function carregarJSON(caminho) {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
}

module.exports = {
  nome: 'inventario',
  texto(msg, args) {
    const membro = msg.mentions.users.first() || msg.author;
    const inventarios = carregarJSON(dadosPath);
    const inventario = inventarios[membro.id] || {};

    let totalItens = Object.values(inventario).reduce((a, b) => a + b, 0);
    let texto = '';

    for (const [item, qtd] of Object.entries(inventario)) {
      texto += `- ${item} x${qtd}\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📦 Inventário de ${membro.username} (${totalItens}/10 itens)`)
      .setDescription(texto || 'Inventário vazio')
      .setColor('Blue');

    msg.channel.send({ embeds: [embed] });
  }
};
