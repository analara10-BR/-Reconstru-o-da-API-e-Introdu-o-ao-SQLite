import ClientesModel from "../models/clientes.model.js";
import { gerarHashSenha, verificarSenha } from "../utils/senha.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONE_REGEX = /^[0-9()+\-\s]{8,20}$/;
const NOME_COOKIE = "brecho.sid";

// Gera um NOVO id de sessão (evita "fixação de sessão") e guarda o id do cliente nela
const iniciarSessao = (req, idCliente) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((erro) => {
      if (erro) return reject(erro);
      req.session.clienteId = idCliente;
      req.session.save((erroSalvar) => (erroSalvar ? reject(erroSalvar) : resolve()));
    });
  });

export default class AuthController {
  constructor() {
    this.model = new ClientesModel();
  }

  // POST /api/auth/cadastro
  async cadastrar(req, res, next) {
    try {
      const nome = String(req.body?.nome ?? "").trim();
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      const telefone = String(req.body?.telefone ?? "").trim();
      const senha = String(req.body?.senha ?? "");
      const confirmar = req.body?.confirmar_senha;

      // VALIDAÇÃO: todos os campos são obrigatórios e precisam ter um formato aceitável
      const erros = [];
      if (nome.length < 2 || nome.length > 100) erros.push("Informe seu nome (2 a 100 caracteres).");
      if (!EMAIL_REGEX.test(email) || email.length > 120) erros.push("Informe um e-mail válido.");
      if (!TELEFONE_REGEX.test(telefone)) erros.push("Informe um telefone válido, ex.: (85) 99999-0000.");
      if (senha.length < 6 || senha.length > 72) erros.push("A senha deve ter de 6 a 72 caracteres.");
      if (confirmar !== undefined && confirmar !== senha) erros.push("As senhas não conferem.");
      if (erros.length > 0) return res.status(400).json({ message: "Dados inválidos!", erros });

      // E-mail duplicado: conferimos antes, e o UNIQUE da tabela garante no banco
      if (this.model.emailJaCadastrado(email)) {
        return res.status(409).json({ message: "Este e-mail já está cadastrado. Faça login." });
      }

      // HASH: a senha é transformada antes de ir para o banco. A senha original não é salva.
      const senhaHash = await gerarHashSenha(senha);
      const cliente = this.model.create({ nome, email, telefone, senhaHash });

      // Depois do cadastro a pessoa já fica logada
      await iniciarSessao(req, cliente.id_cliente);
      return res.status(201).json({ message: "Cadastro realizado! Você já está conectada.", cliente });
    } catch (error) {
      if (String(error.code) === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(409).json({ message: "Este e-mail já está cadastrado. Faça login." });
      }
      next(error);
    }
  }

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      const senha = String(req.body?.senha ?? "");
      if (!email || !senha) {
        return res.status(400).json({ message: "Informe e-mail e senha." });
      }

      const cliente = this.model.findByEmailComSenha(email);
      // Mesma mensagem para "e-mail não existe" e "senha errada": não revela quais e-mails estão cadastrados
      const senhaConfere = cliente ? await verificarSenha(senha, cliente.senha_hash) : false;
      if (!senhaConfere) {
        return res.status(401).json({ message: "E-mail ou senha incorretos." });
      }

      await iniciarSessao(req, cliente.id_cliente);
      return res.status(200).json({ message: `Que bom te ver, ${cliente.nome}!`, cliente: this.model.findById(cliente.id_cliente) });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/logout: apaga a sessão no servidor e o cookie no navegador
  async logout(req, res, next) {
    req.session.destroy((erro) => {
      if (erro) return next(erro);
      res.clearCookie(NOME_COOKIE);
      return res.status(200).json({ message: "Você saiu da sua conta." });
    });
  }

  // GET /api/auth/me: quem está logado agora (sem dados sensíveis)
  async me(req, res) {
    if (!req.cliente) return res.status(401).json({ message: "Ninguém conectado." });
    return res.status(200).json({ cliente: req.cliente });
  }
}

export { NOME_COOKIE };
