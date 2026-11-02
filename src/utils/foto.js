import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// As fotos enviadas ficam em public/uploads/ e são servidas pelo express.static como /uploads/arquivo
export const UPLOADS_DIR = path.join(import.meta.dirname, "..", "..", "public", "uploads");
export const FOTO_TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB

const EXTENSOES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

// O navegador envia a foto como "data URL": data:image/png;base64,AAAA...
// Esta função separa o tipo da imagem e converte o texto base64 de volta para bytes.
export function lerFotoBase64(dataUrl) {
  const partes = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ""));
  if (!partes) return null;
  return { tipo: partes[1], buffer: Buffer.from(partes[2], "base64") };
}

// Salva a foto com um nome aleatório (evita sobrescrever arquivos e nomes maliciosos)
// e devolve o caminho público que vai para a coluna produto.imagem_url
export function salvarFoto(dataUrl) {
  const arquivo = lerFotoBase64(dataUrl);
  if (!arquivo) return null;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const nome = `${crypto.randomUUID()}.${EXTENSOES[arquivo.tipo]}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, nome), arquivo.buffer);
  return `/uploads/${nome}`;
}
