class TodoApp {
    constructor() {
        this.input = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.list = document.getElementById('taskList');
        this.categorySelect = document.getElementById('categorySelect');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.searchInput = document.getElementById('searchInput');
        this.filterCategory = document.getElementById('filterCategory');
        this.filterPriority = document.getElementById('filterPriority');
        this.filterStatus = document.getElementById('filterStatus');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');

        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.editingIndex = null;

        this.init();
    }

    init() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        this.list.addEventListener('click', (e) => this.handleListClick(e));
        this.searchInput.addEventListener('input', () => this.renderTasks());
        this.filterCategory.addEventListener('change', () =>
            this.renderTasks()
        );
        this.filterPriority.addEventListener('change', () =>
            this.renderTasks()
        );
        this.filterStatus.addEventListener('change', () => this.renderTasks());
        this.renderTasks();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    getFilteredTasks() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const categoryFilter = this.filterCategory.value;
        const priorityFilter = this.filterPriority.value;
        const statusFilter = this.filterStatus.value;

        return this.tasks.filter((task) => {
            const matchesSearch = task.text.toLowerCase().includes(searchTerm);
            const matchesCategory =
                !categoryFilter || task.category === categoryFilter;
            const matchesPriority =
                !priorityFilter || task.priority === priorityFilter;
            const matchesStatus =
                !statusFilter ||
                (statusFilter === 'completed' && task.completed) ||
                (statusFilter === 'pending' && !task.completed);

            return (
                matchesSearch &&
                matchesCategory &&
                matchesPriority &&
                matchesStatus
            );
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter((t) => t.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = `Total: ${total}`;
        this.completedTasksEl.textContent = `Completed: ${completed}`;
        this.pendingTasksEl.textContent = `Pending: ${pending}`;
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        this.list.innerHTML = '';
        this.updateStats();

        filteredTasks.forEach((task, originalIndex) => {
            const li = document.createElement('li');
            li.dataset.index = originalIndex;

            if (task.completed) {
                li.classList.add('completed');
            }

            // Priority indicator
            const priorityEl = document.createElement('span');
            priorityEl.classList.add('priority', `priority-${task.priority}`);
            priorityEl.textContent = task.priority.toUpperCase()[0];
            li.appendChild(priorityEl);

            // Task text or input for editing
            if (this.editingIndex === originalIndex) {
                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.value = task.text;
                editInput.classList.add('edit-input');
                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.saveEdit(editInput.value);
                    }
                    if (e.key === 'Escape') {
                        this.cancelEdit();
                    }
                });
                editInput.addEventListener('blur', () =>
                    this.saveEdit(editInput.value)
                );
                li.appendChild(editInput);
                editInput.focus();
            } else {
                const span = document.createElement('span');
                span.textContent = task.text;
                span.addEventListener('dblclick', () =>
                    this.startEdit(originalIndex)
                );
                li.appendChild(span);
            }

            // Task details
            const details = document.createElement('div');
            details.classList.add('task-details');

            if (task.category) {
                const categoryEl = document.createElement('span');
                categoryEl.classList.add('category');
                categoryEl.textContent = task.category;
                details.appendChild(categoryEl);
            }

            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const dueEl = document.createElement('span');
                dueEl.classList.add(
                    'due-date',
                    this.isOverdue(task.dueDate) ? 'overdue' : ''
                );
                dueEl.textContent = dueDate.toLocaleDateString();
                details.appendChild(dueEl);
            }

            li.appendChild(details);

            // Buttons
            const actions = document.createElement('div');
            actions.classList.add('actions');

            if (this.editingIndex !== originalIndex) {
                // Edit button
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.classList.add('edit-btn');
                actions.appendChild(editBtn);

                // Delete button
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Delete';
                delBtn.classList.add('delete-btn');
                actions.appendChild(delBtn);
            }

            li.appendChild(actions);
            this.list.appendChild(li);
        });
    }

    isOverdue(dueDate) {
        if (!dueDate) {
            return false;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        return due < today;
    }

    handleListClick(e) {
        const li = e.target.closest('li');
        if (!li) {
            return;
        }
        const index = parseInt(li.dataset.index);

        if (e.target.classList.contains('edit-btn')) {
            this.startEdit(index);
        } else if (e.target.classList.contains('delete-btn')) {
            this.deleteTask(index);
        } else if (
            e.target.tagName === 'SPAN' &&
            !e.target.classList.contains('category') &&
            !e.target.classList.contains('due-date')
        ) {
            this.toggleComplete(index);
        }
    }

    addTask() {
        const value = this.input.value.trim();
        if (!value) {
            return;
        }

        this.tasks.push({
            text: value,
            completed: false,
            category: this.categorySelect.value,
            priority: this.prioritySelect.value,
            dueDate: this.dueDateInput.value,
        });

        this.input.value = '';
        this.categorySelect.value = '';
        this.dueDateInput.value = '';
        this.saveTasks();
        this.renderTasks();
    }

    toggleComplete(index) {
        this.tasks[index].completed = !this.tasks[index].completed;
        this.saveTasks();
        this.renderTasks();
    }

    startEdit(index) {
        this.editingIndex = index;
        this.renderTasks();
    }

    saveEdit(newText) {
        if (newText.trim()) {
            this.tasks[this.editingIndex].text = newText.trim();
            this.saveTasks();
        }
        this.editingIndex = null;
        this.renderTasks();
    }

    cancelEdit() {
        this.editingIndex = null;
        this.renderTasks();
    }

    deleteTask(index) {
        this.tasks.splice(index, 1);
        this.saveTasks();
        this.renderTasks();
    }
}

// Initialize the app
new TodoApp();
