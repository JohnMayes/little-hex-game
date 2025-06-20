import { mainCanvasSize } from "@littlejs";
import { createUI, UIMenu } from "./UI/createUI"

let uiRoot: UIMenu;

export function setCursor(cursor: string) {
  document.body.style.cursor = cursor;
}

export const UIManager = {
  init() {
    uiRoot = createUI();
  },

  render() {
    uiRoot.pos.x = uiRoot.size.x / 2;
    uiRoot.pos.y = mainCanvasSize.y - (uiRoot.size.y / 2);
  }
};
