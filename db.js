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
            tag TEXT,
            start_date INTEGER,
            end_date INTEGER,
            priority TEXT DEFAULT 'medium',
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

        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            note TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS today_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_key TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            project_id INTEGER,
            contact_id INTEGER,
            contact_name TEXT,
            contact_value TEXT,
            status TEXT NOT NULL DEFAULT 'open',
            created_at INTEGER NOT NULL
        );
  `);

    // Add position columns if they don't exist (for existing databases)
    try {
        database.run('ALTER TABLE projects ADD COLUMN position INTEGER DEFAULT 0');
    } catch (e) { /* column already exists */ }
    try {
        database.run('ALTER TABLE projects ADD COLUMN tag TEXT');
    } catch (e) { /* column already exists */ }
    try {
        database.run('ALTER TABLE projects ADD COLUMN start_date INTEGER');
    } catch (e) { /* column already exists */ }
    try {
        database.run('ALTER TABLE projects ADD COLUMN end_date INTEGER');
    } catch (e) { /* column already exists */ }
    try {
        database.run("ALTER TABLE projects ADD COLUMN priority TEXT DEFAULT 'medium'");
    } catch (e) { /* column already exists */ }
    try {
        database.run('ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0');
    } catch (e) { /* column already exists */ }
    try {
        database.run("ALTER TABLE today_tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'open'");
    } catch (e) { /* column already exists */ }
    try {
        database.run('ALTER TABLE today_tasks ADD COLUMN description TEXT');
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

function addProject({ name, tag = null, start_date = null, end_date = null, priority = 'medium' }) {
    const created_at = Date.now();
    // Get max position
    const maxPos = database.exec('SELECT COALESCE(MAX(position), -1) as max FROM projects');
    const position = (maxPos[0]?.values?.[0]?.[0] || -1) + 1;
    const stmt = database.prepare('INSERT INTO projects (name, tag, start_date, end_date, priority, created_at, position) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run([name, tag, start_date, end_date, priority, created_at, position]);
    stmt.free();
    save();
    // fetch last inserted id
    const last = database.exec('SELECT last_insert_rowid() as id');
    const id = last[0]?.values?.[0]?.[0] || null;
    return { id, name, tag, start_date, end_date, priority, created_at, position };
}

function getTasks(projectId) {
    const stmt = database.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC, created_at DESC');
    stmt.bind([projectId]);
    return allFromStmt(stmt);
}

function getContacts() {
    const stmt = database.prepare('SELECT * FROM contacts ORDER BY created_at DESC');
    return allFromStmt(stmt);
}

function addContact({ name, phone = null, email = null, address = null, note = null }) {
    const created_at = Date.now();
    const stmt = database.prepare('INSERT INTO contacts (name, phone, email, address, note, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run([name, phone, email, address, note, created_at]);
    stmt.free();
    save();
    const last = database.exec('SELECT last_insert_rowid() as id');
    const id = last[0]?.values?.[0]?.[0] || null;
    return { id, name, phone, email, address, note, created_at };
}

function getTodayTasks(dateKey) {
    const stmt = database.prepare(`
        SELECT
            tt.*, 
            p.name as project_name,
            c.name as linked_contact_name,
            c.phone as linked_contact_phone
        FROM today_tasks tt
        LEFT JOIN projects p ON p.id = tt.project_id
        LEFT JOIN contacts c ON c.id = tt.contact_id
        ORDER BY tt.created_at DESC
    `);
    return allFromStmt(stmt);
}

function addTodayTask({ date_key, title, description = null, project_id = null, contact_id = null, contact_name = null, contact_value = null, status = 'open' }) {
    const created_at = Date.now();
    const stmt = database.prepare("INSERT INTO today_tasks (date_key, title, description, project_id, contact_id, contact_name, contact_value, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run([date_key, title, description, project_id, contact_id, contact_name, contact_value, status, created_at]);
    stmt.free();
    save();
    const last = database.exec('SELECT last_insert_rowid() as id');
    const id = last[0]?.values?.[0]?.[0] || null;
    return { id, date_key, title, description, project_id, contact_id, contact_name, contact_value, status, created_at };
}

function getHistoryTasks() {
    const stmt = database.prepare(`
        SELECT
            tt.*,
            p.name as project_name,
            c.name as linked_contact_name,
            c.phone as linked_contact_phone
        FROM today_tasks tt
        LEFT JOIN projects p ON p.id = tt.project_id
        LEFT JOIN contacts c ON c.id = tt.contact_id
        WHERE tt.status = 'done'
        ORDER BY tt.date_key DESC, tt.created_at DESC
    `);
    return allFromStmt(stmt);
}

function updateTodayTaskStatus(id, status) {
    const stmt = database.prepare('UPDATE today_tasks SET status = ? WHERE id = ?');
    stmt.run([status, id]);
    stmt.free();
    save();
    return { changes: 1 };
}

function updateTodayTask(id, data) {
    const currentStmt = database.prepare('SELECT * FROM today_tasks WHERE id = ?');
    currentStmt.bind([id]);
    const current = currentStmt.step() ? currentStmt.getAsObject() : null;
    currentStmt.free();

    if (!current) {
        return { changes: 0 };
    }

    const next = {
        date_key: data.date_key ?? current.date_key,
        title: data.title ?? current.title,
        description: data.description !== undefined ? data.description : current.description,
        project_id: data.project_id !== undefined ? data.project_id : current.project_id,
        contact_id: data.contact_id !== undefined ? data.contact_id : current.contact_id,
        contact_name: data.contact_name !== undefined ? data.contact_name : current.contact_name,
        contact_value: data.contact_value !== undefined ? data.contact_value : current.contact_value,
        status: data.status ?? current.status ?? 'open'
    };

    const stmt = database.prepare('UPDATE today_tasks SET date_key = ?, title = ?, description = ?, project_id = ?, contact_id = ?, contact_name = ?, contact_value = ?, status = ? WHERE id = ?');
    stmt.run([next.date_key, next.title, next.description, next.project_id, next.contact_id, next.contact_name, next.contact_value, next.status, id]);
    stmt.free();
    save();
    return { changes: 1 };
}

function updateContact(id, data) {
    const currentStmt = database.prepare('SELECT * FROM contacts WHERE id = ?');
    currentStmt.bind([id]);
    const current = currentStmt.step() ? currentStmt.getAsObject() : null;
    currentStmt.free();

    if (!current) {
        return { changes: 0 };
    }

    const next = {
        name: data.name ?? current.name,
        phone: data.phone !== undefined ? data.phone : current.phone,
        email: data.email !== undefined ? data.email : current.email,
        address: data.address !== undefined ? data.address : current.address,
        note: data.note !== undefined ? data.note : current.note
    };

    const stmt = database.prepare('UPDATE contacts SET name = ?, phone = ?, email = ?, address = ?, note = ? WHERE id = ?');
    stmt.run([next.name, next.phone, next.email, next.address, next.note, id]);
    stmt.free();
    save();
    return { changes: 1 };
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

function updateProject(id, data) {
    const currentStmt = database.prepare('SELECT * FROM projects WHERE id = ?');
    currentStmt.bind([id]);
    const current = currentStmt.step() ? currentStmt.getAsObject() : null;
    currentStmt.free();

    if (!current) {
        return { changes: 0 };
    }

    const next = {
        name: data.name ?? current.name,
        tag: data.tag !== undefined ? data.tag : current.tag,
        start_date: data.start_date !== undefined ? data.start_date : current.start_date,
        end_date: data.end_date !== undefined ? data.end_date : current.end_date,
        priority: data.priority ?? current.priority ?? 'medium'
    };

    const stmt = database.prepare('UPDATE projects SET name = ?, tag = ?, start_date = ?, end_date = ?, priority = ? WHERE id = ?');
    stmt.run([next.name, next.tag, next.start_date, next.end_date, next.priority, id]);
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

function updateTask({ id, title, description, due_date, project_id, status }) {
    const stmt = database.prepare('UPDATE tasks SET title = ?, description = ?, due_date = ?, project_id = ?, status = ? WHERE id = ?');
    stmt.run([title, description, due_date, project_id, status, id]);
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
        tasks: database.prepare('SELECT * FROM tasks').all(),
        contacts: getContacts(),
        today_tasks: database.prepare('SELECT * FROM today_tasks').all()
    };
}

function importData({ projects, tasks, contacts = [], today_tasks = [] }) {
    // Clear existing data
    database.run('DELETE FROM today_tasks');
    database.run('DELETE FROM contacts');
    database.run('DELETE FROM tasks');
    database.run('DELETE FROM projects');

    // Import projects
    const projStmt = database.prepare('INSERT INTO projects (id, name, tag, start_date, end_date, priority, created_at, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    projects.forEach(p => {
        projStmt.run([
            p.id,
            p.name,
            p.tag || null,
            p.start_date || null,
            p.end_date || null,
            p.priority || 'medium',
            p.created_at,
            p.position || 0
        ]);
    });
    projStmt.free();

    // Import tasks
    const taskStmt = database.prepare('INSERT INTO tasks (id, project_id, title, description, status, due_date, created_at, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    tasks.forEach(t => {
        taskStmt.run([t.id, t.project_id, t.title, t.description, t.status, t.due_date, t.created_at, t.position || 0]);
    });
    taskStmt.free();

    const contactStmt = database.prepare('INSERT INTO contacts (id, name, phone, email, address, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    contacts.forEach(c => {
        contactStmt.run([
            c.id,
            c.name,
            c.phone || null,
            c.email || null,
            c.address || null,
            c.note || null,
            c.created_at || Date.now()
        ]);
    });
    contactStmt.free();

    const todayStmt = database.prepare('INSERT INTO today_tasks (id, date_key, title, description, project_id, contact_id, contact_name, contact_value, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    today_tasks.forEach(t => {
        todayStmt.run([
            t.id,
            t.date_key,
            t.title,
            t.description || null,
            t.project_id || null,
            t.contact_id || null,
            t.contact_name || null,
            t.contact_value || null,
            t.status || 'open',
            t.created_at || Date.now()
        ]);
    });
    todayStmt.free();

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
    getContacts,
    addContact,
    updateContact,
    getTodayTasks,
    addTodayTask,
    updateTodayTaskStatus,
    updateTodayTask,
    getHistoryTasks,
    exportData,
    importData,
    reorderProjects,
    reorderTasks
};
