// Constants
const STORAGE_KEY = "task-symphony-data";
const MOTIVATIONAL_QUOTES = [
  "Progress is progress, no matter how small.",
  "You've got this! One task at a time.",
  "Small steps lead to big achievements.",
  "Every task completed is a victory worth celebrating.",
  "Keep going, you're doing great!",
  "Today's efforts shape tomorrow's success.",
  "Focus on progress, not perfection.",
];

// State Management
let tasks = [];
let currentFilter = "all";

// DOM Elements
const elements = {
  taskInput: document.getElementById("taskInput"),
  tasksList: document.getElementById("tasksList"),
  addButton: document.getElementById("addTaskBtn"),
  emptyState: document.getElementById("emptyState"),
  welcomeText: document.getElementById("welcomeText"),
  totalTasks: document.getElementById("totalTasks"),
  completedTasks: document.getElementById("completedTasks"),
  progressFill: document.getElementById("progressFill"),
  motivationalText: document.getElementById("motivationalText"),
  filterButtons: document.querySelectorAll(".filter-btn"),
};

// Initialize App
function initializeApp() {
  loadTasks();
  setupEventListeners();
  updateUI();
  setWelcomeMessage();
  setRandomQuote();
}

// Event Listeners Setup
function setupEventListeners() {
  // Add task events
  elements.addButton.addEventListener("click", handleAddTask);
  elements.taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddTask();
  });

  // Filter events
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const filter = e.target.dataset.filter;
      setFilter(filter);
    });
  });

  // Mobile touch events
  if ("ontouchstart" in window) {
    setupMobileEvents();
  }
}

// Mobile Event Handling
function setupMobileEvents() {
  let touchStartX = 0;
  let touchEndX = 0;

  elements.tasksList.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    false
  );

  elements.tasksList.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe(e.target.closest(".task-item"));
    },
    false
  );

  function handleSwipe(taskElement) {
    const swipeLength = Math.abs(touchEndX - touchStartX);
    if (swipeLength > 100) {
      const taskId = parseInt(taskElement?.dataset.taskId);
      if (taskId) {
        if (touchEndX < touchStartX) {
          deleteTask(taskId);
        } else {
          toggleTask(taskId);
        }
      }
    }
  }
}

// Task Management
function handleAddTask() {
  const text = elements.taskInput.value.trim();

  if (!text) {
    shakeDOMElement(elements.taskInput);
    return;
  }

  addTask(text);
  elements.taskInput.value = "";
  elements.taskInput.focus();
}

function addTask(text) {
  const task = {
    id: Date.now(),
    text: sanitizeInput(text),
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  tasks.unshift(task);
  saveTasks();
  updateUI();

  // Provide haptic feedback on mobile
  if ("vibrate" in navigator) {
    navigator.vibrate(50);
  }
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    saveTasks();
    updateUI();

    // Provide haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(25);
    }
  }
}

function deleteTask(id) {
  const taskElement = document.querySelector(`[data-task-id="${id}"]`);
  if (taskElement) {
    // Animate removal
    taskElement.style.animation = "slideOut 0.3s ease forwards";

    setTimeout(() => {
      tasks = tasks.filter((task) => task.id !== id);
      saveTasks();
      updateUI();
    }, 300);
  }
}

// UI Updates
function updateUI() {
  updateTasksList();
  updateStats();
  updateEmptyState();
  updateRandomQuote();
}

function updateTasksList() {
  const filteredTasks = getFilteredTasks();
  elements.tasksList.innerHTML = "";

  filteredTasks.forEach((task) => {
    const li = createTaskElement(task);
    elements.tasksList.appendChild(li);
  });
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-item ${task.completed ? "completed" : ""}`;
  li.dataset.taskId = task.id;

  // Format options for toLocaleString
  const timeOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // This enables 12-hour format
  };

  li.innerHTML = `
        <div class="task-content">
            <span class="task-text">${task.text}</span>
            <div class="task-actions">
                <button class="task-btn complete" onclick="toggleTask(${
                  task.id
                })">
                    ${task.completed ? "Undo" : "Complete"}
                </button>
                <button class="task-btn delete" onclick="deleteTask(${
                  task.id
                })">
                    Delete
                </button>
            </div>
        </div>
        <div class="task-meta">
            ${
              task.completed
                ? `<span class="completion-time">
                    <span class="time-label">Completed:</span> 
                    ${new Date(task.completedAt).toLocaleString(
                      "en-US",
                      timeOptions
                    )}
                </span>`
                : `<span class="creation-time">
                    <span class="time-label">Created:</span> 
                    ${new Date(task.createdAt).toLocaleString(
                      "en-US",
                      timeOptions
                    )}
                </span>`
            }
        </div>
    `;

  return li;
}

// Filter Management
function setFilter(filter) {
  currentFilter = filter;

  // Update filter buttons
  elements.filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });

  updateUI();
}

function getFilteredTasks() {
  switch (currentFilter) {
    case "active":
      return tasks.filter((task) => !task.completed);
    case "completed":
      return tasks.filter((task) => task.completed);
    default:
      return tasks;
  }
}

// Statistics Updates
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  elements.totalTasks.textContent = total;
  elements.completedTasks.textContent = completed;
  elements.progressFill.style.width = `${progress}%`;
}

// Empty State Management
function updateEmptyState() {
  const filteredTasks = getFilteredTasks();
  elements.emptyState.style.display =
    filteredTasks.length === 0 ? "block" : "none";
}

// Welcome Message
function setWelcomeMessage() {
  const hour = new Date().getHours();
  let message = "";

  if (hour < 12) {
    message = "Good morning! Ready to be productive?";
  } else if (hour < 17) {
    message = "Good afternoon! Keep the momentum going!";
  } else {
    message = "Good evening! Let's wrap up some tasks!";
  }

  elements.welcomeText.textContent = message;
}

// Motivational Quotes
function setRandomQuote() {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  elements.motivationalText.textContent = MOTIVATIONAL_QUOTES[randomIndex];
}

function updateRandomQuote() {
  if (Math.random() < 0.1) {
    // 10% chance to update quote on UI refresh
    setRandomQuote();
  }
}

// Utility Functions
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "today";
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function sanitizeInput(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function shakeDOMElement(element) {
  element.classList.add("shake");
  setTimeout(() => element.classList.remove("shake"), 500);
}

// Storage Management
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);
  tasks = savedTasks ? JSON.parse(savedTasks) : [];
}

// Initialize the app
document.addEventListener("DOMContentLoaded", initializeApp);
