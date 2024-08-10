import { AbstractEvent } from "./config";

export class Zoom implements AbstractEvent {
  private targetElement: HTMLElement;
  private zoomElement?: HTMLElement;
  private previewMode: boolean;
  private previewCenterElement?: HTMLElement;

  private pointerEvents: PointerEvent[];
  private previousDiff: number;
  private scale: number;
  private dx: number;
  private dy: number;
  private maxDx: number;
  private maxDy: number;

  constructor(targetElement: HTMLElement, previewMode: boolean) {
    this.targetElement = targetElement;
    this.zoomElement =
      this.targetElement.querySelector<HTMLElement>(".js-zoom") ?? undefined;
    this.previewMode = previewMode;

    this.pointerEvents = [];
    this.previousDiff = -1;
    this.scale = 1;

    this.dx = 0;
    this.dy = 0;

    this.maxDx = -1;
    this.maxDy = -1;

    // プレビュー用表示設定
    if (this.previewMode && this.zoomElement) {
      this.zoomElement.style.border = "2px solid green";
    }
    if (this.previewMode) {
      this.previewCenterElement = document.createElement("div");
      this.previewCenterElement.style.position = "absolute";
      this.previewCenterElement.style.width = "10px";
      this.previewCenterElement.style.height = "10px";
      this.previewCenterElement.style.backgroundColor = "yellow";
      document.body.appendChild(this.previewCenterElement);
    }

    this.initEvents();
  }

  initEvents() {
    this.pointerDown = this.pointerDown.bind(this);
    this.pointerMove = this.pointerMove.bind(this);
    this.pointerUp = this.pointerUp.bind(this);

    this.targetElement.addEventListener("pointerdown", this.pointerDown);
    this.targetElement.addEventListener("pointermove", this.pointerMove);
    this.targetElement.addEventListener("pointerup", this.pointerUp);
    this.targetElement.addEventListener("pointercancel", this.pointerUp);
    this.targetElement.addEventListener("pointerout", this.pointerUp);
    this.targetElement.addEventListener("pointerleave", this.pointerUp);
  }

  private async pointerDown(event: PointerEvent) {
    this.pointerEvents.push(event);
  }

  private async pointerMove(event: PointerEvent) {
    // キャッシュ内で同じイベントを見つけ、記録を更新
    const pointerEventIndex = this.pointerEvents.findIndex(
      (pointerEvent) => pointerEvent.pointerId === event.pointerId
    );
    this.pointerEvents[pointerEventIndex] = event;

    // ダブルタップ時の処理
    if (this.pointerEvents.length === 2) {
      // 2点間の距離を計算
      const currentDiff = Math.sqrt(
        Math.pow(
          this.pointerEvents[1].clientX - this.pointerEvents[0].clientX,
          2
        ) +
          Math.pow(
            this.pointerEvents[1].clientY - this.pointerEvents[0].clientY,
            2
          )
      );

      if (this.previousDiff > 0) {
        const pinchCenterX =
          (this.pointerEvents[0].clientX + this.pointerEvents[1].clientX) / 2;
        const pinchCenterY =
          (this.pointerEvents[0].clientY + this.pointerEvents[1].clientY) / 2;

        if (this.maxDx === -1 && this.maxDy === -1) {
          this.maxDx = pinchCenterX;
          this.maxDy = pinchCenterY;
        }

        // pinchCenter を表示する
        if (this.previewMode && this.previewCenterElement) {
          this.previewCenterElement.style.left = `${pinchCenterX}px`;
          this.previewCenterElement.style.top = `${pinchCenterY}px`;
        }

        this.dx = pinchCenterX * this.scale;
        this.dy = pinchCenterY * this.scale;

        // スケール計算
        const zoomMagnification = currentDiff / this.previousDiff;
        this.scale = Math.max(this.scale * zoomMagnification, 0.7);

        // css 反映
        if (this.zoomElement) {
          this.zoomElement.style.transition = "transform 0s";
          this.zoomElement.style.transform = `translate3d(${this.dx}px, ${this.dy}px, 0px) scale(${this.scale})`;
        }

        // プレビュー用
        if (this.previewMode) {
          if (currentDiff > this.previousDiff) {
            this.targetElement.style.backgroundColor = "red";
          }
          // zoom out
          else if (currentDiff < this.previousDiff) {
            this.targetElement.style.backgroundColor = "blue";
          }
        }
      }

      this.previousDiff = currentDiff;
    }
  }

  private async pointerUp(event: PointerEvent) {
    const pointerEventIndex = this.pointerEvents.findIndex(
      (pointerEvent) => pointerEvent.pointerId === event.pointerId
    );
    if (pointerEventIndex === -1) return;

    this.pointerEvents.splice(pointerEventIndex, 1);
    this.previousDiff = -1;

    if (this.previewMode) this.targetElement.style.backgroundColor = "";

    this.resetScale();
  }

  /**
   * スケールが1より小さい場合、1にリセットする
   * アニメーション付き
   */
  private resetScale() {
    if (this.scale < 1) {
      this.scale = 1;

      this.dx = 0;
      this.dy = 0;

      this.maxDx = -1;
      this.maxDy = -1;

      if (this.zoomElement) {
        this.zoomElement.style.transform = `scale(${this.scale})`;
        this.zoomElement.style.transition = "transform 0.3s";
      }
    }
  }

  /**
   * 後処理
   */
  public destroy() {
    this.targetElement.removeEventListener("pointerdown", this.pointerDown);
    this.targetElement.removeEventListener("pointermove", this.pointerMove);
    this.targetElement.removeEventListener("pointerup", this.pointerUp);
    this.targetElement.removeEventListener("pointercancel", this.pointerUp);
    this.targetElement.removeEventListener("pointerout", this.pointerUp);
    this.targetElement.removeEventListener("pointerleave", this.pointerUp);

    if (this.previewMode) {
      if (this.previewCenterElement)
        document.body.removeChild(this.previewCenterElement);

      if (this.zoomElement) this.zoomElement.style.border = "";
    }
  }
}
