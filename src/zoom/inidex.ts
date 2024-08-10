import { disableBrowserZoom } from "./browserConfig";
import { configEvent } from "./config";
import { Zoom } from "./zoom";

export async function zoom() {
  const contentItemElement =
    document.querySelector<HTMLElement>(".content-item");
  if (contentItemElement == null) return;

  disableBrowserZoom(contentItemElement);

  configEvent((config) => {
    const zoom = new Zoom(contentItemElement, config.showPreview);

    return zoom;
  });
}
