const fs = require("fs");
const caminhoDestino = "./dados/sorteio.json";

function carregarDestino() {
  if (!fs.existsSync(caminhoDestino)) fs.writeFileSync(caminhoDestino, "[]");
  return JSON.parse(fs.readFileSync(caminhoDestino));
}

function salvarDestino(lista) {
  fs.writeFileSync(caminhoDestino, JSON.stringify(lista, null, 2));
}

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("*sortear")) return;

    const args = message.content.trim().split(/ +/).slice(1);
    let lista = carregarDestino();

    // Staff adiciona opções
    if (args[0] === "adicionar") {
      if (!message.member.permissions.has("Administrator")) {
        return message.reply("🚫 Apenas a staff pode adicionar opções ao sorteio!");
      }

      const nomeItem = args.slice(1).join(" ");
      if (!nomeItem) return message.reply("⚠️ Escreva o nome da opção para o sorteio!");

      if (!lista.includes(nomeItem)) lista.push(nomeItem);
      salvarDestino(lista);

      return message.reply(`✨ Opção **${nomeItem}** adicionada ao sorteio!`);
    }

    // Jogador sorteia
    if (lista.length === 0) {
      return message.reply("⚠️ Ainda não existem opções no sorteio...");
    }

    const escolha = lista[Math.floor(Math.random() * lista.length)];
    return message.reply(`🔮 O destino escolheu para você: **${escolha}**`);
  });
};
