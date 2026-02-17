const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';
const db = require('./db');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });
}

app.whenReady().then(async () => {
    await db.init(path.join(app.getPath('userData'), 'pm-data.sqlite'));
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// IPC handlers
ipcMain.handle('get-projects', async () => {
    return db.getProjects();
});

ipcMain.handle('add-project', async (_, project) => {
    return db.addProject(project);
});

ipcMain.handle('get-contacts', async () => {
    return db.getContacts();
});

ipcMain.handle('add-contact', async (_, contact) => {
    return db.addContact(contact);
});

ipcMain.handle('update-contact', async (_, contact) => {
    return db.updateContact(contact.id, contact);
});

ipcMain.handle('get-today-tasks', async (_, dateKey) => {
    return db.getTodayTasks(dateKey);
});

ipcMain.handle('get-history-tasks', async () => {
    return db.getHistoryTasks();
});

ipcMain.handle('add-today-task', async (_, task) => {
    return db.addTodayTask(task);
});

ipcMain.handle('update-today-task-status', async (_, { id, status }) => {
    return db.updateTodayTaskStatus(id, status);
});

ipcMain.handle('update-today-task', async (_, task) => {
    return db.updateTodayTask(task.id, task);
});

ipcMain.handle('get-tasks', async (_, projectId) => {
    return db.getTasks(projectId);
});

ipcMain.handle('add-task', async (_, task) => {
    return db.addTask(task);
});

ipcMain.handle('update-task-status', async (_, { id, status }) => {
    return db.updateTaskStatus(id, status);
});

ipcMain.handle('update-project', async (_, project) => {
    return db.updateProject(project.id, project);
});

ipcMain.handle('delete-project', async (_, id) => {
    return db.deleteProject(id);
});

ipcMain.handle('update-task', async (_, task) => {
    return db.updateTask(task);
});

ipcMain.handle('delete-task', async (_, id) => {
    return db.deleteTask(id);
});

ipcMain.handle('export-data', async () => {
    return db.exportData();
});

ipcMain.handle('import-data', async (_, data) => {
    return db.importData(data);
});

ipcMain.handle('reorder-projects', async (_, orderedIds) => {
    return db.reorderProjects(orderedIds);
});

ipcMain.handle('reorder-tasks', async (_, { projectId, status, orderedIds }) => {
    return db.reorderTasks(projectId, status, orderedIds);
});

ipcMain.handle('save-file', async (_, { data, defaultPath }) => {
    const result = await dialog.showSaveDialog({
        defaultPath,
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, data);
        return { success: true, filePath: result.filePath };
    }
    return { success: false };
});

ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const data = fs.readFileSync(result.filePaths[0], 'utf-8');
        return { success: true, data };
    }
    return { success: false };
});
