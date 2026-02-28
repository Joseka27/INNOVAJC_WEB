//redimensionar el tamaño de la imagen
export async function resizeImageToWebp(
  file: File,
  opts?: { maxW?: number; maxH?: number; quality?: number },
): Promise<File> {
  //tamaño maximo
  const maxW = opts?.maxW ?? 1000;
  const maxH = opts?.maxH ?? 1000;
  const quality = opts?.quality ?? 0.82;

  //valida que sea imagen
  if (!file.type.startsWith("image/"))
    throw new Error("El archivo no es una imagen.");

  //archivo temporal
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);

  try {
    //esperar archivo antes de leer o escribir
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = url;
    });

    //nuevo tamaño
    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);

    //crea un canva del nuevo tamaño en 2D para imprimir la imagen y guardar
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible.");

    ctx.drawImage(img, 0, 0, w, h);

    //transforma a webp
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("No se pudo comprimir la imagen.")),
        "image/webp",
        quality,
      );
    });

    //Renombra el archivo
    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
