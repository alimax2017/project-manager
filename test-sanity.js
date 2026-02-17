const db = require('./db');

async function run() {
    try {
        await db.init(':memory:');
        const p = db.addProject({ name: 'Sanity Project' });
        console.log('Added project:', p);
        const projects = db.getProjects();
        console.log('Projects from DB:', projects);
        const t = db.addTask({ project_id: p.id, title: 'Sanity Task', description: 'Test task' });
        console.log('Added task:', t);
        const tasks = db.getTasks(p.id);
        console.log('Tasks for project:', tasks);
        const u = db.updateTaskStatus(t.id, 'in-progress');
        console.log('Updated task status result:', u);
        const tasks2 = db.getTasks(p.id);
        console.log('Tasks after update:', tasks2);
        process.exit(0);
    } catch (err) {
        console.error('Sanity check failed:', err);
        process.exit(1);
    }
}

run();
