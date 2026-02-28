export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .replace(/[^a-z0-9\s-]/g, "") // elimina caracteres raros
    .trim()
    .replace(/\s+/g, "-"); // espacios convierte en guiones
