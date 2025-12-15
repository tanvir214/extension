(function () {
  if (window.monacoHelperInjected) return;
  window.monacoHelperInjected = true;

  let panel = null;
  let isVisible = false;
  let editorReady = false;

  const snippets = [
    {
      category: "Text Elements",
      name: "Amended Text",
      code: '<P STYLE="font: 8pt/10pt Arial, Helvetica, Sans-Serif; margin: 0 0 6pt 0pt;">  </P>',
    },
    {
      category: "Text Elements",
      name: "Top Red Text",
      code: '<P STYLE="font: 8pt/10pt Arial, Helvetica, Sans-Serif; margin: 0 0 6pt 0pt; color: red"> </P>',
    },
    {
      category: "Special Characters",
      name: "Index Special Char",
      code: "<i>Index<sub>t</sub></i>",
    },
    {
      category: "Special Characters",
      name: "Pi Special Char",
      code: "<i>Pi,<sub>t</sub></i>",
    },
    {
      category: "Special Characters",
      name: "n Special Char",
      code: "<i>n</i>",
    },
    {
      category: "Special Characters",
      name: "IS Special Char",
      code: "<i>IS<sub>i,t</sub></i>",
    },
    {
      category: "Special Characters",
      name: "D Special Char",
      code: "<i>D<sub>t</sub></i>",
    },
    {
      category: "CSS",
      name: "1st Table Graphic",
      code: '<P STYLE="text-align: center;font: 10pt Arial, Helvetica, Sans-Serif; margin: 0 0 0 12.25pt"><IMG SRC="image_gt1.jpg" ALT="" STYLE="height: 177.75pt; width: 558pt"></P>',
      preview: "[Image Snippet]",
    },
    {
      category: "Table Graphics",
      name: "2nd Table Graphic",
      code: '<P STYLE="text-align: center;font: 10pt Arial, Helvetica, Sans-Serif; margin: 0 0 0 12.25pt"><IMG SRC="image_gt2.jpg" ALT="" STYLE="height: 330pt; width: 558pt"></P>',
      preview: "[Image Snippet]",
    },
    {
      category: "Table Graphics",
      name: "Single Table Graphic",
      code: '<P STYLE="text-align: center;font: 10pt Arial, Helvetica, Sans-Serif; margin: 0 0 0 12.25pt"><IMG SRC="image_gt.jpg" ALT="" STYLE="height: 350pt; width: 500pt"></P>',
      preview: "[Image Snippet]",
    },
    {
      category: "CSS",
      name: "White Border",
      code: "border-bottom: 1px solid #FFFFFF;",
    },
  ];

  window.addEventListener("monaco-helper-editor-ready", () => {
    editorReady = true;
  });

  function createPanel() {
    if (panel) return;

    panel = document.createElement("div");

    const style = document.createElement("style");
    style.textContent = `
      .mh-search-highlight { background-color: rgba(245, 212, 66, 0.5); }
      .mh-current-match { background-color: #f5d442; border: 1px solid #c2a629; }
    `;
    document.head.appendChild(style);

    panel.id = "mh-panel";
    panel.style.display = "none";

    const categories = [...new Set(snippets.map((s) => s.category))];

    let categoryButtonsHTML = categories
      .map(
        (cat) =>
          `<button class="mh-category-btn" data-category="${cat}">${cat}</button>`
      )
      .join("");

    let snippetHTML = snippets
      .map((s, i) => {
        return `<div class="mh-snippet" data-idx="${i}" data-category="${
          s.category
        }" style="display: none;">
        <div class="mh-sname">${s.name}</div>
        <div class="mh-scode">${s.preview || s.code.split("\n")[0]}</div>
      </div>`;
      })
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
        <div class="mh-nav-btns">
          <button id="mh-prev">Previous</button>
          <button id="mh-next">Next</button>
        </div>
        <div id="mh-status"></div>
      </div>
      <div class="mh-section">
        <h4>Extract Header/Footer</h4>
        <button id="mh-extract-hf">Extract Header/Footer</button>
        <textarea id="mh-hf-output" rows="5" style="width: 100%; margin-top: 10px;" placeholder="Extracted HTML will appear here..."></textarea>
      </div>
      <div class="mh-section">
        <h4>Snippets</h4>
        <div id="mh-snippet-categories" class="mh-category-tabs">
          ${categoryButtonsHTML}
        </div>
        <div id="mh-snippets-container">${snippetHTML}</div>
      </div>
    `;

    document.body.appendChild(panel);
    attachListeners();
  }

  function attachListeners() {
    document.getElementById("mh-close").onclick = toggle;
    document.getElementById("mh-find").onclick = find;
    document.getElementById("mh-next").onclick = findNext;
    document.getElementById("mh-prev").onclick = findPrevious;
    document.getElementById("mh-replace-one").onclick = replaceOne;
    document.getElementById("mh-replace-all").onclick = replaceAll;

    document.querySelectorAll(".mh-snippet").forEach((el) => {
      el.onclick = () => {
        const idx = parseInt(el.dataset.idx);
        insertSnippet(snippets[idx].code);
      };
    });

    document.querySelectorAll(".mh-category-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const selectedCategory = e.target.dataset.category;

        // Update active button
        document
          .querySelectorAll(".mh-category-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        // Show/hide snippets
        document.querySelectorAll(".mh-snippet").forEach((snippetEl) => {
          snippetEl.style.display =
            snippetEl.dataset.category === selectedCategory ? "flex" : "none";
        });
      };
    });

    document.getElementById("mh-extract-hf").onclick = extractHF;

    window.addEventListener("monaco-helper-hf-html-result", (e) => {
      const output = document.getElementById("mh-hf-output");
      output.value = e.detail.html;
    });

    document.getElementById("mh-search").onkeydown = (e) => {
      if (e.key === "Enter") find();
    };

    window.addEventListener("monaco-helper-find-result", (e) => {
      const { matches, currentMatch } = e.detail;
      if (matches.length === 0) {
        showStatus("No matches found.");
        return;
      }
      if (currentMatch !== -1) {
        showStatus(`${currentMatch + 1} of ${matches.length} matches`);
      }
    });
  }

  function toggle() {
    if (!panel) {
      var s = document.createElement("script");
      s.src = chrome.runtime.getURL("injected.js");
      s.onload = function () {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(s);
      createPanel();
    }
    isVisible = !isVisible;
    panel.style.display = isVisible ? "flex" : "none";
  }

  function showStatus(msg) {
    const status = document.getElementById("mh-status");
    status.textContent = msg;
    status.style.display = "block";
    // Using a longer timeout for better user experience
    setTimeout(() => (status.style.display = "none"), 3000);
  }

  function insertSnippet(code) {
    if (!editorReady) {
      showStatus("Editor not ready");
      return;
    }
    window.dispatchEvent(
      new CustomEvent("monaco-helper-insert-snippet", { detail: { code } })
    );
    showStatus("Snippet inserted!");
  }

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
    window.dispatchEvent(
      new CustomEvent("monaco-helper-find", { detail: { searchText } })
    );
  }

  function findNext() {
    if (!editorReady) {
      showStatus("Editor not ready");
      return;
    }
    window.dispatchEvent(new CustomEvent("monaco-helper-find-next"));
  }

  function findPrevious() {
    if (!editorReady) {
      showStatus("Editor not ready");
      return;
    }
    window.dispatchEvent(new CustomEvent("monaco-helper-find-previous"));
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
    window.dispatchEvent(
      new CustomEvent("monaco-helper-replace-one", {
        detail: { searchText, replaceText },
      })
    );
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
    window.dispatchEvent(
      new CustomEvent("monaco-helper-replace-all", {
        detail: { searchText, replaceText },
      })
    );
  }

  function extractHF() {
    if (!editorReady) {
      showStatus("Editor not ready");
      return;
    }
    window.dispatchEvent(new CustomEvent("monaco-helper-get-hf-html"));
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "toggle") {
      toggle();
    } else if (msg.action === "ping") {
      sendResponse({ status: "ok" });
    }
  });
})();
