module.exports = class Usuario {
  constructor() {
    this.matricula = "";
    this.nome = "";
    this.tipo = "";
    this.senha = "";
  }

  inserir(conexao, callback) {
    const sql = "INSERT INTO usuarios (matricula, nome, tipo, senha) VALUES (?, ?, ?, ?)";
    conexao.query(sql, [this.matricula, this.nome, this.tipo, this.senha], function (err, result) {
      if (callback) return callback(err, result);
    });
  }
}
