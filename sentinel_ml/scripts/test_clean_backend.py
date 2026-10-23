import os
import subprocess
import sys
from check_exact_deps import get_clean_classpath

def main():
    root = os.path.abspath("sentinel/backend")
    target_classes = os.path.join(root, "target", "classes")
    clean_jars = get_clean_classpath()
    cp = [target_classes] + clean_jars
    cp_str = ";".join([p.replace("\\", "/") for p in cp])

    argfile = os.path.join(root, "target", "clean_run_args.txt")
    with open(argfile, "w", encoding="utf-8") as f:
        f.write("-cp\n")
        f.write(f'"{cp_str}"\n')
        f.write("com.sentinel.SentinelApplication\n")

    log_file = os.path.join(root, "target", "backend_clean.log")
    print(f"Clean argfile written ({len(clean_jars)} exact jars). Launching SentinelApplication and logging to {log_file}...")
    with open(log_file, "w", encoding="utf-8") as out:
        proc = subprocess.Popen(["java", f"@{argfile}"], stdout=out, stderr=subprocess.STDOUT, text=True)
        import time
        time.sleep(12)
        alive = proc.poll() is None
        print("Checking if process is still alive after 12s:", alive)
        if alive:
            print("Terminating process...")
            proc.terminate()
            
    if os.path.exists(log_file):
        with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
            print("LOG OUTPUT:\n", f.read()[:2000])

if __name__ == "__main__":
    main()
