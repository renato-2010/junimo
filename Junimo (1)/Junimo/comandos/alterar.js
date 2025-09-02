const fs = require("fs");
const path = require("path");
const dadosPath = path.join(__dirname, "../dados/status.json");

function carregarDados() {
  if (!fs.existsSync(dadosPath)) {
    const init = {
      limites: {
        vida: 100,
        mana: 100,
        sanidade: 10,
        energia: 100
      }
    };
    fs.writeFileSync(dadosPath, JSON.stringify(init, null, 2));
  }
  const raw = fs.readFileSync(dadosPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {
      limites: {
        vida: 100,
        mana: 100,
        sanidade: 10,
        energia: 100
      }
    };
  }
}

function salvarDados(dados) {
  fs.writeFileSync(dadosPath, JSON.stringify(dados, null, 2));
}

module.exports = {
  nome: "alterar",
  texto: (msg, args) => {
    const cargoPermitido = "Staff";

    if (!msg.member?.roles?.cache.some(role => role.name === cargoPermitido)) {
      msg.reply("❌ Você não tem permissão para usar este comando.");
      return;
    }

    if (args.length < 4) {
      msg.reply("❌ Uso correto: `*alterar + vida @usuário 10` ou `*alterar - mana @usuário 5`");
      return;
    }

    const acao = args[0]; // '+' ou '-'
    const atributo = args[1].toLowerCase(); // vida, mana, sanidade, energia
    const membro = msg.mentions.users.first();
    const qtd = parseInt(args[3]);

    if (!membro || isNaN(qtd)) {
      msg.reply("❌ Usuário ou número inválido. Exemplo: `*alterar + vida @usuário 10`");
      return;
    }

    if (!['vida', 'mana', 'sanidade', 'energia'].includes(atributo)) {
      msg.reply("❌ Atributo inválido. Use: vida, mana, sanidade ou energia.");
      return;
    }

    const dados = carregarDados();
    const id = membro.id;

    if (!dados[id]) {
      dados[id] = {
        nome: msg.guild.members.cache.get(id)?.user.username || "Desconhecido",
        vida: 100,
        mana: 100,
        sanidade: 100,
        energia: 100,
      };
    }

    if (acao === "+") {
      dados[id][atributo] += qtd;
      if (dados[id][atributo] > dados.limites[atributo]) {
        dados[id][atributo] = dados.limites[atributo];
      }
    } else if (acao === "-") {
      dados[id][atributo] -= qtd;
      if (dados[id][atributo] < 0) {
        dados[id][atributo] = 0;
      }
    } else {
      msg.reply("❌ Ação inválida. Use `+` ou `-`.");
      return;
    }

    salvarDados(dados);

    // Verifica se morreu (vida 0)
    if (atributo === "vida" && dados[id][atributo] === 0) {
      return msg.channel.send(`💀 **${membro.username} morreu!**`);
    }

    msg.channel.send(`✅ ${atributo} de ${membro.username} agora é ${dados[id][atributo]}`);
  }
};
