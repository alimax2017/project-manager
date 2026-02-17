const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL;
let database;
let dbFilePath = null;

async function init(filePath) {
    if (!SQL) SQL = await initSqlJs();
    dbFilePath = filePath;

    if (filePath === ':memory:') {
        database = new SQL.Database();
    } else {
        try {
            if (fs.existsSync(filePath)) {
                const buf = fs.readFileSync(filePath);
                database = new SQL.Database(new Uint8Array(buf));
            } else {
                database = new SQL.Database();
                save();
            }
        } catch (err) {
            database = new SQL.Database();
            save();
        }
    }

    database.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      position INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      due_date INTEGER,
      created_at INTEGER NOT NULL,
      position INTEGER DEFAULT 0
    );
  `);

    // Add position columns if they don't exist (for existing databases)
    try {
        database.run('ALTER TABLE projects ADD COLUMN position INTEGER DEFAULT 0');
    } catch (e) { /* column already exists */ }
    try {
        database.run('ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0');
    } catch (e) { /* column already exists */ }
}

function save() {
    if (!dbFilePath || dbFilePath === ':memory:') return;
    const data = database.export();
    fs.writeFileSync(dbFilePath, Buffer.from(data));
}

function allFromStmt(stmt) {
    const res = [];
    while (stmt.step()) {
        res.push(stmt.getAsObject());
    }
    stmt.free();
    return res;
}

function getProjects() {
    const stmt = database.prepare('SELECT * FROM projects ORDER BY position ASC, created_at DESC');
    return allFromStmt(stmt);
}

function addProject({ name }) {
    const created_at = Date.now();
    // Get max position
    const maxPos = database.exec('SELECT COALESCE(MAX(position), -1) as max FROM projects');
    const position = (maxPos[0]?.values?.[0]?.[0] || -1) + 1;
    const stmt = database.prepare('INSERT INTO projects (name, created_at, position) VALUES (?, ?, ?)');
    stmt.run([name, created_at, position]);
    stmt.free();
    save();
    // fetch last inserted id
    const last = database.exec('SELECT last_insert_rowid() as id');
    const id = last[0]?.values?.[0]?.[0] || null;
    return { id, name, created_at, position };
}

function getTasks(projectId) {
    const stmt = database.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC, created_at DESC');
    stmt.bind([projectId]);
    return allFromStmt(stmt);
}

function addTask({ project_id, title, description = '', status = 'todo', due_date = null }) {
    const created_at = Date.now();
    // Get max position for this status
    const maxPos = database.exec(`SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE project_id = ${project_id} AND status = '${status}'`);
    const position = (maxPos[0]?.values?.[0]?.[0] || -1) + 1;
    const stmt = database.prepare('INSERT INTO tasks (project_id, title, description, status, due_date, created_at, position) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run([project_id, title, description, status, due_date, created_at, position]);
    stmt.free();
    save();
    const last = database.exec('SELECT last_insert_rowid() as id');
    const id = last[0]?.values?.[0]?.[0] || null;
    return { id, project_id, title, description, status, due_date, created_at, position };
}

function updateTaskStatus(id, status) {
    const stmt = database.prepare('UPDATE tasks SET status = ? WHERE id = ?');
    stmt.run([status, id]);
    stmt.free();
    save();
    return { changes: 1 };
}

function updateProject(id, name) {
    const stmt = database.prepare('UPDATE projects SET name = ? WHERE id = ?');
    stmt.run([name, id]);
    stmt.free();
    save();
    return { changes: 1 };
}

function deleteProject(id) {
    // Delete tasks first
    const stmt1 = database.prepare('DELETE FROM tasks WHERE project_id = ?');
    stmt1.run([id]);
    stmt1.free();
    // Delete project
    const stmt2 = database.prepare('DELETE FROM projects WHERE id = ?');
    stmt2.run([id]);
    stmt2.free();
    save();
    return { changes: 1 };
}

function updateTask({ id, title, description, due_date }) {
    const stmt = database.prepare('UPDATE tasks SET title = ?, description = ?, due_date = ? WHERE id = ?');
    stmt.run([title, description, due_date, id]);
    stmt.free();
    save();
    return { changes: 1 };
}

function deleteTask(id) {
    const stmt = database.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    save();
    return { changes: 1 };
}

function exportData() {
    return {
        projects: getProjects(),
        tasks: database.prepare('SELECT * FROM tasks').all()
    };
}

function importData({ projects, tasks }) {
    // Clear existing data
    database.run('DELETE FROM tasks');
    database.run('DELETE FROM projects');

    // Import projects
    const projStmt = database.prepare('INSERT INTO projects (id, name, created_at, position) VALUES (?, ?, ?, ?)');
    projects.forEach(p => {
        projStmt.run([p.id, p.name, p.created_at, p.position || 0]);
    });
    projStmt.free();
    
    // Import tasks
    const taskStmt = database.prepare('INSERT INTO tasks (id, project_id, title, description, status, due_date, created_at, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    tasks.forEach(t => {
        taskStmt.run([t.id, t.project_id, t.title, t.description, t.status, t.due_date, t.created_at, t.position || 0]);
    });
    taskStmt.free();
    
    save();
    return { success: true };
}

function reorderProjects(orderedIds) {
    orderedIds.forEach((id, index) => {
        const stmt = database.prepare('UPDATE projects SET position = ? WHERE id = ?');
        stmt.run([index, id]);
        stmt.free();
    });
    save();
    return { success: true };
}

function reorderTasks(projectId, status, orderedIds) {
    orderedIds.forEach((id, index) => {
        const stmt = database.prepare('UPDATE tasks SET position = ? WHERE id = ? AND project_id = ? AND status = ?');
        stmt.run([index, id, projectId, status]);
        stmt.free();
    });
    save();
    return { success: true };
}

module.exports = { 
    init, 
    getProjects, 
    addProject, 
    updateProject, 
    deleteProject, 
    getTasks, 
    addTask, 
    updateTask, 
    updateTaskStatus, 
    deleteTask,
    exportData,
    importData,
    reorderProjects,
    reorderTasks
};
