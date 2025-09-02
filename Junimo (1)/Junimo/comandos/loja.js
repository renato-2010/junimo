const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  Events 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const prefix = '*';

const itensPath = path.join(__dirname, '../dados/itens.json');
const jogadoresPath = path.join(__dirname, '../dados/jogadores.json');
const inventariosPath = path.join(__dirname, '../dados/inventarios.json');
const lojaPath = path.join(__dirname, '../dados/loja.json');
const lojaStatusPath = path.join(__dirname, '../dados/lojaStatus.json');

// Funções de leitura e gravação JSON com criação do arquivo se não existir
function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// Funções específicas para lojaStatus
function lerLojaStatus() {
  if (!fs.existsSync(lojaStatusPath)) {
    salvarJSON(lojaStatusPath, { ativa: true });
  }
  return lerJSON(lojaStatusPath);
}

function salvarLojaStatus(dados) {
  salvarJSON(lojaStatusPath, dados);
}

function normalizarNome(nome) {
  return nome.toLowerCase().trim();
}

// Adicionar item na loja
async function adicionarItemLoja(message, args) {
  const status = lerLojaStatus();
  if (!status.ativa) {
    return message.reply('⚠️ A loja está desligada no momento.');
  }

  if (args.length < 3) {
    return message.reply('Use: *loja adicionar <nome do item> <preço> <quantidade>');
  }

  const precoStr = args[args.length - 2];
  const quantidadeStr = args[args.length - 1];
  const nomeItemArr = args.slice(0, args.length - 2);
  const nomeItemRaw = nomeItemArr.join(' ');
  const nomeItem = normalizarNome(nomeItemRaw);

  const preco = parseInt(precoStr);
  const quantidade = parseInt(quantidadeStr);

  if (isNaN(preco) || isNaN(quantidade) || preco <= 0 || quantidade <= 0) {
    return message.reply('Preço e quantidade devem ser números positivos.');
  }

  const itens = lerJSON(itensPath);

  if (!itens[nomeItem]) {
    return message.reply(`O item "${nomeItemRaw}" não está registrado no itens.json.`);
  }

  const loja = lerJSON(lojaPath);

  if (!loja[nomeItem]) {
    loja[nomeItem] = {
      preco,
      quantidade
    };
  } else {
    loja[nomeItem].preco = preco;
    loja[nomeItem].quantidade += quantidade;
  }

  salvarJSON(lojaPath, loja);

  return message.reply(`Item **${nomeItemRaw}** adicionado/atualizado na loja com preço R$${preco} e quantidade ${quantidade}.`);
}

// Mostrar loja
async function mostrarLoja(message) {
  const status = lerLojaStatus();
  if (!status.ativa) {
    return message.reply('⚠️ A loja está desligada no momento.');
  }

  const loja = lerJSON(lojaPath);
  const itens = Object.entries(loja);
  if (itens.length === 0) return message.reply('A loja está vazia.');

  const embed = new EmbedBuilder()
    .setTitle('🛒 Loja')
    .setDescription('Escolha um item para comprar no menu abaixo.')
    .setColor('Blue');

  let descricao = '';
  for (const [nome, dados] of itens) {
    descricao += `**${nome}** - R$${dados.preco} - Quantidade: ${dados.quantidade}\n`;
  }
  embed.addFields({ name: 'Itens disponíveis:', value: descricao });

  const select = new StringSelectMenuBuilder()
    .setCustomId('comprar_item')
    .setPlaceholder('Selecione o item para comprar');

  for (const [nome, dados] of itens) {
    select.addOptions({
      label: nome,
      description: `Preço: R$${dados.preco} - Quantidade: ${dados.quantidade}`,
      value: nome
    });
  }

  const row = new ActionRowBuilder().addComponents(select);

  return message.reply({ embeds: [embed], components: [row] });
}

// Evento interação compra
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== 'comprar_item') return;

  const status = lerLojaStatus();
  if (!status.ativa) {
    return interaction.reply({ content: '⚠️ A loja está desligada no momento.', flags: 64 });
  }

  const nomeItemRaw = interaction.values[0];
  const nomeItem = normalizarNome(nomeItemRaw);

  const loja = lerJSON(lojaPath);
  const jogadores = lerJSON(jogadoresPath);
  const inventarios = lerJSON(inventariosPath);
  const itens = lerJSON(itensPath);

  if (!loja[nomeItem]) {
    return interaction.reply({ content: 'Esse item não está mais disponível na loja.', flags: 64 });
  }

  if (loja[nomeItem].quantidade <= 0) {
    return interaction.reply({ content: 'Esse item está esgotado na loja.', flags: 64 });
  }

  const userId = interaction.user.id;

  if (!jogadores[userId]) jogadores[userId] = { dinheiro: 0 };
  if (!inventarios[userId]) inventarios[userId] = {};

  const preco = loja[nomeItem].preco;
  const dinheiroUser = jogadores[userId].dinheiro || 0;

  if (dinheiroUser < preco) {
    return interaction.reply({ content: 'Você não tem dinheiro suficiente para comprar esse item.', flags: 64 });
  }

  jogadores[userId].dinheiro -= preco;

  if (!inventarios[userId][nomeItem]) {
    inventarios[userId][nomeItem] = 1;
  } else {
    inventarios[userId][nomeItem]++;
  }

  loja[nomeItem].quantidade--;

  salvarJSON(jogadoresPath, jogadores);
  salvarJSON(inventariosPath, inventarios);
  salvarJSON(lojaPath, loja);

  return interaction.reply({ content: `Você comprou 1x **${nomeItemRaw}** por R$${preco}.`, flags: 64 });
});

// Comando ligar/desligar loja (somente dono)
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift().toLowerCase();

const donoID = '1288909561784172560'; 
  // Coloque seu ID aqui

  if (comando === 'loja') {
    if (args.length === 1) {
      const acao = args[0].toLowerCase();
      if (acao === 'ligar' || acao === 'desligar') {
        if (message.author.id !== donoID) {
          return message.reply('❌ Você não tem permissão para fazer isso.');
        }
        const status = lerLojaStatus();
        status.ativa = (acao === 'ligar');
        salvarLojaStatus(status);
        return message.reply(`✅ Loja foi ${acao === 'ligar' ? 'ligada' : 'desligada'}.`);
      }
    }
  }
});

// Comandos *loja e *loja adicionar
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift().toLowerCase();

  if (comando === 'loja') {
    if (args.length === 0) {
      return mostrarLoja(message);
    }
    if (args[0].toLowerCase() === 'adicionar') {
      args.shift();
      return adicionarItemLoja(message, args);
    }
  }
});

client.login('MTM4ODIyODg1OTg4MjYzNTQ0OA.G0CCem.2hWioqbUaHdclwAPJvjmRv4L3yRTUH7XCYkiuM');




