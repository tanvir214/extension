(function () {
  if (window.monacoHelperInjected) return;
  window.monacoHelperInjected = true;

  let panel = null;
  let isVisible = false;
  let editorReady = false;

  const snippets = [
    { name: "For Loop", code: "for (let i = 0; i < arr.length; i++) {\n  \n}" },
    { name: "Arrow Function", code: "const fn = (x) => {\n  \n};" },
    { name: "Console Log", code: "console.log();" },
    { name: "Async Function", code: "async function fn() {\n  \n}" },
    {
      name: "Try Catch",
      code: "try {\n  \n} catch (err) {\n  console.error(err);\n}",
    },
  ];

  window.addEventListener('monaco-helper-editor-ready', () => {
    editorReady = true;
  });

  function createPanel() {
    if (panel) return;

    panel = document.createElement("div");
    panel.id = "mh-panel";
    panel.style.display = "none";

    let snippetHTML = snippets
      .map(
        (s, i) =>
          `<div class="mh-snippet" data-idx="${i}">
        <div class="mh-sname">${s.name}</div>
        <div class="mh-scode">${s.code.split("\n")[0]}</div>
      </div>`
      )
      .join("");

    panel.innerHTML = `
      <div class="mh-header">
        <span>Monaco Helper</span>
        <button id="mh-close">×</button>
      </div>
      <div class="mh-section">
        <h4>Search & Replace</h4>
        <input type="text" id="mh-search" placeholder="Search...">
        <input type="text" id="mh-replace" placeholder="Replace...">
        <div class="mh-btns">
          <button id="mh-find">Find</button>
          <button id="mh-replace-one">Replace</button>
          <button id="mh-replace-all">Replace All</button>
        </div>
        <div id="mh-status"></div>
      </div>
      <div class="mh-section">
        <h4>Snippets</h4>
        <div id="mh-snippets">${snippetHTML}</div>
      </div>
    `;

    document.body.appendChild(panel);
    attachListeners();
  }

  function attachListeners() {
    document.getElementById("mh-close").onclick = toggle;
    document.getElementById("mh-find").onclick = find;
    document.getElementById("mh-replace-one").onclick = replaceOne;
    document.getElementById("mh-replace-all").onclick = replaceAll;

    document.querySelectorAll(".mh-snippet").forEach((el) => {
      el.onclick = () => {
        const idx = parseInt(el.dataset.idx);
        insertSnippet(snippets[idx].code);
      };
    });

    document.getElementById("mh-search").onkeydown = (e) => {
      if (e.key === "Enter") find();
    };

    window.addEventListener('monaco-helper-find-result', (e) => {
      const { matches } = e.detail;
      if (matches.length === 0) {
        showStatus("No matches found");
        currentMatch = 0;
        return;
      }

      currentMatch = (currentMatch) % matches.length;
      window.dispatchEvent(new CustomEvent('monaco-helper-set-selection', { detail: { range: matches[currentMatch].range } }));
      showStatus(`Found ${matches.length} matches. Showing #${currentMatch + 1}`);
      currentMatch++;
    });
  }

  function toggle() {
    if (!panel) {
      var s = document.createElement('script');
      s.src = chrome.runtime.getURL('injected.js');
      s.onload = function() {
          this.remove();
      };
      (document.head || document.documentElement).appendChild(s);
      createPanel();
    };
    isVisible = !isVisible;
    panel.style.display = isVisible ? "flex" : "none";
  }

  function showStatus(msg) {
    const status = document.getElementById("mh-status");
    status.textContent = msg;
    status.style.display = "block";
    setTimeout(() => (status.style.display = "none"), 2000);
  }

  function insertSnippet(code) {
    if (!editorReady) {
      showStatus("Editor not ready");
      return;
    }
    window.dispatchEvent(new CustomEvent('monaco-helper-insert-snippet', { detail: { code } }));
    showStatus("Snippet inserted!");
  }

  let currentMatch = 0;

  function find() {
    if (!editorReady) {
      showStatus("Editor not ready");
      return;
    }
    const searchText = document.getElementById("mh-search").value;

    if (!searchText) {
      showStatus("Enter search text");
      return;
    }
    window.dispatchEvent(new CustomEvent('monaco-helper-find', { detail: { searchText } }));
  }

  function replaceOne() {
    if (!editorReady) {
      showStatus("Editor not ready");
      return;
    }
    const searchText = document.getElementById("mh-search").value;
    const replaceText = document.getElementById("mh-replace").value;
    if (!searchText) {
      showStatus("Enter search text");
      return;
    }
    window.dispatchEvent(new CustomEvent('monaco-helper-replace-one', { detail: { searchText, replaceText } }));
  }

  function replaceAll() {
    if (!editorReady) {
      showStatus("Editor not ready");
      return;
    }
    const searchText = document.getElementById("mh-search").value;
    const replaceText = document.getElementById("mh-replace").value;
    if (!searchText) {
      showStatus("Enter search text");
      return;
    }
    window.dispatchEvent(new CustomEvent('monaco-helper-replace-all', { detail: { searchText, replaceText } }));
  }
  
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "toggle") {
      toggle();
    } else if (msg.action === "ping") {
      sendResponse({ status: "ok" });
    }
  });

})();
