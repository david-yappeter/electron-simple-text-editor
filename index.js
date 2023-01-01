const {
  BrowserWindow,
  app,
  ipcMain,
  dialog,
  Notification,
  Menu,
} = require('electron');
const fs = require('fs');
const path = require('path');

const isDevEnv = process.env.NODE_ENV === 'development';

if (isDevEnv) {
  try {
    require('electron-reloader')(module);
  } catch {}
}

let mainWindow;
let openedFilePath;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'renderer.js'),
      sandbox: false,
    },
  });

  if (isDevEnv) {
    mainWindow.webContents.openDevTools();
  }
  // mainWindow.loadFile('index.html');
  mainWindow.loadURL(`file://${__dirname}\\index.html`);

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          click: () => ipcMain.emit('create-document-triggered'),
        },
        {
          label: 'Open File',
          click: () => ipcMain.emit('open-document-triggered'),
        },
        { type: 'separator' },
        {
          label: 'Open Recent',
          role: 'recentdocuments',
          submenu: [
            {
              label: 'Clear Recent',
              role: 'clearrecentdocuments',
            },
          ],
        },
        { type: 'separator' },
        {
          role: 'quit',
          label: 'Exit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(createWindow);

const handleError = () => {
  new Notification({
    title: 'Error',
    body: 'Sorry, something went wrong :(',
  }).show();
};

ipcMain.on('create-document-triggered', () => {
  dialog
    .showSaveDialog(mainWindow, {
      filters: [{ name: 'text files', extensions: ['txt'] }],
    })
    .then(({ filePath }) => {
      app.addRecentDocument(filePath);
      openedFilePath = filePath;

      fs.writeFile(filePath, '', (error) => {
        if (error) {
          handleError();
        } else {
          mainWindow.webContents.send('document-created', filePath);
        }
      });
    });
});

ipcMain.on('open-document-triggered', () => {
  dialog
    .showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'text files', extensions: ['txt'] }],
    })
    .then(({ filePaths }) => {
      const filePath = filePaths[0];
      app.addRecentDocument(filePath);
      openedFilePath = filePath;

      fs.readFile(filePath, 'utf8', (error, content) => {
        if (error) {
          handleError();
        } else {
          mainWindow.webContents.send('document-opened', { filePath, content });
        }
      });
    });
});

ipcMain.on('file-content-updated', (_, textareaContent) => {
  fs.writeFile(openedFilePath, textareaContent, (error) => {
    if (error) {
      handleError();
    }
  });
});
