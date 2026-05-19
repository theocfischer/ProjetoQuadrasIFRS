module.exports = class Agendamento {
  constructor() {
    this.matricula_usuario = "";
    this.id_quadra = 0;
    this.data = "";
    this.horario = "";
    this.observacoes = "";
  }

  inserir(conexao, callback) {
    const sql = "INSERT INTO agendamentos (matricula_usuario, id_quadra, data, horario, observacoes) VALUES (?, ?, ?, ?, ?)";
    conexao.query(sql, [this.matricula_usuario, this.id_quadra, this.data, this.horario, this.observacoes], function (err, result) {
      if (callback) return callback(err, result);
    });
  }
}
