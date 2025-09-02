const fs = require("fs");
const path = require("path");
const dadosPath = path.join(__dirname, "../dados/jogadores.json");

function carregarDados() {
  if (!fs.existsSync(dadosPath)) {
    fs.writeFileSync(dadosPath, "{}");
  }
  return JSON.parse(fs.readFileSync(dadosPath));
}

function salvarDados(dados) {
  fs.writeFileSync(dadosPath, JSON.stringify(dados, null, 2));
}

module.exports = {
  nome: "pontos",
  texto: (msg, args) => {
    const cargoPermitido = "Staff";

    // Verifica se o autor tem o cargo permitido
    if (!msg.member?.roles?.cache.some(role => role.name === cargoPermitido)) {
      msg.reply("❌ Você não tem permissão para usar este comando.");
      return;
    }

    // Verifica se a estrutura básica está correta
    if (args.length < 3) {
      msg.reply("❌ Uso correto: `*pontos dar @usuário 10` ou `*pontos tirar @usuário 5`");
      return;
    }

    const acao = args[0].toLowerCase(); // dar ou tirar
    const membro = msg.mentions.users.first();
    const qtd = parseInt(args[2]);

    if (!membro || isNaN(qtd)) {
      msg.reply("❌ Usuário ou número inválido. Exemplo: `*pontos dar @usuário 10`");
      return;
    }

    const dados = carregarDados();
    const id = membro.id;

    if (!dados[id]) dados[id] = { pontos: 0 };

    if (acao === "dar") {
      dados[id].pontos += qtd;
      msg.channel.send(`✅ ${qtd} ponto(s) dado(s) para ${membro.username}. Total: ${dados[id].pontos}`);
    } else if (acao === "tirar") {
      dados[id].pontos -= qtd;
      if (dados[id].pontos < 0) dados[id].pontos = 0;
      msg.channel.send(`⚠️ ${qtd} ponto(s) removido(s) de ${membro.username}. Total: ${dados[id].pontos}`);
    } else {
      msg.reply("❌ Ação inválida. Use `dar` ou `tirar`.");
      return;
    }

    salvarDados(dados);
  }
};