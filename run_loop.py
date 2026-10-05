import hashlib, pathlib, shutil, subprocess, sys, time

TASKS = pathlib.Path("docs/TASKS.md")
MAX_ITER = 300
PROMPT = (
    "You are the ORCHESTRATOR. Read CLAUDE.md. Pick the first task marked [~] or else [ ] "
    "in docs/TASKS.md and run the full DEV LOOP for exactly that ONE task. "
    "Update docs/TASKS.md and docs/PROGRESS.md, commit, then stop."
)

claude = shutil.which("claude")
if not claude:
    sys.exit("claude not found in PATH")

def state() -> str:
    return hashlib.md5(TASKS.read_bytes()).hexdigest()

stuck = 0
for i in range(1, MAX_ITER + 1):
    text = TASKS.read_text(encoding="utf-8")
    if "- [ ]" not in text and "- [~]" not in text:
        print("All tasks finished.")
        break
    before = state()
    print(f"\n=== iteration {i} ===")
    subprocess.run([claude, "-p", "--dangerously-skip-permissions", PROMPT])
    stuck = stuck + 1 if state() == before else 0
    if stuck >= 3:
        print("No progress for 3 iterations. Check docs/PROGRESS.md and intervene.")
        break
    time.sleep(2)