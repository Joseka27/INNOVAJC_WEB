/* Resize Image before send it to supabase bucket */
export async function resizeImageToWebp(
  file: File,
  opts?: { maxW?: number; maxH?: number; quality?: number },
): Promise<File> {
  /* Max image size*/
  const maxW = opts?.maxW ?? 1000;
  const maxH = opts?.maxH ?? 1000;
  const quality = opts?.quality ?? 0.82;

  /* Validate that file is an image */
  if (!file.type.startsWith("image/"))
    throw new Error("El archivo no es una imagen.");

  /*temporal files in memory */
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);

  try {
    /* wait to file to upload before read the H and W */
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve(); /* Loaded */
      img.onerror = () =>
        reject(new Error("No se pudo leer la imagen.")); /* Error */
      img.src = url;
    });

    /* New size dimensions */
    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);

    /* Create canvas with final dimensions */
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    /* canvas context 2D */
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible.");

    /* draw image in the canvas */
    ctx.drawImage(img, 0, 0, w, h);

    /* Transform Canvas to .WEBP */
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("No se pudo comprimir la imagen.")),
        "image/webp",
        quality,
      );
    });

    /* Rename the image */
    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
