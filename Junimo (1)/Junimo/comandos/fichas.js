const fs = require('fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const caminhoMenu = './dados/fichas.json';

module.exports = {
  nome: 'fichas',
  descricao: 'Mostra as fichas dos jogadores',

  async texto(message) {
    if (!fs.existsSync(caminhoMenu)) {
      return message.reply("❌ O arquivo `fichas` não foi encontrado.");
    }

    const dados = JSON.parse(fs.readFileSync(caminhoMenu, 'utf-8'));

    // Criar os botões automaticamente a partir do JSON
    const botoes = new ActionRowBuilder();
    Object.keys(dados).forEach((key, index) => {
      botoes.addComponents(
        new ButtonBuilder()
          .setCustomId(key)
          .setLabel((dados[key].titulo || `Opção ${index + 1}`).replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, '').slice(0, 80))
          .setStyle(ButtonStyle.Primary)
      );
    });

    const embed = new EmbedBuilder()
      .setTitle("FICHAS DOS JOGADORES")
      .setDescription("Clique em um dos botões abaixo para ver mais informações sobre eles.")
      .setColor("Blue");

    const msg = await message.channel.send({ embeds: [embed], components: [botoes] });

    // Criar coletor só para essa mensagem
    const collector = msg.createMessageComponentCollector({ time: 5 * 60 * 1000 }); // 5 minutos

    collector.on('collect', async i => {
      if (!dados[i.customId]) return;

      const conteudo = dados[i.customId];
      const embedResposta = new EmbedBuilder()
        .setTitle(String(conteudo.titulo || "Sem título"))
        .setDescription(String(conteudo.descricao || "Sem descrição"))
        .setColor("Random");

      // Enviar resposta no canal (não privada)
      await i.reply({ embeds: [embedResposta], flags: 64 });
    });

    collector.on('end', () => {
      // Desativa botões após coletor expirar
      const desativados = new ActionRowBuilder().addComponents(
        botoes.components.map(btn => btn.setDisabled(true))
      );
      msg.edit({ components: [desativados] }).catch(() => {});
    });
  }
};
