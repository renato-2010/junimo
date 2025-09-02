const fs = require('fs');
const path = require('path');

const itensPath = path.join(__dirname, '../dados/itens.json');
const cargoAutorizado = 'Staff'; // <- NOME DO CARGO PERMITIDO

function carregarItens() {
  if (!fs.existsSync(itensPath)) fs.writeFileSync(itensPath, '{}');
  return JSON.parse(fs.readFileSync(itensPath));
}

function salvarItens(itens) {
  fs.writeFileSync(itensPath, JSON.stringify(itens, null, 2));
}

module.exports = {
  nome: 'criaritem',
  texto(msg, args) {
    const membroAutor = msg.guild.members.cache.get(msg.author.id);
    if (!membroAutor.roles.cache.some(role => role.name === cargoAutorizado)) {
      return msg.reply(`❌ Você precisa do cargo **${cargoAutorizado}** para criar itens.`);
    }

    const nomeItem = args.join(' ');
    if (!nomeItem) return msg.reply('❌ Escreva o nome do item. Ex: `*criaritem Espada de Gelo`');

    const itens = carregarItens();
    if (itens[nomeItem]) return msg.reply('❌ Esse item já existe.');

    itens[nomeItem] = { nome: nomeItem };
    salvarItens(itens);

    msg.reply(`✅ O item **${nomeItem}** foi criado com sucesso!`);
  }
};