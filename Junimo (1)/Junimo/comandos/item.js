const fs = require('fs');
const path = require('path');

const inventarioPath = path.join(__dirname, '../dados/inventarios.json');
const itensPath = path.join(__dirname, '../dados/itens.json');
const limitePath = path.join(__dirname, '../dados/limites.json');

const cargoAutorizado = 'Staff'; // Cargo necessário

function carregarJSON(caminho) {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  return JSON.parse(fs.readFileSync(caminho));
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

module.exports = {
  nome: 'item',
  texto(msg, args) {
    if (!args.length) return msg.reply('❗ Use: `*item adicionar @pessoa nome-do-item` ou `*item tirar @pessoa nome-do-item`');

    const comando = args[0];
    const membro = msg.mentions.users.first();
    const nomeItem = args.slice(2).join(' ');

    // 🔒 Checa se o autor tem cargo Staff
    const membroAutor = msg.guild.members.cache.get(msg.author.id);
    if (!membroAutor.roles.cache.some(role => role.name === cargoAutorizado)) {
      return msg.reply(`❌ Você precisa do cargo **${cargoAutorizado}** para usar este comando.`);
    }

    if (!membro || !nomeItem) return msg.reply('❗ Formato inválido. Use: `*item adicionar @pessoa nome-do-item` ou `*item tirar @pessoa nome-do-item`');

    const inventarios = carregarJSON(inventarioPath);
    const itens = carregarJSON(itensPath);
    const limites = carregarJSON(limitePath);

    if (!itens[nomeItem]) return msg.reply(`❌ O item **${nomeItem}** não está cadastrado em \`itens.json\`.`);

    const id = membro.id;
    if (!inventarios[id]) inventarios[id] = {};
    if (!limites[id]) limites[id] = 10;

    const totalItens = Object.values(inventarios[id]).reduce((a, b) => a + b, 0);

    if (comando === 'adicionar') {
      if (totalItens + 1 > limites[id]) return msg.reply(`❌ Inventário de <@${id}> atingiu o limite de ${limites[id]} itens.`);
      if (!inventarios[id][nomeItem]) inventarios[id][nomeItem] = 0;
      inventarios[id][nomeItem]++;
      salvarJSON(inventarioPath, inventarios);
      return msg.reply(`✅ Item **${nomeItem}** adicionado ao inventário de <@${id}>.`);
    }

    if (comando === 'tirar') {
      if (!inventarios[id][nomeItem] || inventarios[id][nomeItem] <= 0) {
        return msg.reply(`❌ O usuário <@${id}> não possui o item **${nomeItem}**.`);
      }
      inventarios[id][nomeItem]--;
      if (inventarios[id][nomeItem] === 0) delete inventarios[id][nomeItem];
      salvarJSON(inventarioPath, inventarios);
      return msg.reply(`🗑️ Item **${nomeItem}** removido do inventário de <@${id}>.`);
    }

    return msg.reply('❗ Comando inválido. Use: `*item adicionar @pessoa nome-do-item` ou `*item tirar @pessoa nome-do-item`');
  }
};

