import "./style.css";
import { viewCanvas } from "./viewCanvas";
import { zoom } from "./zoom/inidex";

function setup() {
  const canvasElement = document.querySelector<HTMLCanvasElement>(".js-view");
  if (canvasElement != null) {
    viewCanvas(canvasElement);
  }
}

async function main() {
  setup();

  await zoom();
}

void main();
