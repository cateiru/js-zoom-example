export type Config = {
  showPreview: boolean;
};

export interface AbstractEvent {
  destroy(): void;
}

const EVENTS: AbstractEvent[] = [];

/**
 * 設定変更イベントを監視するラッパー関数
 *
 * @param fn 設定変更時の処理
 */
export function configEvent(
  fn: (
    config: Config
  ) => void | Promise<void> | AbstractEvent | Promise<AbstractEvent>
) {
  const configElement = document.querySelector<HTMLElement>(".js-config");
  if (configElement == null) return;

  const event = async () => {
    // 後処理
    EVENTS.forEach((e) => e.destroy());
    EVENTS.splice(0);

    const e = await fn(getConfig(configElement));

    if (e != null) {
      EVENTS.push(e);
    }
  };

  addEventListener("change", event);
  event();
}

/**
 * 設定を取得
 *
 * @param configElement config の全体要素
 * @returns 設定
 */
function getConfig(configElement: HTMLElement): Config {
  const showPreviewConfig =
    configElement.querySelector<HTMLInputElement>(".js-show-preview");

  return {
    showPreview: showPreviewConfig != null ? showPreviewConfig.checked : false,
  };
}
