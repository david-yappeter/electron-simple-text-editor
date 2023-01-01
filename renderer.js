const { ipcRenderer } = require('electron');
const path = require('path');

window.addEventListener('DOMContentLoaded', () => {
  const el = {
    documentName: document.getElementById('documentName'),
    createDocumentBtn: document.getElementById('createDocumentBtn'),
    openDocumentBtn: document.getElementById('openDocumentBtn'),
    fileTextArea: document.getElementById('fileTextArea'),
  };

  const handleDocumentChange = (filePath, content = '') => {
    const doc = path.parse(filePath);
    el.documentName.innerHTML = doc.name + doc.ext;
    el.fileTextArea.removeAttribute('disabled');
    el.fileTextArea.value = content;
    el.fileTextArea.focus();
  };

  el.createDocumentBtn.addEventListener('click', () => {
    ipcRenderer.send('create-document-triggered');
  });

  el.openDocumentBtn.addEventListener('click', () => {
    ipcRenderer.send('open-document-triggered');
  });

  el.fileTextArea.addEventListener('input', (e) => {
    ipcRenderer.send('file-content-updated', e.target.value);
  });

  ipcRenderer.on('document-created', (_, filePath) => {
    handleDocumentChange(filePath);
  });

  ipcRenderer.on('document-opened', (_, { filePath, content }) => {
    handleDocumentChange(filePath, content);
  });
});
