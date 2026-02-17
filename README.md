# PM Electron App

A full-featured desktop project management application built with Electron, React, and SQLite (sql.js).

## Features

✅ **Project Management**
- Create, edit, and delete projects
- Quick inline project name editing
- Auto-select first project on load

✅ **Task Management**
- Create tasks with titles, descriptions, and due dates
- Edit task details via modal dialog
- Delete tasks with confirmation
- Drag-and-drop tasks between Kanban columns (Todo, In-Progress, Done)

✅ **Search & Filter**
- Real-time search across task titles and descriptions
- Filter results update instantly

✅ **Data Persistence**
- Local SQLite database (WASM-based, no native dependencies)
- Automatic save on every change
- Data stored in user's app data folder

✅ **Import/Export**
- Export all data to JSON backup file
- Import data from JSON to restore or migrate

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Build UI and start the app

```bash
npm run start
```

3. For development with hot-reload:

```powershell
# Terminal 1: Start Vite dev server
npm run dev-ui

# Terminal 2: Start Electron in dev mode
$env:NODE_ENV = "development"
npx electron .
```

## Project Structure

```
project/
├── main.js              # Electron main process & IPC handlers
├── preload.js          # Context bridge for secure IPC
├── db.js               # SQLite database layer (sql.js)
├── package.json        # Dependencies & scripts
├── vite.config.js      # Vite build configuration
└── renderer/           # React UI
    ├── index.html      # Entry HTML
    └── src/
        ├── main.jsx    # React entry point
        ├── App.jsx     # Main app component
        └── styles.css  # Application styles
```

## Features in Detail

### Kanban Board
- Three columns: Todo, In-Progress, Done
- Drag tasks between columns to update status
- Click any task to edit details

### Task Modal
- Edit title, description, and due date
- Delete task from modal
- Click outside to cancel

### Project Sidebar
- Hover to reveal edit/delete buttons
- Click pencil icon to rename inline
- Trash icon deletes project and all tasks

### Search
- Type in search box to filter tasks
- Searches both titles and descriptions
- Updates in real-time

## Next Steps

- [ ] Add task priorities and labels
- [ ] Keyboard shortcuts
- [ ] Dark mode toggle
- [ ] Package with electron-builder for distribution
- [ ] Add automated tests