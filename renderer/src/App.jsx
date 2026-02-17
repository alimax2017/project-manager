import React, { useEffect, useState } from 'react'

function TaskModal({ task, onClose, onSave, onDelete }) {
    const [title, setTitle] = useState(task?.title || '')
    const [description, setDescription] = useState(task?.description || '')
    const [dueDate, setDueDate] = useState(task?.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : '')

    async function handleSave() {
        await onSave({ id: task.id, title, description, due_date: dueDate ? new Date(dueDate).getTime() : null })
        onClose()
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Task</h2>
                <label>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
                <label>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" />
                <label>Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <div className="modal-actions">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={onClose} className="btn-cancel">Cancel</button>
                    {onDelete && <button onClick={() => { onDelete(task.id); onClose(); }} className="btn-delete">Delete</button>}
                </div>
            </div>
        </div>
    )
}

function KanbanColumn({ title, tasks, onDrop, onTaskClick, onReorder, projectId }) {
    const [draggedOver, setDraggedOver] = useState(null)
    const status = title.toLowerCase().replace('-', '-')

    function handleDragStart(e, task) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.setData('sourceStatus', task.status)
    }

    function handleDragOver(e, index) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDraggedOver(index)
    }

    function handleDragLeave() {
        setDraggedOver(null)
    }

    function handleDrop(e, dropIndex) {
        e.preventDefault()
        setDraggedOver(null)

        const taskId = parseInt(e.dataTransfer.getData('taskId'))
        const sourceStatus = e.dataTransfer.getData('sourceStatus')

        if (sourceStatus === status) {
            // Reordering within same column
            const dragIndex = tasks.findIndex(t => t.id === taskId)
            if (dragIndex === dropIndex || dragIndex === -1) return

            const newTasks = [...tasks]
            const [removed] = newTasks.splice(dragIndex, 1)
            newTasks.splice(dropIndex, 0, removed)

            onReorder(projectId, status, newTasks.map(t => t.id))
        } else {
            // Moving to different column
            onDrop(taskId, status)
        }
    }

    function handleColumnDrop(e) {
        if (tasks.length === 0) {
            e.preventDefault()
            const taskId = parseInt(e.dataTransfer.getData('taskId'))
            const sourceStatus = e.dataTransfer.getData('sourceStatus')
            if (sourceStatus !== status) {
                onDrop(taskId, status)
            }
        }
    }

    return (
        <div
            className="col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleColumnDrop}
        >
            <h3>{title} ({tasks.length})</h3>
            {tasks.map((t, index) => (
                <div key={t.id}>
                    {draggedOver === index && <div className="drop-indicator" />}
                    <div
                        className="task"
                        draggable
                        onDragStart={(e) => handleDragStart(e, t)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={() => onTaskClick(t)}
                    >
                        <strong>{t.title}</strong>
                        {t.description && <div className="desc">{t.description.slice(0, 50)}{t.description.length > 50 ? '...' : ''}</div>}
                        {t.due_date && <div className="due-date">📅 {new Date(t.due_date).toLocaleDateString()}</div>}
                    </div>
                </div>
            ))}
            {draggedOver === tasks.length && <div className="drop-indicator" />}
        </div>
    )
}

export default function App() {
    const [projects, setProjects] = useState([])
    const [selected, setSelected] = useState(null)
    const [tasks, setTasks] = useState([])
    const [filteredTasks, setFilteredTasks] = useState([])
    const [projectName, setProjectName] = useState('')
    const [taskTitle, setTaskTitle] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [editingProject, setEditingProject] = useState(null)
    const [editingTask, setEditingTask] = useState(null)
    const [draggedProjectOver, setDraggedProjectOver] = useState(null)

    useEffect(() => {
        loadProjects()
    }, [])

    async function loadProjects() {
        const res = await window.api.invoke('get-projects')
        setProjects(res || [])
        if (res && res.length && !selected) setSelected(res[0].id)
    }

    async function addProject(e) {
        e.preventDefault()
        if (!projectName.trim()) return
        await window.api.invoke('add-project', { name: projectName })
        setProjectName('')
        loadProjects()
    }

    async function deleteProject(id) {
        if (!confirm('Delete this project and all its tasks?')) return
        await window.api.invoke('delete-project', id)
        setSelected(null)
        loadProjects()
    }

    async function updateProjectName(id, newName) {
        if (!newName.trim()) return
        await window.api.invoke('update-project', { id, name: newName })
        setEditingProject(null)
        loadProjects()
    }

    useEffect(() => {
        if (selected) loadTasks(selected)
    }, [selected])

    async function loadTasks(projectId) {
        const res = await window.api.invoke('get-tasks', projectId)
        setTasks(res || [])
        setFilteredTasks(res || [])
    }

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredTasks(tasks)
        } else {
            const lower = searchQuery.toLowerCase()
            setFilteredTasks(tasks.filter(t =>
                t.title.toLowerCase().includes(lower) ||
                (t.description && t.description.toLowerCase().includes(lower))
            ))
        }
    }, [searchQuery, tasks])

    async function addTask(e) {
        e.preventDefault()
        if (!taskTitle.trim() || !selected) return
        await window.api.invoke('add-task', { project_id: selected, title: taskTitle, description: '' })
        setTaskTitle('')
        loadTasks(selected)
    }

    async function moveTask(id, status) {
        await window.api.invoke('update-task-status', { id: Number(id), status })
        loadTasks(selected)
    }

    async function updateTask(task) {
        await window.api.invoke('update-task', task)
        loadTasks(selected)
    }

    async function deleteTask(id) {
        if (!confirm('Delete this task?')) return
        await window.api.invoke('delete-task', id)
        loadTasks(selected)
    }

    async function exportData() {
        const data = await window.api.invoke('export-data')
        const json = JSON.stringify(data, null, 2)
        const result = await window.api.invoke('save-file', {
            data: json,
            defaultPath: `pm-backup-${Date.now()}.json`
        })
        if (result.success) {
            alert('Data exported successfully!')
        }
    }

    async function importData() {
        const result = await window.api.invoke('open-file')
        if (result.success) {
            try {
                const data = JSON.parse(result.data)
                if (confirm('This will replace all existing data. Continue?')) {
                    await window.api.invoke('import-data', data)
                    loadProjects()
                    alert('Data imported successfully!')
                }
            } catch (err) {
                alert('Invalid JSON file: ' + err.message)
            }
        }
    }

    async function reorderProjects(orderedIds) {
        await window.api.invoke('reorder-projects', orderedIds)
        loadProjects()
    }

    async function reorderTasks(projectId, status, orderedIds) {
        await window.api.invoke('reorder-tasks', { projectId, status, orderedIds })
        loadTasks(projectId)
    }

    function handleProjectDragStart(e, project) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('projectId', project.id)
    }

    function handleProjectDragOver(e, index) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDraggedProjectOver(index)
    }

    function handleProjectDrop(e, dropIndex) {
        e.preventDefault()
        setDraggedProjectOver(null)

        const projectId = parseInt(e.dataTransfer.getData('projectId'))
        const dragIndex = projects.findIndex(p => p.id === projectId)

        if (dragIndex === dropIndex || dragIndex === -1) return

        const newProjects = [...projects]
        const [removed] = newProjects.splice(dragIndex, 1)
        newProjects.splice(dropIndex, 0, removed)

        reorderProjects(newProjects.map(p => p.id))
    }

    const cols = ['Todo', 'In-Progress', 'Done']
    const byStatus = (s) => filteredTasks.filter((t) => t.status === s.toLowerCase().replace('-', '-'))

    return (
        <div className="app">
            <aside className="sidebar">
                <h2>Projects</h2>
                <ul>
                    {projects.map((p, index) => (
                        <React.Fragment key={p.id}>
                            {draggedProjectOver === index && <div className="drop-indicator-project" />}
                            <li
                                className={selected === p.id ? 'active' : ''}
                                draggable={!editingProject}
                                onDragStart={(e) => handleProjectDragStart(e, p)}
                                onDragOver={(e) => handleProjectDragOver(e, index)}
                                onDragLeave={() => setDraggedProjectOver(null)}
                                onDrop={(e) => handleProjectDrop(e, index)}
                            >
                                {editingProject === p.id ? (
                                    <input
                                        autoFocus
                                        defaultValue={p.name}
                                        onBlur={(e) => updateProjectName(p.id, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && updateProjectName(p.id, e.target.value)}
                                    />
                                ) : (
                                    <>
                                        <span onClick={() => setSelected(p.id)}>{p.name}</span>
                                        <div className="actions">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingProject(p.id); }} className="btn-icon">✏️</button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="btn-icon">🗑️</button>
                                        </div>
                                    </>
                                )}
                            </li>
                        </React.Fragment>
                    ))}
                    {draggedProjectOver === projects.length && <div className="drop-indicator-project" />}
                </ul>
                <form onSubmit={addProject} className="small-form">
                    <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="New project" />
                    <button type="submit">Add</button>
                </form>
            </aside>

            <main>
                <h1>{projects.find((p) => p.id === selected)?.name || 'Select a project'}</h1>

                <div className="toolbar">
                    <form onSubmit={addTask} className="small-form">
                        <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="New task" />
                        <button type="submit">Add Task</button>
                    </form>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="🔍 Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="kanban">
                    {cols.map((c) => (
                        <KanbanColumn
                            key={c}
                            title={c}
                            tasks={byStatus(c)}
                            onDrop={moveTask}
                            onTaskClick={setEditingTask}
                            onReorder={reorderTasks}
                            projectId={selected}
                        />
                    ))}
                </div>
            </main>

            {editingTask && (
                <TaskModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={updateTask}
                    onDelete={deleteTask}
                />
            )}
        </div>
    )
}
