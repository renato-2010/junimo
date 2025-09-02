// comandos/diario.js
const fs = require("fs");
const path = require("path");

function lerJSON(caminho, padrao) {
  try {
    if (!fs.existsSync(caminho)) return padrao;
    const txt = fs.readFileSync(caminho, "utf8");
    return txt.trim() ? JSON.parse(txt) : padrao;
  } catch {
    return padrao;
  }
}
function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

module.exports = {
  nome: "diario",
  async texto(message) {
    const userId = message.author.id;

    // Arquivos
    const base = path.join(__dirname, "..", "dados");
    const inventariosPath = path.join(base, "inventarios.json"); // <- onde você guarda inventários
    const jogadoresPath   = path.join(base, "jogadores.json");   // dinheiro/pontos
    const cooldownsPath   = path.join(base, "diario_cooldowns.json"); // cooldown do diário
    const itensPath       = path.join(base, "itens.json");       // lista de itens existentes (opcional)

    // Garante que a pasta exista
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

    // Carregar dados
    const inventarios = lerJSON(inventariosPath, {});
    const jogadores   = lerJSON(jogadoresPath, {});
    const cooldowns   = lerJSON(cooldownsPath, {});
    const itensJson   = lerJSON(itensPath, {}); // pode ser null se não existir/estiver vazio

    // Cooldown de 24h
    const agora = Date.now();
    const ultimo = cooldowns[userId] || 0;
    const DIA_MS = 24 * 60 * 60 * 1000;

    if (agora - ultimo < DIA_MS) {
      const falta = DIA_MS - (agora - ultimo);
      const horas = Math.floor(falta / 3600000);
      const minutos = Math.floor((falta % 3600000) / 60000);
      return message.reply(`⏳ Você já coletou hoje! Volte em **${horas}h ${minutos}min**.`);
    }

    // Montar lista de itens válidos
    let listaItens;
    if (itensJson && typeof itensJson === "object") {
      // itens.json no formato { "nome do item": { ... }, ... }
      listaItens = Object.keys(itensJson);
    } else {
      // fallback se não tiver itens.json
      listaItens = ["Espada", "Escudo", "Poção de Vida", "Arco", "Adaga"];
    }

    // Decide recompensa: 50% item, 50% dinheiro
    const sorteio = Math.random();
    let msgRecompensa = "";

    if (sorteio < 0.5 && listaItens.length > 0) {
      // Item
      const item = listaItens[Math.floor(Math.random() * listaItens.length)];

      if (!inventarios[userId]) inventarios[userId] = {};
      if (!inventarios[userId][item]) inventarios[userId][item] = 0;
      inventarios[userId][item] += 1;

      salvarJSON(inventariosPath, inventarios);
      msgRecompensa = `🎁 item **${item}**`;
    } else {
      // Dinheiro
      const quantia = Math.floor(Math.random() * 101) + 50; // 50–150
      if (!jogadores[userId]) jogadores[userId] = { dinheiro: 0, pontos: 0 };
      jogadores[userId].dinheiro += quantia;

      salvarJSON(jogadoresPath, jogadores);
      msgRecompensa = `💰 **${quantia} moedas**`;
    }

    // Atualiza cooldown
    cooldowns[userId] = agora;
    salvarJSON(cooldownsPath, cooldowns);

    return message.reply(`🎉 Você coletou sua recompensa diária e ganhou ${msgRecompensa}!`);
  }
};
