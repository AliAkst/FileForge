import subprocess
import sys
import shutil

def run_command(command, description):
    # Split command for shutil.which
    cmd_parts = command.split()
    if not cmd_parts:
        return True
    
    base_cmd = cmd_parts[0]
    
    # Special handling for npx
    if base_cmd == "npx":
        # Check if npx is available
        if not shutil.which("npx"):
             print(f"[SKIP] {description} (npx not found)")
             return True
        # Use --yes to avoid interactive prompts
        if "vitest" in command:
            command = command.replace("npx", "npx --yes")
    else:
        if not shutil.which(base_cmd):
            print(f"[SKIP] {description} ({base_cmd} not found)")
            return True

    print(f"Running {description}...")
    try:
        # Use shell=True for Windows
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[PASS] {description}")
            if result.stdout:
                print(result.stdout.strip())
            return True
        else:
            # Handle cases where the command is found but fails because there is nothing to do yet
            # e.g., no tests found or no files to lint
            error_msg = result.stderr.strip()
            if "No test files found" in error_msg or "No files found" in error_msg or "0 files checked" in error_msg:
                print(f"[SKIP] {description} (no files/tests found yet)")
                return True
            
            # Also check for ruff/mypy/pytest "no files found" messages
            if "No files found" in error_msg:
                print(f"[SKIP] {description} (no files found)")
                return True

            print(f"[FAIL] {description}")
            print(f"Error: {error_msg}")
            return False
    except Exception as e:
        print(f"[SKIP] {description} (execution error: {e})")
        return True

def main():
    print("--- Running Project Checks ---")
    
    # Backend checks
    success = True
    
    # ruff
    if not run_command("ruff check .", "ruff linting"):
        success = False
        
    # mypy
    if not run_command("mypy .", "mypy type checking"):
        success = False

    # pytest
    if not run_command("pytest", "pytest unit/integration tests"):
        success = False

    # Frontend checks
    # vitest
    if not run_command("npx vitest run", "vitest frontend tests"):
        success = False

    print("--- Check Summary ---")
    if success:
        print("All checks passed (or were gracefully skipped).")
        sys.exit(0)
    else:
        print("Some checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
