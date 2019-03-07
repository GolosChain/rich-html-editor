// @flow
import { Editor } from "slate";
import { getEventTransfer } from "slate-react";
import Html from "../serializer";

export default function HtmlPaste() {
  return {
    onPaste(ev: SyntheticKeyboardEvent<*>, editor: Editor, next: Function) {
      const transfer = getEventTransfer(ev);
      if (transfer.type !== "html") {
        return next();
      }

      const fragment = Html.deserialize(transfer.html);
      editor.insertFragment(fragment.document);
    },
  };
}
