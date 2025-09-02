// comandos/bestiario.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  Events
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const prefix = '*';
const bestiarioPath = path.join(__dirname, '../dados/bestiario.json');

// Funções de arquivo
function ensureBestiario() { if (!fs.existsSync(bestiarioPath)) fs.writeFileSync(bestiarioPath, '[]'); }
function carregarBestiario() { ensureBestiario(); return JSON.parse(fs.readFileSync(bestiarioPath, 'utf-8')); }
function salvarBestiario(arr) { fs.writeFileSync(bestiarioPath, JSON.stringify(arr, null, 2)); }

// Helpers
const drafts = new Map();
const pages = new Map();

// Visual de estrelas
function estrelas(n) { const num = Math.max(1, Math.min(5, parseInt(n || 1))); return '⭐'.repeat(num) + (num < 5 ? '☆'.repeat(5 - num) : ''); }

// Embed de monstro
function embedMonstro(m, idx, total) {
  m = m || { nome: '—', nivel: '—', afinidade: '—', descricao: '—', habitos: '—' };
  return new EmbedBuilder()
    .setTitle(`📖 Bestiário — ${idx + 1}/${total}`)
    .addFields(
      { name: 'Nome', value: m.nome || '—', inline: true },
      { name: 'Nível', value: `${m.nivel || '—'} (${estrelas(m.nivel)})`, inline: true },
      { name: 'Afinidade', value: m.afinidade || '—', inline: false },
      { name: 'Descrição', value: m.descricao || '—', inline: false },
      { name: 'Hábitos', value: m.habitos || '—', inline: false }
    )
    .setColor(0xffcc00);
}

// Botões de paginação
function botoesPaginacao() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('bst_page_prev').setLabel('⬅').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('bst_page_next').setLabel('➡').setStyle(ButtonStyle.Primary)
  );
}

// Embed do formulário de criação
function embedForm(d) {
  d = d || {};
  return new EmbedBuilder()
    .setTitle('📝 Criar Monstro (Bestiário)')
    .setDescription('Preencha os campos pelos botões abaixo e depois clique em **Salvar**.')
    .addFields(
      { name: '1) Nome', value: d.nome || '—', inline: true },
      { name: '2) Nível (1–5)', value: d.nivel || '—', inline: true },
      { name: '3) Afinidade', value: d.afinidade || '—', inline: false },
      { name: '4) Descrição', value: d.descricao || '—', inline: false },
      { name: '5) Hábitos', value: d.habitos || '—', inline: false }
    )
    .setColor(0x00b0f4);
}

// Botões do formulário
function botoesForm(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bst_f_nome:${userId}`).setLabel('Nome').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`bst_f_nivel:${userId}`).setLabel('Nível').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`bst_f_afinidade:${userId}`).setLabel('Afinidade').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bst_f_desc:${userId}`).setLabel('Descrição').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`bst_f_habitos:${userId}`).setLabel('Hábitos').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`bst_save:${userId}`).setLabel('Salvar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`bst_cancel:${userId}`).setLabel('Cancelar').setStyle(ButtonStyle.Danger)
    )
  ];
}

// Exporta função que recebe client
module.exports = (client) => {

  // Comando *bestiario
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const comando = args.shift()?.toLowerCase();
    if (comando !== 'bestiario') return;

    const sub = args[0]?.toLowerCase();

    // Criar (apenas ADM)
    if (sub === 'criar') {
      if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ Apenas administradores podem criar monstros.');
      }

      const draft = { nome: '', nivel: '', afinidade: '', descricao: '', habitos: '' };
      const msg = await message.channel.send({ embeds: [embedForm(draft)], components: botoesForm(message.author.id) });
      drafts.set(message.author.id, { ...draft, messageId: msg.id, channelId: msg.channel.id });
      return;
    }

    // Listar
    const lista = carregarBestiario();
    if (lista.length === 0) return message.reply('📭 O bestiário está vazio.');

    let page = 0;
    const msg = await message.channel.send({ embeds: [embedMonstro(lista[page], page, lista.length)], components: [botoesPaginacao()] });
    pages.set(msg.id, { page, total: lista.length, userId: message.author.id });
  });

  // Interações
  client.on(Events.InteractionCreate, async (interaction) => {

    // Paginação
    if (interaction.isButton() && ['bst_page_prev','bst_page_next'].includes(interaction.customId)) {
      const state = pages.get(interaction.message.id);
      if (!state) return interaction.reply({ content: 'Mensagem não está mais ativa.', flags: 64 });
      if (interaction.user.id !== state.userId) return interaction.reply({ content: '❌ Apenas quem abriu o bestiário pode usar esses botões.', flags: 64 });

      const lista = carregarBestiario();
      let page = state.page;
      page = interaction.customId === 'bst_page_prev' ? (page > 0 ? page - 1 : lista.length - 1) : (page + 1) % lista.length;
      state.page = page;
      pages.set(interaction.message.id, state);

      return interaction.update({ embeds: [embedMonstro(lista[page], page, lista.length)], components: [botoesPaginacao()] });
    }

    // Botões de formulário
    if (interaction.isButton() && interaction.customId.startsWith('bst_f_')) {
      const [, rest] = interaction.customId.split('bst_f_');
      const [campo, alvoId] = rest.split(':');
      if (interaction.user.id !== alvoId) return interaction.reply({ content: '❌ Esse formulário não é seu.', flags: 64 });

      const draft = drafts.get(alvoId);
      if (!draft) return interaction.reply({ content: '❌ Formulário expirou ou foi cancelado.', flags: 64 });

      const modal = new ModalBuilder().setCustomId(`bst_modal:${alvoId}:${campo}`).setTitle(`Definir ${campo === 'desc' ? 'descrição' : campo}`);
      const input = new TextInputBuilder()
        .setCustomId('text')
        .setLabel('Digite o valor')
        .setStyle(['desc','habitos'].includes(campo) ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(true)
        .setValue(draft[campo === 'desc' ? 'descricao' : campo] || '');
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // SALVAR
    if (interaction.isButton() && interaction.customId.startsWith('bst_save:')) {
      const alvoId = interaction.customId.split(':')[1];
      if (interaction.user.id !== alvoId) return interaction.reply({ content: '❌ Esse formulário não é seu.', flags: 64 });

      const draft = drafts.get(alvoId);
      if (!draft) return interaction.reply({ content: '❌ Formulário expirou ou foi cancelado.', flags: 64 });

      // Validação
      if (!draft.nome || !draft.nivel) return interaction.reply({ content: '⚠️ Preencha pelo menos Nome e Nível.', flags: 64 });
      const n = parseInt(draft.nivel,10);
      if (isNaN(n) || n < 1 || n > 5) return interaction.reply({ content: '⚠️ Nível deve ser 1–5.', flags: 64 });

      const lista = carregarBestiario();
      lista.push({
        nome: String(draft.nome),
        nivel: n,
        afinidade: String(draft.afinidade||''),
        descricao: String(draft.descricao||''),
        habitos: String(draft.habitos||''),
        criadoPor: alvoId,
        criadoEm: new Date().toISOString()
      });
      salvarBestiario(lista);

      // Desabilita botões
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bst_f_nome:${alvoId}`).setLabel('Nome').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`bst_f_nivel:${alvoId}`).setLabel('Nível').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`bst_f_afinidade:${alvoId}`).setLabel('Afinidade').setStyle(ButtonStyle.Secondary).setDisabled(true)
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bst_f_desc:${alvoId}`).setLabel('Descrição').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`bst_f_habitos:${alvoId}`).setLabel('Hábitos').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`bst_save:${alvoId}`).setLabel('Salvar').setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId(`bst_cancel:${alvoId}`).setLabel('Cancelar').setStyle(ButtonStyle.Danger).setDisabled(true)
      );

      try {
        const ch = await interaction.client.channels.fetch(draft.channelId);
        const msg = await ch.messages.fetch(draft.messageId);
        await msg.edit({ embeds: [embedForm(draft).setTitle('✅ Monstro salvo no Bestiário')], components: [row1,row2] });
      } catch {}

      drafts.delete(alvoId);
      return interaction.reply({ content: '✅ Monstro salvo com sucesso!', flags: 64 });
    }

    // CANCELAR
    if (interaction.isButton() && interaction.customId.startsWith('bst_cancel:')) {
      const alvoId = interaction.customId.split(':')[1];
      if (interaction.user.id !== alvoId) return interaction.reply({ content: '❌ Esse formulário não é seu.', flags: 64 });

      const draft = drafts.get(alvoId);
      if (draft) {
        try {
          const ch = await interaction.client.channels.fetch(draft.channelId);
          const msg = await ch.messages.fetch(draft.messageId);
          await msg.edit({ components: [] });
        } catch {}
        drafts.delete(alvoId);
      }
      return interaction.reply({ content: '🛑 Criação cancelada.', flags: 64 });
    }

    // Modal submit
    if (interaction.isModalSubmit() && interaction.customId.startsWith('bst_modal:')) {
      const [, alvoId, campo] = interaction.customId.split(':');
      if (interaction.user.id !== alvoId) return interaction.reply({ content: '❌ Esse formulário não é seu.', flags: 64 });

      const draft = drafts.get(alvoId);
      if (!draft) return interaction.reply({ content: '❌ Formulário expirou ou foi cancelado.', flags: 64 });

      const valor = interaction.fields.getTextInputValue('text').trim();
      if (campo === 'nome') draft.nome = valor;
      else if (campo === 'nivel') draft.nivel = valor;
      else if (campo === 'afinidade') draft.afinidade = valor;
      else if (campo === 'desc') draft.descricao = valor;
      else if (campo === 'habitos') draft.habitos = valor;

      try {
        const ch = await interaction.client.channels.fetch(draft.channelId);
        const msg = await ch.messages.fetch(draft.messageId);
        await msg.edit({ embeds: [embedForm(draft)], components: botoesForm(alvoId) });
      } catch {}

      return interaction.reply({ content: '✔ Campo atualizado.', flags: 64 });
    }

  });

};

