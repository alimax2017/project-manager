import React, { useEffect, useState } from 'react'

function getTodayKey() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function toInputDateValue(dateKey) {
    return dateKey || getTodayKey()
}

function getOrdinal(day) {
    if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`
    switch (day % 10) {
        case 1: return `${day}st`
        case 2: return `${day}nd`
        case 3: return `${day}rd`
        default: return `${day}th`
    }
}

function formatTodayLabel() {
    const now = new Date()
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' })
    const month = now.toLocaleDateString('en-US', { month: 'long' })
    const day = getOrdinal(now.getDate())
    const year = now.getFullYear()
    return `${weekday}, ${month} ${day}, ${year}`
}

function TaskModal({ task, projects, onClose, onSave, onDelete }) {
    const [title, setTitle] = useState(task?.title || '')
    const [description, setDescription] = useState(task?.description || '')
    const [dueDate, setDueDate] = useState(task?.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : '')
    const [projectId, setProjectId] = useState(task?.project_id ? String(task.project_id) : '')
    const [status, setStatus] = useState(task?.status || 'todo')

    async function handleSave() {
        await onSave({
            id: task.id,
            title,
            description,
            due_date: dueDate ? new Date(dueDate).getTime() : null,
            project_id: projectId ? Number(projectId) : task.project_id,
            status
        })
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
                <label>Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <label>Project</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                </select>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                </select>
                <div className="modal-actions">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={onClose} className="btn-cancel">Cancel</button>
                    {onDelete && <button onClick={() => { onDelete(task.id); onClose(); }} className="btn-delete">Delete</button>}
                </div>
            </div>
        </div>
    )
}

function ProjectModal({ onClose, onSave, initialData = null, mode = 'create' }) {
    const [name, setName] = useState(initialData?.name || '')
    const [tag, setTag] = useState(initialData?.tag || '')
    const [startDate, setStartDate] = useState(initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 10) : '')
    const [endDate, setEndDate] = useState(initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 10) : '')
    const [priority, setPriority] = useState(initialData?.priority || 'medium')

    async function handleSave() {
        if (!name.trim()) return
        await onSave({
            ...(initialData?.id ? { id: initialData.id } : {}),
            name: name.trim(),
            tag: tag.trim() || null,
            start_date: startDate ? new Date(startDate).getTime() : null,
            end_date: endDate ? new Date(endDate).getTime() : null,
            priority
        })
        onClose()
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>{mode === 'edit' ? 'Edit Project' : 'New Project'}</h2>
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" autoFocus />
                <label>TAG</label>
                <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. SSI" />
                <label>Start date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <label>End date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <div className="modal-actions">
                    <button onClick={handleSave}>{mode === 'edit' ? 'Save Project' : 'Add Project'}</button>
                    <button onClick={onClose} className="btn-cancel">Cancel</button>
                </div>
            </div>
        </div>
    )
}

function ContactModal({ onClose, onSave, initialData = null, mode = 'create' }) {
    const [name, setName] = useState(initialData?.name || '')
    const [phone, setPhone] = useState(initialData?.phone || '')
    const [email, setEmail] = useState(initialData?.email || '')
    const [address, setAddress] = useState(initialData?.address || '')
    const [note, setNote] = useState(initialData?.note || '')

    async function handleSave() {
        if (!name.trim()) return
        await onSave({
            ...(initialData?.id ? { id: initialData.id } : {}),
            name: name.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            note: note.trim() || null
        })
        onClose()
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>{mode === 'edit' ? 'Edit Contact' : 'New Contact'}</h2>
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" autoFocus />
                <label>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                <label>Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
                <label>Note</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="3" placeholder="Note" />
                <div className="modal-actions">
                    <button onClick={handleSave}>{mode === 'edit' ? 'Save Contact' : 'Add Contact'}</button>
                    <button onClick={onClose} className="btn-cancel">Cancel</button>
                </div>
            </div>
        </div>
    )
}

function TodayTaskModal({ onClose, onSave, projects, contacts, initialData = null, mode = 'create', defaultDate }) {
    const [title, setTitle] = useState(initialData?.title || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [taskDate, setTaskDate] = useState(toInputDateValue(initialData?.date_key || defaultDate))
    const [projectId, setProjectId] = useState(initialData?.project_id ? String(initialData.project_id) : '')
    const [contactSelection, setContactSelection] = useState(
        initialData?.contact_id
            ? String(initialData.contact_id)
            : (initialData?.contact_name || initialData?.contact_value)
                ? 'new'
                : 'none'
    )
    const [contactName, setContactName] = useState(initialData?.contact_name || '')
    const [contactValue, setContactValue] = useState(initialData?.contact_value || '')
    const [status, setStatus] = useState(initialData?.status || 'open')

    async function handleSave() {
        if (!title.trim()) return
        await onSave({
            ...(initialData?.id ? { id: initialData.id } : {}),
            date_key: taskDate,
            title: title.trim(),
            description: description.trim() || null,
            project_id: projectId ? Number(projectId) : null,
            contact_id: contactSelection !== 'none' && contactSelection !== 'new' ? Number(contactSelection) : null,
            contact_name: contactSelection === 'new' ? (contactName.trim() || null) : null,
            contact_value: contactSelection === 'new' ? (contactValue.trim() || null) : null,
            status
        })
        onClose()
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>{mode === 'edit' ? 'Edit Today Task' : 'New Today Task'}</h2>
                <label>Task name</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name" autoFocus />

                <label>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="Description" />

                <label>Date</label>
                <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />

                <label>Project</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">None</option>
                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                </select>

                <label>Contact</label>
                <select value={contactSelection} onChange={(e) => setContactSelection(e.target.value)}>
                    <option value="none">None</option>
                    <option value="new">Enter contact</option>
                    {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>{contact.name}</option>
                    ))}
                </select>

                {contactSelection === 'new' && (
                    <>
                        <label>nom</label>
                        <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="nom" />
                        <label>contact</label>
                        <input value={contactValue} onChange={(e) => setContactValue(e.target.value)} placeholder="contact" />
                    </>
                )}

                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="open">open</option>
                    <option value="done">done</option>
                    <option value="dismissed">dismissed</option>
                    <option value="reported">reported</option>
                </select>

                <div className="modal-actions">
                    <button onClick={handleSave}>{mode === 'edit' ? 'Save Task' : 'Add Task'}</button>
                    <button onClick={onClose} className="btn-cancel">Cancel</button>
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
    const [viewMode, setViewMode] = useState('today')
    const [projects, setProjects] = useState([])
    const [projectsExpanded, setProjectsExpanded] = useState(false)
    const [contacts, setContacts] = useState([])
    const [contactsExpanded, setContactsExpanded] = useState(false)
    const [todayTasks, setTodayTasks] = useState([])
    const [historyTasks, setHistoryTasks] = useState([])
    const [selectedContactId, setSelectedContactId] = useState(null)
    const [selected, setSelected] = useState(null)
    const [tasks, setTasks] = useState([])
    const [filteredTasks, setFilteredTasks] = useState([])
    const [taskTitle, setTaskTitle] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [editingProject, setEditingProject] = useState(null)
    const [editingTask, setEditingTask] = useState(null)
    const [addingTodayTask, setAddingTodayTask] = useState(false)
    const [editingTodayTask, setEditingTodayTask] = useState(null)
    const [reportingTask, setReportingTask] = useState(null)
    const [reportDate, setReportDate] = useState(getTodayKey())
    const [addingProject, setAddingProject] = useState(false)
    const [addingContact, setAddingContact] = useState(false)
    const [editingContactDetails, setEditingContactDetails] = useState(null)
    const [editingProjectDetails, setEditingProjectDetails] = useState(null)
    const [draggedProjectOver, setDraggedProjectOver] = useState(null)
    const todayKey = getTodayKey()
    const todayLabel = formatTodayLabel()

    useEffect(() => {
        loadProjects()
        loadContacts()
        loadTodayTasks()
        loadHistoryTasks()
    }, [])

    async function loadProjects() {
        const res = await window.api.invoke('get-projects')
        setProjects(res || [])
    }

    async function addProject(projectData) {
        const created = await window.api.invoke('add-project', projectData)
        loadProjects()
        if (created?.id) {
            setSelected(created.id)
            setSelectedContactId(null)
            setViewMode('project')
        }
    }

    async function deleteProject(id) {
        if (!confirm('Delete this project and all its tasks?')) return
        await window.api.invoke('delete-project', id)
        setSelected(null)
        loadProjects()
    }

    async function loadContacts() {
        const res = await window.api.invoke('get-contacts')
        setContacts(res || [])
    }

    async function addContact(contactData) {
        const created = await window.api.invoke('add-contact', contactData)
        loadContacts()
        if (created?.id) {
            setSelectedContactId(created.id)
            setSelected(null)
            setViewMode('contact')
        }
    }

    async function loadTodayTasks() {
        const res = await window.api.invoke('get-today-tasks', todayKey)
        setTodayTasks(res || [])
    }

    async function loadHistoryTasks() {
        const res = await window.api.invoke('get-history-tasks')
        setHistoryTasks(res || [])
    }

    async function addTodayTask(data) {
        const payload = {
            date_key: data.date_key || todayKey,
            title: data.title,
            description: data.description || null,
            project_id: data.project_id,
            contact_id: data.contact_id,
            contact_name: data.contact_name,
            contact_value: data.contact_value
        }

        await window.api.invoke('add-today-task', payload)
        loadTodayTasks()
        loadHistoryTasks()
    }

    async function updateTodayTask(data) {
        await window.api.invoke('update-today-task', data)
        loadTodayTasks()
        loadHistoryTasks()
    }

    async function changeTodayTaskStatus(id, status) {
        await window.api.invoke('update-today-task-status', { id, status })
        loadTodayTasks()
        loadHistoryTasks()
    }

    function openReportDatePicker(task) {
        setReportingTask(task)
        setReportDate(toInputDateValue(task.date_key || todayKey))
    }

    async function applyReportDate() {
        if (!reportingTask) return
        await window.api.invoke('update-today-task', {
            id: reportingTask.id,
            date_key: reportDate,
            status: 'reported'
        })
        setReportingTask(null)
        loadTodayTasks()
        loadHistoryTasks()
    }

    async function updateContact(contactData) {
        await window.api.invoke('update-contact', contactData)
        loadContacts()
    }

    async function updateProjectName(id, newName) {
        if (!newName.trim()) return
        await window.api.invoke('update-project', { id, name: newName })
        setEditingProject(null)
        loadProjects()
    }

    async function updateProjectDetails(projectData) {
        await window.api.invoke('update-project', projectData)
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
                    loadContacts()
                    loadTodayTasks()
                    loadHistoryTasks()
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
    const selectedProject = projects.find((p) => p.id === selected)
    const selectedContact = contacts.find((c) => c.id === selectedContactId)
    const formatProjectDate = (value) => value ? new Date(value).toLocaleDateString() : '—'
    const displayValue = (value) => value || '—'
    const groupedHistory = historyTasks.reduce((acc, task) => {
        const dateKey = task.date_key || 'unknown'
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(task)
        return acc
    }, {})

    const formatHistoryDate = (dateKey) => {
        if (!dateKey || !dateKey.includes('-')) return dateKey
        const [year, month, day] = dateKey.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <button
                        type="button"
                        className={`sidebar-toggle ${viewMode === 'today' ? 'sidebar-toggle-active' : ''}`}
                        onClick={() => {
                            setViewMode('today')
                            setSelected(null)
                            setSelectedContactId(null)
                        }}
                    >
                        <h2>Today</h2>
                    </button>
                    <button type="button" className="sidebar-add-btn" onClick={() => setAddingTodayTask(true)}>Add</button>
                </div>

                <div className="sidebar-header">
                    <button
                        type="button"
                        className="sidebar-toggle"
                        onClick={() => setProjectsExpanded(!projectsExpanded)}
                        aria-expanded={projectsExpanded}
                    >
                        <h2>Projects</h2>
                        <span className="toggle-icon">{projectsExpanded ? '▾' : '▸'}</span>
                    </button>
                    <button type="button" className="sidebar-add-btn" onClick={() => setAddingProject(true)}>Add</button>
                </div>
                {projectsExpanded && (
                    <>
                        <ul className="projects-list">
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
                                                <span onClick={() => { setSelected(p.id); setSelectedContactId(null); setViewMode('project') }}>{p.name}</span>
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
                    </>
                )}

                <div className="sidebar-header section-gap">
                    <button
                        type="button"
                        className="sidebar-toggle"
                        onClick={() => setContactsExpanded(!contactsExpanded)}
                        aria-expanded={contactsExpanded}
                    >
                        <h2>Contacts</h2>
                        <span className="toggle-icon">{contactsExpanded ? '▾' : '▸'}</span>
                    </button>
                    <button type="button" className="sidebar-add-btn" onClick={() => setAddingContact(true)}>Add</button>
                </div>

                {contactsExpanded && (
                    <ul className="contacts-list">
                        {contacts.map((contact) => (
                            <li
                                key={contact.id}
                                className={`contact-item ${selectedContactId === contact.id ? 'active' : ''}`}
                                onClick={() => { setSelectedContactId(contact.id); setSelected(null); setViewMode('contact') }}
                            >
                                <span>
                                    <strong>{contact.name}</strong>
                                    {contact.phone && <small>{contact.phone}</small>}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="sidebar-header section-gap">
                    <button
                        type="button"
                        className="sidebar-toggle"
                        onClick={() => {
                            setViewMode('history')
                            setSelected(null)
                            setSelectedContactId(null)
                        }}
                    >
                        <h2>History</h2>
                    </button>
                </div>
            </aside>

            <main>
                {viewMode === 'today' && (
                    <>
                        <h1>{todayLabel}</h1>
                        {todayTasks.length === 0 ? (
                            <div className="empty-state">No task added for today yet.</div>
                        ) : (
                            <ul className="today-task-list">
                                {todayTasks.map((task) => (
                                    <li key={task.id} className="today-task-item">
                                        <span className={`today-task-dot status-${task.status || 'open'}`} />
                                        <div className="today-task-top">
                                            <button type="button" className="today-task-name" onClick={() => setEditingTodayTask(task)}>
                                                {task.title}
                                            </button>
                                            <div className="today-task-actions">
                                                <button type="button" className="today-btn done" onClick={() => changeTodayTaskStatus(task.id, 'done')}>Done</button>
                                                <button type="button" className="today-btn dismiss" onClick={() => changeTodayTaskStatus(task.id, 'dismissed')}>Dismiss</button>
                                                <button type="button" className="today-btn report" onClick={() => openReportDatePicker(task)}>Report</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}

                {viewMode === 'history' && (
                    <>
                        <h1>History</h1>
                        {Object.keys(groupedHistory).length === 0 ? (
                            <div className="empty-state">No marked tasks in history yet.</div>
                        ) : (
                            <div className="history-groups">
                                {Object.entries(groupedHistory).map(([dateKey, items]) => (
                                    <div key={dateKey} className="history-group">
                                        <h3 className="history-date">{formatHistoryDate(dateKey)}</h3>
                                        <ul className="history-list">
                                            {items.map((task) => (
                                                <li key={task.id} className="history-item">
                                                    <strong>{task.title}</strong>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {viewMode === 'project' && selectedProject && (
                    <>
                        <h1>{selectedProject.name}</h1>
                        <div className="project-meta">
                            <div className="meta-item"><strong>TAG:</strong> <span>{selectedProject.tag || '—'}</span></div>
                            <div className="meta-item"><strong>Start date:</strong> <span>{formatProjectDate(selectedProject.start_date)}</span></div>
                            <div className="meta-item"><strong>End date:</strong> <span>{formatProjectDate(selectedProject.end_date)}</span></div>
                            <div className="meta-item"><strong>Priority:</strong> <span className={`priority-badge priority-${selectedProject.priority || 'medium'}`}>{selectedProject.priority || 'medium'}</span></div>
                            <button type="button" className="meta-edit-btn" onClick={() => setEditingProjectDetails(selectedProject)}>Edit</button>
                        </div>

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
                    </>
                )}

                {viewMode === 'contact' && selectedContact && (
                    <div className="contact-details right-panel-details">
                        <h1>{selectedContact.name}</h1>
                        <div className="contact-meta-item"><strong>Name:</strong> <span>{displayValue(selectedContact.name)}</span></div>
                        <div className="contact-meta-item"><strong>Phone:</strong> <span>{displayValue(selectedContact.phone)}</span></div>
                        <div className="contact-meta-item"><strong>Email:</strong> <span>{displayValue(selectedContact.email)}</span></div>
                        <div className="contact-meta-item"><strong>Address:</strong> <span>{displayValue(selectedContact.address)}</span></div>
                        <div className="contact-meta-item"><strong>Note:</strong> <span>{displayValue(selectedContact.note)}</span></div>
                        <button type="button" className="meta-edit-btn" onClick={() => setEditingContactDetails(selectedContact)}>Edit</button>
                    </div>
                )}

                {viewMode !== 'today' && viewMode !== 'history' && !selectedProject && !selectedContact && (
                    <div className="empty-state">Select a project or a contact to view details.</div>
                )}
            </main>

            {editingTask && (
                <TaskModal
                    task={editingTask}
                    projects={projects}
                    onClose={() => setEditingTask(null)}
                    onSave={updateTask}
                    onDelete={deleteTask}
                />
            )}

            {addingTodayTask && (
                <TodayTaskModal
                    projects={projects}
                    contacts={contacts}
                    defaultDate={todayKey}
                    onClose={() => setAddingTodayTask(false)}
                    onSave={addTodayTask}
                />
            )}

            {editingTodayTask && (
                <TodayTaskModal
                    mode="edit"
                    initialData={editingTodayTask}
                    projects={projects}
                    contacts={contacts}
                    defaultDate={todayKey}
                    onClose={() => setEditingTodayTask(null)}
                    onSave={updateTodayTask}
                />
            )}

            {reportingTask && (
                <div className="modal-backdrop" onClick={() => setReportingTask(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Report task</h2>
                        <label>Date</label>
                        <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                        <div className="modal-actions">
                            <button onClick={applyReportDate}>Save</button>
                            <button onClick={() => setReportingTask(null)} className="btn-cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {addingProject && (
                <ProjectModal
                    onClose={() => setAddingProject(false)}
                    onSave={addProject}
                />
            )}

            {editingProjectDetails && (
                <ProjectModal
                    mode="edit"
                    initialData={editingProjectDetails}
                    onClose={() => setEditingProjectDetails(null)}
                    onSave={updateProjectDetails}
                />
            )}

            {addingContact && (
                <ContactModal
                    onClose={() => setAddingContact(false)}
                    onSave={addContact}
                />
            )}

            {editingContactDetails && (
                <ContactModal
                    mode="edit"
                    initialData={editingContactDetails}
                    onClose={() => setEditingContactDetails(null)}
                    onSave={updateContact}
                />
            )}
        </div>
    )
}
