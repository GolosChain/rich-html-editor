// @flow
import React from "react";
import Html from "slate-html-serializer";
import InlineCode from "./marks";

const BLOCK_TAGS = {
  p: "paragraph",
  ul: "bulleted-list",
  li: "list-item",
  ol: "numbered-list",
  blockquote: "block-quote",
  pre: "code",
  h1: "heading1",
  h2: "heading2",
  h3: "heading3",
  h4: "heading4",
  h5: "heading5",
  h6: "heading6",
};

/**
 * Tags to marks.
 *
 * @type {Object}
 */

const MARK_TAGS = {
  strong: "bold",
  em: "italic",
  u: "underline",
  s: "strikethrough",
  code: "code",
};

const rules = [
  {
    deserialize(el, next) {
      const block = BLOCK_TAGS[el.tagName.toLowerCase()];

      if (block) {
        return {
          object: "block",
          type: block,
          nodes: next(el.childNodes),
        };
      }
    },
    serialize(obj, children) {
      if (obj.object === "block") {
        switch (obj.type) {
          case "code":
            return (
              <pre>
                <code>{children}</code>
              </pre>
            );
          case "code-line":
            return <pre>{children}</pre>;
          case "heading1":
            return <h1>{children}</h1>;
          case "heading2":
            return <h3>{children}</h3>;
          case "heading3":
            return <h3>{children}</h3>;
          case "heading4":
            return <h4>{children}</h4>;
          case "heading5":
            return <h5>{children}</h5>;
          case "heading6":
            return <h6>{children}</h6>;
          case "paragraph":
            return <p className={obj.data.get("className")}>{children}</p>;
          case "block-quote":
            return <blockquote>{children}</blockquote>;
          case "bulleted-list":
          case "todo-list":
            return <ul>{children}</ul>;
          case "todo-item":
          case "list-item":
            return <li>{children}</li>;
          case "numbered-list":
          case "ordered-list":
            return <ol>{children}</ol>;
          case "horizontal-rule":
            return <hr />;
        }
      }
    },
  },
  // Add a new rule that handles marks...
  {
    deserialize(el, next) {
      const mark = MARK_TAGS[el.tagName.toLowerCase()];

      if (mark) {
        return {
          object: "mark",
          type: mark,
          nodes: next(el.childNodes),
        };
      }
    },
    serialize(obj, children) {
      if (obj.object === "mark") {
        switch (obj.type) {
          case "bold":
            return <strong>{children}</strong>;
          case "italic":
            return <em>{children}</em>;
          case "underline":
            return <u>{children}</u>;
          case "strikethrough":
            return <s>{children}</s>;
          case "code":
            return <code>{children}</code>;
          case "deleted":
            return <del>{children}</del>;
          case "inserted":
            return <mark>{children}</mark>;
        }
      }
    },
  },
  {
    // Special case for code blocks, which need to grab the nested childNodes.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() === "pre") {
        const code = el.childNodes[0];
        const childNodes =
          code && code.tagName.toLowerCase() === "code"
            ? code.childNodes
            : el.childNodes;

        return {
          object: "block",
          type: "code",
          nodes: next(childNodes),
        };
      }
    },
  },
  {
    // Special case for images, to grab their src.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() === "img") {
        console.log('deserialize', el)
        return {
          object: "block",
          type: "image",
          nodes: next(el.childNodes),
          data: {
            src: el.getAttribute("src"),
            alt: el.getAttribute("alt"),
          },
        };
      }
    },
    serialize(obj) {
      if (obj.object === "block") {
        switch (obj.type) {
          case "image": {
            console.log('serialize', obj)
            const src = obj.data.get("src");
            const alt = obj.data.get("alt");
            return <img src={src} alt={alt} />;
          }
        }
      }
    },
  },
  {
    // Special case for links, to grab their href.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() === "a") {
        return {
          object: "inline",
          type: "link",
          nodes: next(el.childNodes),
          data: {
            href: el.getAttribute("href"),
          },
        };
      }
    },
    serialize(obj, children) {
      if (obj.object === "inline") {
        switch (obj.type) {
          case "link":
            return <a href={obj.data.get("href")}>{children}</a>;
        }
      }
      if (obj.object === "block") {
        switch (obj.type) {
          case "link":
            return <a href={obj.data.get("href")}>{children}</a>;
        }
      }
    },
  },
];

// export default new Html({ rules });
export default new Html({ rules });
