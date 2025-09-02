const fs = require("fs");
const path = require("path");
const dadosPath = path.join(__dirname, "../dados/jogadores.json");

function carregarDados() {
  if (!fs.existsSync(dadosPath)) fs.writeFileSync(dadosPath, "{}");
  return JSON.parse(fs.readFileSync(dadosPath));
}

function salvarDados(dados) {
  fs.writeFileSync(dadosPath, JSON.stringify(dados, null, 2));
}

module.exports = {
  nome: "dinheiro",

  texto: (msg, args) => {
    const cargoPermitido = "Staff";
    if (!msg.member.roles.cache.some(r => r.name === cargoPermitido)) {
      msg.reply("❌ Você não tem permissão para usar este comando.");
      return;
    }

    if (args.length < 3) {
      msg.reply("❗ Uso correto: `*dinheiro dar @usuário 100` ou `*dinheiro tirar @usuário 50`");
      return;
    }

    const acao = args[0].toLowerCase();
    const membro = msg.mentions.users.first();
    const qtd = parseInt(args[2]);

    if (!membro || isNaN(qtd) || qtd < 0) {
      msg.reply("❌ Mencione um usuário válido e insira um número positivo.");
      return;
    }

    const dados = carregarDados();
    const id = membro.id;

    // Corrige caso o jogador não exista ainda
    if (!dados[id]) {
      dados[id] = {
        nome: membro.username,
        dinheiro: 0,
        pontos: 0,
        nivel: 1
      };
    }

    // Corrige se 'dinheiro' estiver faltando
    if (typeof dados[id].dinheiro !== "number") {
      dados[id].dinheiro = 0;
    }

    if (acao === "dar") {
      dados[id].dinheiro += qtd;
      msg.channel.send(`💸 ${qtd} moeda(s) foram dadas a ${membro.username}. Total: ${dados[id].dinheiro}`);
    } else if (acao === "tirar") {
      dados[id].dinheiro -= qtd;
      if (dados[id].dinheiro < 0) dados[id].dinheiro = 0;
      msg.channel.send(`💰 ${qtd} moeda(s) foram tiradas de ${membro.username}. Total: ${dados[id].dinheiro}`);
    } else {
      msg.reply("⚠️ Ação inválida. Use `dar` ou `tirar`.");
      return;
    }

    salvarDados(dados);
  }
};