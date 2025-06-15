# 🌱 Groot - A Lightweight Version Control System

Groot is a simple, educational version control system , inspired by Git. It helps you understand the internal mechanics of version control — including staging, committing, and diffing — all written from scratch.

---

## 📦 Features

- ✅ Initialize a `.groot` repository
- ✅ Add files to staging
- ✅ Commit changes
- ✅ View commit history
- ✅ Show file differences from previous commit

---

## 🛠️ Setup

### 1. Clone or download the project

```bash
git clone https://github.com/Shovan001/Groot-the-VCS
cd groot-vcs
```

### 2. Install required dependencies

```bash
npm install
```

---

## 🚀 Usage (Windows)

Run the CLI using Node.js:

### ➤ Initialize a repository

```bash
node .\Groot.mjs init
```

### ➤ Add a file

```bash
node .\Groot.mjs add sample.txt
```

### ➤ Commit changes

```bash
node .\Groot.mjs commit "Initial commit"
```

### ➤ View commit history

```bash
node .\Groot.mjs log
```

### ➤ Show diff for a commit

```bash
node .\Groot.mjs show <commitHash>
```

---

## 💡 How It Works

- Creates a `.groot/` folder to store all VCS metadata
- Stores files and commits as SHA1-hashed content
- Uses JSON format to simulate commits and file tracking
- Highlights differences between commits using the `diff` library

---

## 📁 Folder Structure

```
.groot/
 ├── objects/         # Stores file versions and commits
 ├── index            # Tracks staged files
 └── HEAD             # Points to latest commit
```