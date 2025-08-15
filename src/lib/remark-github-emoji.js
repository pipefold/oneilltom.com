// old version
//
// import { visit } from "unist-util-visit";

// export function remarkGithubEmoji() {
//   return function (tree) {
//     visit(tree, "text", function (node) {
//       // Replace :github: with a theme-aware image
//       if (node.value.includes(":github:")) {
//         const githubEmoji = {
//           type: "html",
//           value:
//             '<img src="/emojis/github-dark.svg" alt="GitHub" class="github-emoji dark:hidden inline-block" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em;" /><img src="/emojis/github-light.svg" alt="GitHub" class="github-emoji hidden dark:inline-block" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em;" />',
//         };

//         // Replace the text node with the emoji
//         Object.assign(node, githubEmoji);
//       }
//     });
//   };
// }

// mid version

// import { visit } from "unist-util-visit";

// export function remarkGithubEmoji() {
//   return function (tree) {
//     visit(tree, "text", function (node, index, parent) {
//       const value = node.value;
//       const regex = /:github:/g;
//       const newNodes = [];
//       let lastIndex = 0;

//       let match;
//       while ((match = regex.exec(value)) !== null) {
//         const before = value.substring(lastIndex, match.index);
//         if (before) {
//           newNodes.push({ type: "text", value: before });
//         }
//         newNodes.push({
//           type: "html",
//           value:
//             '<img src="/emojis/github-dark.svg" alt="GitHub" class="m-0 github-emoji dark:hidden inline-block" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em;" /><img src="/emojis/github-light.svg" alt="GitHub" class="github-emoji hidden dark:inline-block" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em;" />',
//         });
//         lastIndex = regex.lastIndex;
//       }

//       const after = value.substring(lastIndex);
//       if (after) {
//         newNodes.push({ type: "text", value: after });
//       }

//       // Only replace if we found at least one match
//       if (newNodes.length > 0) {
//         parent.children.splice(index, 1, ...newNodes);
//       }
//     });
//   };
// }

import { visit } from "unist-util-visit";

export function remarkGithubEmoji() {
  return function (tree) {
    visit(tree, "text", function (node, index, parent) {
      const value = node.value;
      const regex = /:github:/g;
      const newNodes = [];
      let lastIndex = 0;

      let match;
      while ((match = regex.exec(value)) !== null) {
        const before = value.substring(lastIndex, match.index);
        if (before) {
          newNodes.push({ type: "text", value: before });
        }
        newNodes.push({
          type: "html",
          value:
            '<img src="/emojis/github-dark.svg" alt="GitHub" class="github-emoji dark:hidden inline-block" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em; margin: 0;" /><img src="/emojis/github-light.svg" alt="GitHub" class="github-emoji hidden dark:inline-block" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em; margin: 0;" />',
        });
        lastIndex = regex.lastIndex;
      }

      const after = value.substring(lastIndex);
      if (after) {
        newNodes.push({ type: "text", value: after });
      }

      // Only replace if we found at least one match
      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
}
