// Helper functions for localStorage
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getFromStorage(key, defaultValue = null) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function removeFromStorage(key) {
  localStorage.removeItem(key);
}

// Notes app functionality
class NotesApp {
  constructor() {
    this.noteText = document.getElementById("noteText");
    this.addNoteBtn = document.getElementById("addNoteBtn");
    this.notesList = document.getElementById("notesList");

    // Load notes from localStorage
    this.notes = getFromStorage("notes", []);

    this.init();
  }

  init() {
    this.addNoteBtn.addEventListener("click", () => this.addNote());
    this.noteText.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.addNote();
      }
    });

    this.renderNotes();
  }

  addNote() {
    const text = this.noteText.value.trim();
    if (!text) return;

    const note = {
      id: Date.now(),
      text: text,
      createdAt: new Date().toISOString()
    };

    this.notes.unshift(note); // Add to beginning
    saveToStorage("notes", this.notes);

    this.noteText.value = "";
    this.renderNotes();
  }

  deleteNote(id) {
    this.notes = this.notes.filter(note => note.id !== id);
    saveToStorage("notes", this.notes);
    this.renderNotes();
  }

  renderNotes() {
    this.notesList.innerHTML = "";

    if (this.notes.length === 0) {
      this.notesList.innerHTML = '<p class="empty">No notes yet. Add your first note above!</p>';
      return;
    }

    this.notes.forEach(note => {
      const noteEl = document.createElement("div");
      noteEl.classList.add("note");
      noteEl.dataset.id = note.id;

      const date = new Date(note.createdAt).toLocaleString();

      noteEl.innerHTML = `
        <div class="note-content">${note.text.replace(/\n/g, '<br>')}</div>
        <div class="note-meta">
          <span class="note-date">${date}</span>
          <button class="delete-btn" data-id="${note.id}">Delete</button>
        </div>
      `;

      // Add delete event listener
      const deleteBtn = noteEl.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", () => this.deleteNote(note.id));

      this.notesList.appendChild(noteEl);
    });
  }
}

// Initialize the app
new NotesApp();