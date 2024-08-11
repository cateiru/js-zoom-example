import { AbstractEvent } from "./config";

export class Zoom implements AbstractEvent {
  private targetElement: HTMLElement;
  private zoomElement?: HTMLElement;
  private displayScaleElement?: HTMLElement;
  private previewMode: boolean;
  private previewCenterElement?: HTMLElement;

  private pointerEvents: PointerEvent[];
  // 前の2点間の距離
  private previousDiff: number;
  // 拡大率
  private scale: number;
  // 最小・最大拡大率
  private scaleMin: number;
  private scaleMax: number;
  // 移動量
  private dx: number;
  private dy: number;
  // ズーム専用の移動量
  private zoomDx: number;
  private zoomDy: number;
  // targetElement の幅と高さ
  private targetWidth: number;
  private targetHeight: number;
  // ズーム中かどうか
  private hasZoomed: boolean;
  // ズーム時の中心座標
  private zoomCenter: [number, number];
  // 前回の中心座標
  private previousPinchPosition: [number, number];

  constructor(targetElement: HTMLElement, previewMode: boolean) {
    this.targetElement = targetElement;
    this.zoomElement =
      this.targetElement.querySelector<HTMLElement>(".js-zoom") ?? undefined;
    this.displayScaleElement =
      document.querySelector<HTMLElement>(".js-scale") ?? undefined;
    this.previewMode = previewMode;

    this.pointerEvents = [];
    this.previousDiff = -1;
    this.scale = 1;
    this.scaleMin = 0.7;
    this.scaleMax = 4;
    this.dx = 0;
    this.dy = 0;
    this.zoomDx = 0;
    this.zoomDy = 0;
    this.targetWidth = this.targetElement.clientWidth;
    this.targetHeight = this.targetElement.clientHeight;
    this.hasZoomed = false;
    this.previousPinchPosition = [-1, -1];
    this.zoomCenter = [-1, -1];

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
    if (this.displayScaleElement) {
      this.displayScaleElement.textContent = `${this.scale}`;
    }

    this.initEvents();
  }

  initEvents() {
    this.pointerDown = this.pointerDown.bind(this);
    this.pointerMove = this.pointerMove.bind(this);
    this.pointerUp = this.pointerUp.bind(this);
    this.touchmove = this.touchmove.bind(this);

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

    // シングルタップ時の処理
    if (this.pointerEvents.length === 1 && this.hasZoomed) {
      const pinchX = this.pointerEvents[0].clientX;
      const pinchY = this.pointerEvents[0].clientY;

      if (this.previewMode && this.previewCenterElement) {
        this.previewCenterElement.style.left = `${pinchX}px`;
        this.previewCenterElement.style.top = `${pinchY}px`;
      }

      if (
        this.previousPinchPosition[0] !== -1 &&
        this.previousPinchPosition[1] !== -1
      ) {
        // ピンチの中心座標を起点に移動する
        this.dx += pinchX - this.previousPinchPosition[0];
        this.dy += pinchY - this.previousPinchPosition[1];

        this.view();
      }

      this.previousPinchPosition = [pinchX, pinchY];
    }
    // ダブルタップ時の処理
    else if (this.pointerEvents.length === 2) {
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

      const pinchCenterX =
        (this.pointerEvents[0].clientX + this.pointerEvents[1].clientX) / 2;
      const pinchCenterY =
        (this.pointerEvents[0].clientY + this.pointerEvents[1].clientY) / 2;

      // pinchCenter を表示する
      if (this.previewMode && this.previewCenterElement) {
        this.previewCenterElement.style.left = `${pinchCenterX}px`;
        this.previewCenterElement.style.top = `${pinchCenterY}px`;
      }

      if (this.previousDiff > 0) {
        this.hasZoomed = true;
        // ズーム時はjsでxy移動させたいためスクロールを無効化する
        this.targetElement.addEventListener("touchmove", this.touchmove, {
          passive: false,
        });

        // 初回だけ、ズーム時の中心座標を取得する
        if (this.zoomCenter[0] === -1 && this.zoomCenter[1] === -1) {
          // targetElement の左上を原点としたピンチの中心座標
          this.zoomCenter[0] = pinchCenterX - this.targetElement.offsetLeft;
          this.zoomCenter[1] = pinchCenterY - this.targetElement.offsetTop;
        }

        // スケール計算
        const zoomMagnification = currentDiff / this.previousDiff;
        this.scale = Math.min(
          Math.max(this.scale * zoomMagnification, this.scaleMin),
          this.scaleMax
        );

        if (this.displayScaleElement) {
          this.displayScaleElement.textContent = `${this.scale}`;
        }

        if (this.scale > 5) {
          // これがないと最大からすぐズームアウトするさいに1瞬ラグになる
          this.previousDiff = -1;
          return;
        }

        // ピンチの中心座標を起点に拡大縮小するための移動量を計算する
        this.zoomDx =
          ((1 - this.scale) * (2 * this.zoomCenter[0] - this.targetWidth)) / 2;
        this.zoomDy =
          ((1 - this.scale) * (2 * this.zoomCenter[1] - this.targetHeight)) / 2;

        // ズーム時の横移動
        if (
          this.previousPinchPosition[0] !== -1 &&
          this.previousPinchPosition[1] !== -1
        ) {
          // ピンチの中心座標を起点に移動する
          this.dx += pinchCenterX - this.previousPinchPosition[0];
          this.dy += pinchCenterY - this.previousPinchPosition[1];
        }

        this.view();

        // プレビュー用
        if (this.previewMode) {
          if (currentDiff > this.previousDiff) {
            this.targetElement.style.backgroundColor = "red";
          }
          // zoom out
          else if (currentDiff < this.previousDiff) {
            this.targetElement.style.backgroundColor = "blue";
          } else {
            this.targetElement.style.backgroundColor = "";
          }
        }
      }

      this.previousDiff = currentDiff;
      this.previousPinchPosition = [pinchCenterX, pinchCenterY];
    }
  }

  private async pointerUp(event: PointerEvent) {
    const pointerEventIndex = this.pointerEvents.findIndex(
      (pointerEvent) => pointerEvent.pointerId === event.pointerId
    );
    if (pointerEventIndex === -1) return;

    this.pointerEvents.splice(pointerEventIndex, 1);
    this.previousDiff = -1;
    this.previousPinchPosition = [-1, -1];
    this.zoomCenter = [-1, -1];

    if (this.previewMode) this.targetElement.style.backgroundColor = "";

    // 1倍以下になった場合、1倍に戻す
    if (this.scale < 1) {
      this.resetScale();
    }
  }

  // css 反映
  private view() {
    if (this.zoomElement) {
      this.zoomElement.style.transition = "transform 0s";
      this.zoomElement.style.transform = `translate3d(${
        this.dx + this.zoomDx
      }px, ${this.dy + this.zoomDy}px, 0px) scale(${this.scale})`;
    }
  }

  /**
   * スケールが1より小さい場合、1にリセットする
   * アニメーション付き
   */
  private resetScale() {
    this.scale = 1;
    this.hasZoomed = false;
    this.dx = 0;
    this.dy = 0;
    this.zoomDx = 0;
    this.zoomDy = 0;

    // ズームをリセットしたらスクロール可能にしたいので、touchmove イベントを削除する
    this.targetElement.removeEventListener("touchmove", this.touchmove);

    if (this.zoomElement) {
      this.zoomElement.style.transform = `scale(${this.scale})`;
      this.zoomElement.style.transition = "transform 0.3s";
    }
    if (this.displayScaleElement) {
      this.displayScaleElement.textContent = `${this.scale}`;
    }
  }

  private touchmove(event: TouchEvent) {
    event.preventDefault();
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
    this.targetElement.removeEventListener("touchmove", this.touchmove);

    if (this.previewMode) {
      if (this.previewCenterElement)
        document.body.removeChild(this.previewCenterElement);

      if (this.zoomElement) this.zoomElement.style.border = "";
    }
  }
}
