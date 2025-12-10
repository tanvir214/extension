// This script is injected into the page to access the Monaco editor instance.
(function() {
  const editorElement = document.querySelector('.monaco-editor');
  if (editorElement) {
    const editor = window.monaco.editor.getEditors()[0];
    window.monacoHelperEditor = editor;
    window.dispatchEvent(new CustomEvent('monaco-helper-editor-ready'));

    window.addEventListener('monaco-helper-find', (e) => {
      const { searchText } = e.detail;
      const model = window.monacoHelperEditor.getModel();
      const matches = model.findMatches(searchText, true, false, true, null, true);
      window.dispatchEvent(new CustomEvent('monaco-helper-find-result', { detail: { matches } }));
    });

    window.addEventListener('monaco-helper-replace-one', (e) => {
        const { searchText, replaceText } = e.detail;
        const model = window.monacoHelperEditor.getModel();
        const matches = model.findMatches(searchText, true, false, true, null, true);
        if(matches.length > 0) {
            const range = matches[0].range;
            model.pushEditOperations([], [{ range, text: replaceText }], () => {});
        }
    });

    window.addEventListener('monaco-helper-replace-all', (e) => {
        const { searchText, replaceText } = e.detail;
        const model = window.monacoHelperEditor.getModel();
        const matches = model.findMatches(searchText, true, false, true, null, true);
        const edits = matches.map(match => ({ range: match.range, text: replaceText }));
        model.pushEditOperations([], edits, () => {});
    });

    window.addEventListener('monaco-helper-insert-snippet', (e) => {
        const { code } = e.detail;
        const selection = window.monacoHelperEditor.getSelection();
        const id = { major: 1, minor: 1 };
        const op = {identifier: id, range: selection, text: code, forceMoveMarkers: true};
        window.monacoHelperEditor.executeEdits("my-source", [op]);
    });

    window.addEventListener('monaco-helper-set-selection', (e) => {
        const { range } = e.detail;
        window.monacoHelperEditor.setSelection(range);
        window.monacoHelperEditor.revealRangeInCenter(range);
    });

  } else {
    console.log('Injected script could not find editor element.');
  }
})();
