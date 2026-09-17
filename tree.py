# tree.py
import os

# Folders to ignore
IGNORE_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "dist",
    "build",
    "coverage",
    "__pycache__",
}

# Files to ignore
IGNORE_FILES = {
    ".DS_Store",
    "tree.py",
}

def print_tree(path, prefix=""):
    try:
        items = sorted(os.listdir(path), key=lambda x: (not os.path.isdir(os.path.join(path, x)), x.lower()))
    except PermissionError:
        return

    items = [
        item for item in items
        if item not in IGNORE_DIRS
        and item not in IGNORE_FILES
    ]

    for index, item in enumerate(items):
        full_path = os.path.join(path, item)
        is_last = index == len(items) - 1

        connector = "└── " if is_last else "├── "
        print(prefix + connector + item)

        if os.path.isdir(full_path):
            new_prefix = prefix + ("    " if is_last else "│   ")
            print_tree(full_path, new_prefix)


if __name__ == "__main__":
    project_path = os.getcwd()

    print(os.path.basename(project_path) + "/")
    print_tree(project_path)