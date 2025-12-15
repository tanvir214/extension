// This script is injected into the page to access the Monaco editor instance.
(function () {
  let currentMatches = [];
  let currentMatchIndex = -1;
  let allDecorations = [];
  let currentDecoration = [];
  const editorElement = document.querySelector(".monaco-editor");
  if (editorElement) {
    const editor = window.monaco.editor.getEditors()[0];
    window.monacoHelperEditor = editor;
    window.dispatchEvent(new CustomEvent("monaco-helper-editor-ready"));

    const navigateToMatch = () => {
      if (currentMatchIndex > -1) {
        const currentMatch = currentMatches[currentMatchIndex];
        window.monacoHelperEditor.setSelection(currentMatch.range);
        window.monacoHelperEditor.revealRangeInCenter(currentMatch.range);

        // Highlight the current match differently
        const newCurrentDecoration = [
          {
            range: currentMatch.range,
            options: { inlineClassName: "mh-current-match" },
          },
        ];
        currentDecoration = window.monacoHelperEditor.deltaDecorations(
          currentDecoration,
          newCurrentDecoration
        );
      }

      window.dispatchEvent(
        new CustomEvent("monaco-helper-find-result", {
          detail: { matches: currentMatches, currentMatch: currentMatchIndex },
        })
      );
    };

    window.addEventListener("monaco-helper-find", (e) => {
      const { searchText } = e.detail;
      const model = window.monacoHelperEditor.getModel();
      currentMatches = model.findMatches(
        searchText,
        true,
        false,
        true,
        null,
        true
      );

      if (currentMatches.length > 0) {
        currentMatchIndex = 0;
        const newAllDecorations = currentMatches.map((match) => ({
          range: match.range,
          options: { inlineClassName: "mh-search-highlight" },
        }));
        allDecorations = window.monacoHelperEditor.deltaDecorations(
          allDecorations,
          newAllDecorations
        );
        navigateToMatch();
      } else {
        currentMatchIndex = -1;
        allDecorations = window.monacoHelperEditor.deltaDecorations(
          allDecorations,
          []
        );
        window.dispatchEvent(
          new CustomEvent("monaco-helper-find-result", {
            detail: { matches: [], currentMatch: -1 },
          })
        );
      }
    });

    window.addEventListener("monaco-helper-replace-one", (e) => {
      const { searchText, replaceText } = e.detail;
      const model = window.monacoHelperEditor.getModel();
      // Use current selection if it's a match, otherwise find the first one.
      const selection = window.monacoHelperEditor.getSelection();
      const selectedText = model.getValueInRange(selection);
      if (selectedText === searchText && currentMatches.length > 0) {
        model.pushEditOperations(
          [],
          [{ range: selection, text: replaceText }],
          () => {}
        );
      } else if (currentMatches.length > 0) {
        const range = currentMatches[0].range;
        model.pushEditOperations([], [{ range, text: replaceText }], () => {});
      }
    });

    window.addEventListener("monaco-helper-replace-all", (e) => {
      const { searchText, replaceText } = e.detail;
      const model = window.monacoHelperEditor.getModel();
      const edits = currentMatches.map((match) => ({
        range: match.range,
        text: replaceText,
      }));
      model.pushEditOperations([], edits, () => {});
    });

    window.addEventListener("monaco-helper-insert-snippet", (e) => {
      const { code } = e.detail;
      const selection = window.monacoHelperEditor.getSelection();
      const id = { major: 1, minor: 1 };
      const op = {
        identifier: id,
        range: selection,
        text: code,
        forceMoveMarkers: true,
      };
      window.monacoHelperEditor.executeEdits("my-source", [op]);
    });

    window.addEventListener("monaco-helper-find-next", () => {
      if (currentMatches.length > 0) {
        currentMatchIndex = (currentMatchIndex + 1) % currentMatches.length;
        navigateToMatch();
      }
    });

    window.addEventListener("monaco-helper-find-previous", () => {
      if (currentMatches.length > 0) {
        currentMatchIndex =
          (currentMatchIndex - 1 + currentMatches.length) %
          currentMatches.length;
        navigateToMatch();
      }
    });

    window.addEventListener("monaco-helper-get-hf-html", () => {
      const editorContent = window.monacoHelperEditor.getValue();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editorContent;

      const header = tempDiv.querySelector('[id^="header-2"]');
      const footer = tempDiv.querySelector('[id^="footer-2"]');

      let combinedHtml = "";
      if (header) {
        combinedHtml += header.outerHTML + "\\n";
      }
      if (footer) {
        combinedHtml += footer.outerHTML;
      }

      window.dispatchEvent(
        new CustomEvent("monaco-helper-hf-html-result", {
          detail: { html: combinedHtml },
        })
      );
    });
  } else {
    console.log("Injected script could not find editor element.");
  }
})();
