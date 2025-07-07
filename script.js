
const screens = {
  intro: document.getElementById("intro"),
  setup: document.getElementById("project-setup"),
  ide: document.getElementById("ide-wrapper"),
};

const projectNameInput = document.getElementById("projectName");
const frameworkCards = document.querySelectorAll(".framework-card");
const launchBtn = document.getElementById("launchIDEBtn");

const projectTitle = document.getElementById("projectTitle");
const frameworkUsed = document.getElementById("frameworkUsed");

const codeArea = document.getElementById("codeArea");
const terminalOutput = document.getElementById("terminalOutput");

const runBtn = document.querySelector(".run-btn");
const stopBtn = document.querySelector(".stop-btn");
const saveBtn = document.querySelector(".save-btn");
const clearTerminalBtn = document.getElementById("clearTerminal");

const fileTabs = document.querySelectorAll(".tab");
const fileItems = document.querySelectorAll(".file");

const editorPane = document.getElementById("editor-pane");
const terminalPane = document.getElementById("terminal-pane");
const splitter = document.getElementById("splitter");


let selectedFramework = null;
let selectedFile = "main.py";
let pyodide = null;

const files = {
  "main.py": `def main():\n    print("Welcome to RabbitBook")\n\nmain()`,
  "routes.py": `from flask import Flask\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return "Hello from RabbitBook"`,
  "README.md": `# RabbitBook\n\nA full-stack Python IDE in your browser.`,
  "config.yaml": `theme: dark\nautosave: true\nframework: flask`
};


window.addEventListener("DOMContentLoaded", async () => {
  showScreen("intro");

  logTerminal("🔄 Loading Pyodide...");
  pyodide = await loadPyodide();
  logTerminal("✅ Pyodide loaded.");

  setTimeout(() => showScreen("setup"), 2000);
});

function showScreen(key) {
  Object.keys(screens).forEach(k => screens[k].style.display = "none");
  if (screens[key]) screens[key].style.display = "flex";
}


frameworkCards.forEach(card => {
  card.addEventListener("click", () => {
    frameworkCards.forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    selectedFramework = card.dataset.framework;
  });
});


launchBtn.addEventListener("click", () => {
  const projName = projectNameInput.value.trim();
  if (!projName || !selectedFramework) {
    alert("Please enter project name & framework");
    return;
  }

  projectTitle.textContent = projName;
  frameworkUsed.textContent = selectedFramework;

  showScreen("ide");
  loadFile("main.py");
});


function loadFile(filename) {
  selectedFile = filename;
  codeArea.value = files[filename] || "";
  fileTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.file === filename));
  fileItems.forEach(item => item.classList.toggle("active", item.dataset.file === filename));
}

fileTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    saveFile();
    loadFile(tab.dataset.file);
  });
});

fileItems.forEach(item => {
  item.addEventListener("click", () => {
    saveFile();
    loadFile(item.dataset.file);
  });
});


function saveFile() {
  files[selectedFile] = codeArea.value;
  logTerminal(`💾 Saved "${selectedFile}"`);
}

saveBtn.addEventListener("click", saveFile);


runBtn.addEventListener("click", async () => {
  const code = codeArea.value.trim();
  if (!code) return logTerminal("⚠️ No code to run.");

  logTerminal("▶ Running code...");

  try {
    await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = sys.stdout

` + code + `

output = sys.stdout.getvalue()
`);
    const output = pyodide.globals.get("output");
    logTerminal("✅ Output:\n" + output);
  } catch (err) {
    logTerminal("❌ Error:\n" + err);
  }
});



stopBtn.addEventListener("click", () => logTerminal("⛔ Execution stopped."));
clearTerminalBtn.addEventListener("click", () => terminalOutput.textContent = "");

function logTerminal(msg) {
  terminalOutput.textContent += `\n${msg}`;
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}


let isDragging = false;

splitter.addEventListener("mousedown", () => {
  isDragging = true;
  document.body.style.cursor = "col-resize";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  document.body.style.cursor = "default";
});

document.addEventListener("mousemove", e => {
  if (!isDragging) return;
  const workArea = document.getElementById("work-area");
  const offset = workArea.offsetLeft;
  const pointer = e.clientX - offset;
  const width = workArea.offsetWidth;
  const percent = (pointer / width) * 100;
  editorPane.style.width = `${percent}%`;
  terminalPane.style.width = `${100 - percent}%`;
});
