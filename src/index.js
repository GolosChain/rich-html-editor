// @flow
import * as React from "react";
import { Value, Change } from "slate";
import { Editor } from "slate-react";
import styled from "styled-components";
import keydown from "react-keydown";
import type { SlateNodeProps, Plugin } from "./types";
import getDataTransferFiles from "./lib/getDataTransferFiles";
import isModKey from "./lib/isModKey";
import Flex from "./components/Flex";
import ClickablePadding from "./components/ClickablePadding";
import Toolbar from "./components/Toolbar";
import BlockInsert from "./components/BlockInsert";
import Placeholder from "./components/Placeholder";
import Contents from "./components/Contents";
import Markdown from "./serializer";
import createPlugins from "./plugins";
import { insertImageFile } from "./changes";
import renderMark from "./marks";
import createRenderNode from "./nodes";
import schema from "./schema";

type Props = {
  text: string,
  onChange: Change => *,
  onSave: ({ redirect?: boolean, publish?: boolean }) => *,
  onCancel: () => void,
  onImageUploadStart: () => void,
  onImageUploadStop: () => void,
  emoji?: string,
  readOnly: boolean,
};

type State = {
  editorValue: Value,
  editorLoaded: boolean,
};
class MarkdownEditor extends React.Component<Props, State> {
  editor: Editor;
  renderNode: SlateNodeProps => *;
  plugins: Plugin[];

  constructor(props: Props) {
    super(props);

    this.renderNode = createRenderNode({
      onInsertImage: this.insertImageFile,
    });
    this.plugins = createPlugins({
      onImageUploadStart: props.onImageUploadStart,
      onImageUploadStop: props.onImageUploadStop,
    });

    this.setState({ editorValue: Markdown.deserialize(props.text) });
  }

  componentDidMount() {
    if (this.props.readOnly) return;
    if (this.props.text) {
      this.focusAtEnd();
    } else {
      this.focusAtStart();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.readOnly && !this.props.readOnly) {
      this.focusAtEnd();
    }
  }

  setEditorRef = (ref: Editor) => {
    this.editor = ref;
    // Force re-render to show ToC (<Content />)
    this.setState({ editorLoaded: true });
  };

  onChange = (change: Change) => {
    if (this.state.editorValue !== change.value) {
      this.props.onChange(Markdown.serialize(change.value));
      this.setState({ editorValue: change.value });
    }
  };

  handleDrop = async (ev: SyntheticDragEvent<*>) => {
    if (this.props.readOnly) return;
    // check if this event was already handled by the Editor
    if (ev.isDefaultPrevented()) return;

    // otherwise we'll handle this
    ev.preventDefault();
    ev.stopPropagation();

    const files = getDataTransferFiles(ev);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        await this.insertImageFile(file);
      }
    }
  };

  insertImageFile = (file: window.File) => {
    this.editor.change(change =>
      change.call(
        insertImageFile,
        file,
        this.editor,
        this.props.onImageUploadStart,
        this.props.onImageUploadStop
      )
    );
  };

  cancelEvent = (ev: SyntheticEvent<*>) => {
    ev.preventDefault();
  };

  // Handling of keyboard shortcuts outside of editor focus
  @keydown("meta+s")
  onSave(ev: SyntheticKeyboardEvent<*>) {
    if (this.props.readOnly) return;

    ev.preventDefault();
    ev.stopPropagation();
    this.props.onSave({ redirect: false });
  }

  @keydown("meta+enter")
  onSaveAndExit(ev: SyntheticKeyboardEvent<*>) {
    if (this.props.readOnly) return;

    ev.preventDefault();
    ev.stopPropagation();
    this.props.onSave({ redirect: true });
  }

  @keydown("esc")
  onCancel() {
    if (this.props.readOnly) return;
    this.props.onCancel();
  }

  // Handling of keyboard shortcuts within editor focus
  onKeyDown = (ev: SyntheticKeyboardEvent<*>, change: Change) => {
    if (!isModKey(ev)) return;

    switch (ev.key) {
      case "s":
        this.onSave(ev);
        return change;
      case "Enter":
        this.onSaveAndExit(ev);
        return change;
      case "Escape":
        this.onCancel();
        return change;
      default:
    }
  };

  focusAtStart = () => {
    this.editor.change(change =>
      change.collapseToStartOf(change.value.document).focus()
    );
  };

  focusAtEnd = () => {
    this.editor.change(change =>
      change.collapseToEndOf(change.value.document).focus()
    );
  };

  render = () => {
    const { readOnly, emoji, onSave } = this.props;

    return (
      <Flex
        onDrop={this.handleDrop}
        onDragOver={this.cancelEvent}
        onDragEnter={this.cancelEvent}
        align="flex-start"
        justify="center"
        auto
      >
        <MaxWidth column auto>
          <Header onClick={this.focusAtStart} readOnly={readOnly} />
          {readOnly &&
            this.state.editorLoaded &&
            this.editor && <Contents editor={this.editor} />}
          {!readOnly &&
            this.editor && (
              <Toolbar value={this.state.editorValue} editor={this.editor} />
            )}
          {!readOnly &&
            this.editor && (
              <BlockInsert
                editor={this.editor}
                onInsertImage={this.insertImageFile}
              />
            )}
          <StyledEditor
            innerRef={this.setEditorRef}
            placeholder="Start with a title…"
            bodyPlaceholder="…the rest is your canvas"
            plugins={this.plugins}
            emoji={emoji}
            value={this.state.editorValue}
            renderNode={this.renderNode}
            renderMark={renderMark}
            schema={schema}
            onKeyDown={this.onKeyDown}
            onChange={this.onChange}
            onSave={onSave}
            readOnly={readOnly}
            spellCheck={!readOnly}
          />
          <ClickablePadding
            onClick={!readOnly ? this.focusAtEnd : undefined}
            grow
          />
        </MaxWidth>
      </Flex>
    );
  };
}

const MaxWidth = styled(Flex)`
  padding: 0 20px;
  max-width: 100vw;
  height: 100%;
`;

const Header = styled(Flex)`
  height: 60px;
  flex-shrink: 0;
  align-items: flex-end;
  ${({ readOnly }) => !readOnly && "cursor: text;"};

  @media print {
    display: none;
  }
`;

const StyledEditor = styled(Editor)`
  font-weight: 400;
  font-size: 1em;
  line-height: 1.7em;
  width: 100%;
  color: #1b2830;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: 500;
  }

  h1:first-of-type {
    ${Placeholder} {
      visibility: visible;
    }
  }

  p:nth-child(2) {
    ${Placeholder} {
      visibility: visible;
    }
  }

  ul,
  ol {
    margin: 0 0.1em;
    padding-left: 1em;

    ul,
    ol {
      margin: 0.1em;
    }
  }

  p {
    position: relative;
    margin: 0;
  }

  a:hover {
    text-decoration: ${({ readOnly }) => (readOnly ? "underline" : "none")};
  }

  li p {
    display: inline;
    margin: 0;
  }

  .todoList {
    list-style: none;
    padding-left: 0;

    .todoList {
      padding-left: 1em;
    }
  }

  .todo {
    span:last-child:focus {
      outline: none;
    }
  }

  blockquote {
    border-left: 3px solid #efefef;
    margin: 0;
    padding-left: 10px;
    font-style: italic;
  }

  table {
    border-collapse: collapse;
  }

  tr {
    border-bottom: 1px solid #eee;
  }

  th {
    font-weight: bold;
  }

  th,
  td {
    padding: 5px 20px 5px 0;
  }

  b,
  strong {
    font-weight: 600;
  }
`;

export default MarkdownEditor;