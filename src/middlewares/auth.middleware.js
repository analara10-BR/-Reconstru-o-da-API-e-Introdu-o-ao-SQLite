import ClientesModel from "../models/clientes.model.js";

const clientes = new ClientesModel();

/*
  Middleware GLOBAL: roda em toda requisição.
  Se existir um id de cliente na sessão, busca o cliente no banco e deixa disponível em:
  - req.cliente        -> para os controllers
  - res.locals.usuario -> para as views EJS (ex.: mostrar "Olá, Ana" e o botão Sair no header)
  O objeto NÃO tem a senha (findById não seleciona senha_hash).
*/
export const carregarUsuario = (req, res, next) => {
  const id = req.session?.clienteId;
  const cliente = id ? clientes.findById(id) : null;
  if (id && !cliente) delete req.session.clienteId; // conta não existe mais
  req.cliente = cliente;
  res.locals.usuario = cliente;
  next();
};

/*
  Middleware de PROTEÇÃO de rotas: colocado antes do controller nas rotas que exigem login
  (cadastrar, editar e excluir peças). Se ninguém estiver logado, responde 401 e o controller
  nem chega a ser executado.
*/
export const exigirLogin = (req, res, next) => {
  if (!req.cliente) {
    return res.status(401).json({
      message: "Para anunciar uma peça, entre na sua conta ou faça seu cadastro.",
      login: "/login",
      cadastro: "/cadastro",
    });
  }
  next();
};
