const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const prefix = '*';
const jogadoresPath = path.join(__dirname, '../dados/jogadores.json');  // guarda dinheiro dos usuários
const bauStatusPath = path.join(__dirname, '../dados/bauStatus.json');  // guarda status do baú

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  return JSON.parse(fs.readFileSync(caminho));
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// Garante que o arquivo de status do baú tenha a chave 'disponivel'
function inicializarBauStatus() {
  let status = lerJSON(bauStatusPath);
  if (typeof status.disponivel !== 'boolean') {
    status = { disponivel: false };
    salvarJSON(bauStatusPath, status);
  }
  return status;
}

// Comando para gerar o baú
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift().toLowerCase();

  if (comando === 'bau') {
    let bauStatus = inicializarBauStatus();
    bauStatus.disponivel = true;
    salvarJSON(bauStatusPath, bauStatus);

    const embed = new EmbedBuilder()
      .setTitle('🎉 Um baú apareceu!')
      .setDescription('Clique no botão abaixo para resgatar o prêmio. Apenas um usuário poderá resgatar!')
      .setImage('https://cdn.discordapp.com/attachments/1329431007522328680/1404059437177765948/18_Sem_Titulo_20250810081052.png');

    const button = new ButtonBuilder()
      .setCustomId('resgatar_bau')
      .setLabel('Resgatar')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// Evento do botão
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'resgatar_bau') {
    let bauStatus = inicializarBauStatus();

    if (!bauStatus.disponivel) {
      return interaction.reply({ content: '❌ O baú já foi esvaziado por outro usuário.', flags: 64 });
    }

    const jogadores = lerJSON(jogadoresPath);
    const userId = interaction.user.id;
    const premioDinheiro = 25; // prêmio fixo

    if (!jogadores[userId]) {
      jogadores[userId] = { dinheiro: 0 };
    }

    // Atualiza status do baú antes de salvar
    bauStatus.disponivel = false;
    salvarJSON(bauStatusPath, bauStatus);

    jogadores[userId].dinheiro += premioDinheiro;
    salvarJSON(jogadoresPath, jogadores);

    await interaction.reply({ content: `✅ Parabéns! Você foi o primeiro a resgatar o baú e ganhou R$${premioDinheiro}!`, flags: 64 });

    // Desativa botão
    try {
      const message = await interaction.message.fetch();
      const disabledButton = new ButtonBuilder()
        .setCustomId('resgatar_bau')
        .setLabel('Resgatar')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true);

      const row = new ActionRowBuilder().addComponents(disabledButton);
      await message.edit({ components: [row] });
    } catch (err) {
      console.log('Erro ao desativar botão:', err);
    }
  }
});

client.login('MTM4ODIyODg1OTg4MjYzNTQ0OA.G0CCem.2hWioqbUaHdclwAPJvjmRv4L3yRTUH7XCYkiuM');

