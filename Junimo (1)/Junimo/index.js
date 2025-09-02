// ---------------------------
// Módulos e Configurações
// ---------------------------
const fs = require('fs');
const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token, prefix } = require('./config.json');

// ---------------------------
// Servidor Express para ping
// ---------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot online!'));
app.listen(PORT, () => console.log(`Servidor pingável iniciado na porta ${PORT}`));

// ---------------------------
// Configuração do Discord
// ---------------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.comandos = new Collection();

// Carrega comandos da pasta /comandos
const comandosArquivos = fs.readdirSync('./comandos').filter(arquivo => arquivo.endsWith('.js'));
for (const arquivo of comandosArquivos) {
  const comando = require(`./comandos/${arquivo}`);
  client.comandos.set(comando.nome, comando);
}

// ---------------------------
// Eventos do bot
// ---------------------------

// Quando o bot estiver pronto
client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

// Comandos de barra (slash)
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const comando = client.comandos.get(interaction.commandName);
  if (!comando) return;

  try {
    if (comando.slash) await comando.slash(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Erro ao executar o comando!', ephemeral: true });
  }
});

// Comandos com prefixo
client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const nomeComando = args.shift().toLowerCase();
  const comando = client.comandos.get(nomeComando);

  if (!comando) return;

  try {
    if (comando.texto) comando.texto(message, args);
  } catch (error) {
    console.error(error);
    message.reply('Erro ao executar o comando!');
  }
});

// ---------------------------
// Passa o client para comandos que precisam
// ---------------------------
if (fs.existsSync('./comandos/bestiario.js')) {
  require('./comandos/bestiario')(client);
}

// ---------------------------
// Login do bot
// ---------------------------
client.login('MTM4ODIyODg1OTg4MjYzNTQ0OA.G0CCem.2hWioqbUaHdclwAPJvjmRv4L3yRTUH7XCYkiuM');



