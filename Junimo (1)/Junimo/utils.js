const { EmbedBuilder } = require('discord.js');

function criarEmbed(titulo, descricao, cor = 0x00AEFF) {
  return new EmbedBuilder()
    .setTitle(titulo)
    .setDescription(descricao)
    .setColor("499fd9");
}

module.exports = { criarEmbed };