const fs = require('fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const caminhoItens = './dados/itens.json';
const caminhoAleatorio = './dados/aleatorio.json';
const caminhoInventarios = './dados/inventarios.json';

function carregarJSON(caminho) {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

module.exports = {
  nome: 'aleatorio',
  descricao: 'Sistema de aleatório com botões para pegar itens',

  async texto(message, args) {
    const itens = carregarJSON(caminhoItens);
    const aleatorio = carregarJSON(caminhoAleatorio);
    const inventarios = carregarJSON(caminhoInventarios);

    // ======================
    // Subcomando: adicionar item
    // ======================
    if (args[0] === 'item') {
      const nomeItem = args.slice(1).join(' ');
      if (!nomeItem) {
        return message.reply('❌ Você precisa especificar um item.');
      }

      // verifica se item existe em itens.json
      if (!Object.keys(itens).includes(nomeItem)) {
        return message.reply('❌ Esse item não existe em `itens.json`.');
      }

      // adiciona em aleatorio.json
      if (!aleatorio.itens) aleatorio.itens = [];
      aleatorio.itens.push(nomeItem);
      salvarJSON(caminhoAleatorio, aleatorio);

      return message.reply(`✅ O item **${nomeItem}** foi adicionado ao aleatório.`);
    }

    // ======================
    // Subcomando: mostrar menu aleatório
    // ======================
    if (!aleatorio.itens || aleatorio.itens.length === 0) {
      return message.reply('❌ Nenhum item disponível no aleatório.');
    }

    // Criar os botões dinamicamente
    const botoes = new ActionRowBuilder();
    aleatorio.itens.forEach((item, index) => {
      botoes.addComponents(
        new ButtonBuilder()
          .setCustomId(`aleatorio_${index}`)
          .setLabel(item.slice(0, 80))
          .setStyle(ButtonStyle.Success)
      );
    });

    const embed = new EmbedBuilder()
      .setTitle("🎲 Itens Aleatórios")
      .setDescription("Clique em um botão para coletar o item correspondente!")
      .setColor("Green");

    const msg = await message.channel.send({ embeds: [embed], components: [botoes] });

    // Criar coletor
    const collector = msg.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', async i => {
      if (!i.customId.startsWith("aleatorio_")) return;

      const index = parseInt(i.customId.split("_")[1]);
      const item = aleatorio.itens[index];
      if (!item) return;

      // adicionar ao inventario
      if (!inventarios[i.user.id]) inventarios[i.user.id] = [];
      inventarios[i.user.id].push(item);
      salvarJSON(caminhoInventarios, inventarios);

      await i.reply({ content: `✅ Você recebeu **${item}** e ele foi adicionado ao seu inventário!`, flags: 64 });
    });

    collector.on('end', () => {
      const desativados = new ActionRowBuilder().addComponents(
        botoes.components.map(btn => btn.setDisabled(true))
      );
      msg.edit({ components: [desativados] }).catch(() => {});
    });
  }
};
