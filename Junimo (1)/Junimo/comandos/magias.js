const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const prefix = '*';
const magiasPath = path.join(__dirname, '../dados/magias.json');
const magiasUsuarioPath = path.join(__dirname, '../dados/magiasUsuario.json');

function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  const conteudo = fs.readFileSync(caminho, 'utf8');
  if (!conteudo) return {};
  return JSON.parse(conteudo);
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// Função para criar embed de paginação com título validado
function criarEmbedPaginas(tit, arrayMagias, pagina, totalPorPagina = 5) {
  if (typeof tit !== 'string' || tit.trim().length === 0) {
    tit = 'Título não definido';
  }

  const totalPaginas = Math.max(1, Math.ceil(arrayMagias.length / totalPorPagina));
  if (pagina < 1) pagina = 1;
  if (pagina > totalPaginas) pagina = totalPaginas;

  const inicio = (pagina - 1) * totalPorPagina;
  const fim = inicio + totalPorPagina;
  const magiasPagina = arrayMagias.slice(inicio, fim);

  const embed = new EmbedBuilder()
    .setTitle(tit)
    .setFooter({ text: `Página ${pagina} de ${totalPaginas}` })
    .setColor('Blue');

  magiasPagina.forEach(magia => {
    embed.addFields({
      name: `${magia.nome} (Nível ${magia.nivel || 1})`,
      value: magia.descricao || 'Sem descrição',
    });
  });

  return { embed, totalPaginas };
}

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const comando = args.shift().toLowerCase();

  if (comando !== 'magias') return;

  const sub = args.shift()?.toLowerCase();

  const magias = lerJSON(magiasPath);
  const magiasUsuario = lerJSON(magiasUsuarioPath);
  const userId = message.author.id;

  const isStaff = message.member.roles.cache.some(role => role.name === 'Staff');

  async function enviarPaginacao(embedObj, tipo, user, listaMagias) {
    let paginaAtual = 1;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${tipo}_prev_${user.id}`)
        .setLabel('⬅️ Anterior')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${tipo}_next_${user.id}`)
        .setLabel('Próxima ➡️')
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await message.channel.send({ embeds: [embedObj.embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', i => {
      if (i.user.id !== user.id) {
        return i.reply({ content: 'Só você pode usar esses botões!', flags: 64 });
      }

      if (i.customId === `${tipo}_prev_${user.id}`) {
        if (paginaAtual > 1) paginaAtual--;
      } else if (i.customId === `${tipo}_next_${user.id}`) {
        if (paginaAtual < embedObj.totalPaginas) paginaAtual++;
      }

      const novoEmbedObj = criarEmbedPaginas(embedObj.embed.data.title, listaMagias, paginaAtual);

      i.update({ embeds: [novoEmbedObj.embed] });
    });

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`${tipo}_prev_${user.id}`)
          .setLabel('⬅️ Anterior')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`${tipo}_next_${user.id}`)
          .setLabel('Próxima ➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );
      msg.edit({ components: [disabledRow] }).catch(() => {});
    });
  }

  if (!sub) {
    // *magias - lista magias do usuário
    const magiasDoUsuario = (magiasUsuario[userId] || []).map(magiaUser => {
      const magiaGeral = magias[magiaUser.nome];
      return {
        nome: magiaUser.nome,
        nivel: magiaUser.nivel || 1,
        descricao: magiaGeral ? magiaGeral.descricao : 'Descrição não encontrada.',
      };
    });

    if (magiasDoUsuario.length === 0) return message.reply('Você não possui nenhuma magia registrada.');

    const embedObj = criarEmbedPaginas('Suas Magias', magiasDoUsuario, 1);
    enviarPaginacao(embedObj, 'usuario', message.author, magiasDoUsuario);

  } else if (sub === 'registradas') {
    // *magias registradas (staff)
    if (!isStaff) return message.reply('❌ Apenas quem possui o cargo Staff pode usar esse comando.');

    const todasMagias = Object.entries(magias).map(([nome, dados]) => ({
      nome,
      descricao: dados.descricao || 'Sem descrição',
      nivel: 1,
    }));

    if (todasMagias.length === 0) return message.reply('Nenhuma magia registrada no sistema.');

    const embedObj = criarEmbedPaginas('Magias Registradas', todasMagias, 1);
    enviarPaginacao(embedObj, 'registradas', message.author, todasMagias);

  } else if (sub === 'criar') {
    // *magias criar <nome> <descrição> <custoMana> (staff)
    if (!isStaff) return message.reply('❌ Apenas Staff pode criar magias.');

    if (args.length < 3) return message.reply('Use: *magias criar <nome> <descrição> <custoMana>');

    const nomeMagia = args.shift();
    const custoManaStr = args.pop(); // último argumento é custoMana
    const descricaoMagia = args.join(' ');

    const custoMana = Number(custoManaStr);
    if (isNaN(custoMana)) {
      return message.reply('❌ O custo de mana deve ser um número válido.');
    }

    if (magias[nomeMagia]) return message.reply('Essa magia já existe.');

    magias[nomeMagia] = { descricao: descricaoMagia, custoMana };
    salvarJSON(magiasPath, magias);

    message.reply(`✅ Magia **${nomeMagia}** criada com sucesso com custo de mana ${custoMana}!`);

  } else if (sub === 'usar') {
    // *magias usar <nome>
    const statusPath = path.join(__dirname, '../dados/status.json');

    function lerStatus() {
      if (!fs.existsSync(statusPath)) fs.writeFileSync(statusPath, '{}');
      const conteudo = fs.readFileSync(statusPath, 'utf8');
      if (!conteudo) return {};
      return JSON.parse(conteudo);
    }

    function salvarStatus(dados) {
      fs.writeFileSync(statusPath, JSON.stringify(dados, null, 2));
    }

    if (args.length < 1) return message.reply('Use: *magias usar <nome>');

    const nomeMagia = args.join(' ');
    const magiasDoUsuario = magiasUsuario[userId] || [];

    const magiaAchada = magiasDoUsuario.find(m => m.nome === nomeMagia);
    if (!magiaAchada) return message.reply('Você não possui essa magia.');

    const magiaGeral = magias[nomeMagia];
    if (!magiaGeral) return message.reply('Essa magia não está registrada no sistema.');

    const status = lerStatus();

    if (!status[userId]) {
      return message.reply('Você não tem status registrado (mana).');
    }

    const manaAtual = status[userId].mana ?? 0;
    const custoMana = magiaGeral.custoMana ?? 0;

    if (manaAtual < custoMana) {
      return message.reply(`Mana insuficiente! Você precisa de ${custoMana} de mana para usar essa magia.`);
    }

    // Subtrai a mana
    status[userId].mana = manaAtual - custoMana;
    salvarStatus(status);

    message.reply(`✨ Você usou a magia **${nomeMagia}** (Nível ${magiaAchada.nivel}) e gastou ${custoMana} de mana. Mana restante: ${status[userId].mana}`);

  } else if (sub === 'adicionar') {
    // *magias adicionar @player <nome-da-magia> (staff)
    if (!isStaff) return message.reply('❌ Apenas Staff pode adicionar magias.');

    const membro = message.mentions.users.first();
    if (!membro) return message.reply('Mencione um usuário para adicionar a magia.');

    if (args.length < 2) return message.reply('Use: *magias adicionar @player <nome-da-magia>');

    const nomeMagia = args.slice(1).join(' ');

    if (!magias[nomeMagia]) return message.reply('Essa magia não existe no sistema.');

    if (!magiasUsuario[membro.id]) magiasUsuario[membro.id] = [];

    if (magiasUsuario[membro.id].some(m => m.nome === nomeMagia)) {
      return message.reply('Esse usuário já possui essa magia.');
    }

    magiasUsuario[membro.id].push({ nome: nomeMagia, nivel: 1 });
    salvarJSON(magiasUsuarioPath, magiasUsuario);

    message.reply(`✅ Magia **${nomeMagia}** adicionada para <@${membro.id}> com nível 1!`);

  } else if (sub === 'evoluir') {
    // *magias evoluir @player <nome-da-magia> (staff)
    if (!isStaff) return message.reply('❌ Apenas Staff pode evoluir magias.');

    if (args.length < 2) return message.reply('Use: *magias evoluir @player <nome-da-magia>');

    const membro = message.mentions.users.first();
    if (!membro) return message.reply('Mencione um usuário para evoluir a magia.');

    const nomeMagia = args.slice(1).join(' ');

    const magiasDoUsuario = magiasUsuario[membro.id] || [];

    const magia = magiasDoUsuario.find(m => m.nome === nomeMagia);

    if (!magia) return message.reply(`O usuário <@${membro.id}> não possui a magia **${nomeMagia}**.`);

    if (magia.nivel >= 5) return message.reply(`A magia **${nomeMagia}** já está no nível máximo (5).`);

    magia.nivel++;

    salvarJSON(magiasUsuarioPath, magiasUsuario);

    message.reply(`✅ A magia **${nomeMagia}** de <@${membro.id}> foi evoluída para o nível ${magia.nivel}!`);
  } else {
    message.reply('Subcomando inválido. Use: registradas, criar, usar, adicionar, evoluir ou nada para listar suas magias.');
  }
});

client.login('MTM4ODIyODg1OTg4MjYzNTQ0OA.G0CCem.2hWioqbUaHdclwAPJvjmRv4L3yRTUH7XCYkiuM');



