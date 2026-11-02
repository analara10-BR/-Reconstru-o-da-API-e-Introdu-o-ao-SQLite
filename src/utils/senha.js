import crypto from "node:crypto";
import { promisify } from "node:util";

// scrypt é uma função de hash própria para senhas (vem no Node, não precisa instalar nada).
// Ela é propositalmente "lenta", o que dificulta ataques de força bruta.
const scrypt = promisify(crypto.scrypt);
const TAMANHO_HASH = 64;

/*
  Gera o hash da senha.
  - salt: 16 bytes aleatórios, diferentes para cada usuário. Assim, duas pessoas com a
    mesma senha ficam com hashes diferentes.
  - O resultado guardado no banco é "scrypt$salt$hash" (em hexadecimal).
  - Hash não tem "volta": não dá para descobrir a senha a partir dele.
*/
export async function gerarHashSenha(senha) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(senha, salt, TAMANHO_HASH);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

/*
  Confere a senha digitada no login: calcula o hash dela com o MESMO salt
  e compara com o hash salvo. timingSafeEqual compara em tempo constante,
  para não dar pistas pelo tempo de resposta.
*/
export async function verificarSenha(senha, hashSalvo) {
  const [algoritmo, salt, hashHex] = String(hashSalvo ?? "").split("$");
  if (algoritmo !== "scrypt" || !salt || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await scrypt(senha, salt, esperado.length);
  return esperado.length === calculado.length && crypto.timingSafeEqual(esperado, calculado);
}
