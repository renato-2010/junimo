const fs = require('fs');
const path = require('path');

const itensPath = path.join(__dirname, '../dados/itens.json');
const cargoAutorizado = 'Staff';

function carregarItens() {
  if (!fs.existsSync(itensPath)) fs.writeFileSync(itensPath, '{}');
  return JSON.parse(fs.readFileSync(itensPath));
}

module.exports = {
  nome: 'itens',
  texto(msg, args) {
    const membroAutor = msg.guild.members.cache.get(msg.author.id);
    if (!membroAutor.roles.cache.some(role => role.name === cargoAutorizado)) {
      return msg.reply(`❌ Você precisa do cargo **${cargoAutorizado}** para ver a lista de itens.`);
    }

    const itens = carregarItens();
    const nomes = Object.keys(itens);

    if (nomes.length === 0) {
      return msg.reply('⚠️ Nenhum item foi criado ainda.');
    }

    const lista = nomes.map(nome => `• ${nome}`).join('\n');
    msg.reply(`📦 Itens cadastrados:\n${lista}`);
  }
};