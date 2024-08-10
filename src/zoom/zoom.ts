import { AbstractEvent } from "./config";

export class Zoom implements AbstractEvent {
  private targetElement: HTMLElement;
  private previewMode: boolean;

  private pointerEvents: PointerEvent[];
  private previousDiff: number;

  constructor(targetElement: HTMLElement, previewMode: boolean) {
    this.targetElement = targetElement;
    this.previewMode = previewMode;

    this.pointerEvents = [];
    this.previousDiff = -1;

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
        // zoom in
        if (currentDiff > this.previousDiff) {
          if (this.previewMode)
            this.targetElement.style.backgroundColor = "red";
        }
        // zoom out
        else if (currentDiff < this.previousDiff) {
          if (this.previewMode)
            this.targetElement.style.backgroundColor = "blue";
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
  }

  /**
   * 後処理
   */
  public destroy() {
    try {
      this.targetElement.removeEventListener("pointerdown", this.pointerDown);
      this.targetElement.removeEventListener("pointermove", this.pointerMove);
      this.targetElement.removeEventListener("pointerup", this.pointerUp);
      this.targetElement.removeEventListener("pointercancel", this.pointerUp);
      this.targetElement.removeEventListener("pointerout", this.pointerUp);
      this.targetElement.removeEventListener("pointerleave", this.pointerUp);
    } catch (e) {
      alert(e);
    }
  }
}
