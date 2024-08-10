/**
 * 引数に指定した要素に対して、ブラウザのズームを無効化する
 *
 * @param targetElement - ブラウザのズームを無効にしたい要素
 */
export function disableBrowserZoom(targetElement: HTMLElement) {
  targetElement.addEventListener(
    "touchstart",
    (event) => {
      // 二本指以上でタップでピンチイン・アウトを禁止
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}
