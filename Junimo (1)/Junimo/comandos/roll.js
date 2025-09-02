module.exports = {
  nome: 'roll',

  texto(msg, args) {
    // Se não passar argumento, rola 1d6 por padrão
    const dadoInput = args[0] || '1d20';
    const regex = /^(\d+)d(\d+)$/i;
    const match = dadoInput.match(regex);

    if (!match) {
      msg.reply("Formato inválido! Use `*roll XdY` (ex: 2d6, 1d20).");
      return;
    }

    const qtd = parseInt(match[1]);
    const faces = parseInt(match[2]);

    if (qtd < 1 || faces < 2) {
      msg.reply("Número de dados ou faces inválido.");
      return;
    }

    const resultados = [];
    for (let i = 0; i < qtd; i++) {
      resultados.push(Math.floor(Math.random() * faces) + 1);
    }

    const soma = resultados.reduce((a, b) => a + b, 0);
    const maior = Math.max(...resultados);
    

    msg.reply(
      `🎲 **Rolagem:** \`${qtd}d${faces}\`\n` +
      `Resultados: [${resultados.join(', ')}]\n` +
      `Soma: **${soma}**, Maior: **${maior}**`
    );
  }
};

