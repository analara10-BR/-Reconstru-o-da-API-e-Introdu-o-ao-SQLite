export default class ApiController {
  constructor() {}

  async getInfo(req, res) {
    try {
      res.json({ message: "Api Web em Node e Express." });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao ao exibir dados da api!" });
    }
  }

  async getInfoByParamId(req, res, next) {
    try {
      const id = Number(req.params.id);

      if (id !== 42) {
        throw new Error("Resposta Incorreta!");
      }

      res.json({ message: `ID: ${id}` });
    } catch (error) {
      next(error);
    }
  }

  async getHome(req, res, next) {
    try {
      const dados = { titulo: "Brechó Online" };
      res.json(dados); // Entrega o JSON puro
    } catch (error) {
      next(error);
    }
  }
}
