import image from "../public/manga_genkou.png";

/**
 * Canvas に画像を表示する
 *
 * @param canvasElement
 */
export function viewCanvas(canvasElement: HTMLCanvasElement) {
  const width = canvasElement.width;
  const height = canvasElement.height;

  const ctx = canvasElement.getContext("2d");

  if (ctx == null) {
    return;
  }

  const img = new Image();
  img.src = image;
  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);
  };
}
