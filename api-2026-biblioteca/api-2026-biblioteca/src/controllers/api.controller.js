export default class ApiController {
  getStatus(req, res) {
    res.status(200).json({
      message: "Biblioteca Aurora API em execução",
      success: true,
      version: "1.0.0"
    });
  }
}
