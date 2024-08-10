import "./style.css";
import { viewCanvas } from "./viewCanvas";

function setup() {
  const canvasElement = document.querySelector<HTMLCanvasElement>(".js-view");
  if (canvasElement != null) {
    viewCanvas(canvasElement);
  }
}

async function main() {
  setup();
}

void main();
