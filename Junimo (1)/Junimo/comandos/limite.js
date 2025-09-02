const fs = require('fs');
const path = require('path');

const limitePath = path.join(__dirname, '../dados/limites.json');
const cargoAutorizado = 'Staff';

function carregarJSON(caminho) {
  if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '{}');
  return JSON.parse(fs.readFileSync(caminho));
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

module.exports = {
  nome: 'limite',
  texto(msg, args) {
    if (!args.length || !['+', '-'].includes(args[0]) || isNaN(args[1])) {
      return msg.reply('❗ Use: `*limite + <quantidade>` ou `*limite - <quantidade>`');
    }

    // 🔒 Checa se o autor tem cargo Staff
    const membroAutor = msg.guild.members.cache.get(msg.author.id);
    if (!membroAutor.roles.cache.some(role => role.name === cargoAutorizado)) {
      return msg.reply(`❌ Você precisa do cargo **${cargoAutorizado}** para usar este comando.`);
    }

    const membro = msg.mentions.users.first();
    if (!membro) return msg.reply('❗ Você precisa mencionar o usuário para ajustar o limite.');

    const operacao = args[0];
    const quantidade = parseInt(args[1]);
    const limites = carregarJSON(limitePath);
    const id = membro.id;

    if (!limites[id]) limites[id] = 10;

    if (operacao === '+') limites[id] += quantidade;
    else if (operacao === '-') limites[id] = Math.max(1, limites[id] - quantidade);

    salvarJSON(limitePath, limites);
    return msg.reply(`✅ Limite de inventário de <@${id}> ajustado para ${limites[id]}.`);
  }
};
