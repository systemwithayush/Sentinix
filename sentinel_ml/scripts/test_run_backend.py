import glob
import os
import subprocess
import sys
from resolve_backend_cp import resolve_classpath

def main():
    root = os.path.abspath("sentinel/backend")
    jars = resolve_classpath()
    target_classes = os.path.join(root, "target", "classes")
    cp = [target_classes] + jars
    cp_str = ";".join([p.replace("\\", "/") for p in cp])

    argfile = os.path.join(root, "target", "run_args.txt")
    with open(argfile, "w", encoding="utf-8") as f:
        f.write("-cp\n")
        f.write(f'"{cp_str}"\n')
        f.write("com.sentinel.SentinelApplication\n")

    log_file = os.path.join(root, "target", "backend.log")
    print(f"Argfile written ({len(jars)} jars). Launching SentinelApplication and logging to {log_file}...")
    with open(log_file, "w", encoding="utf-8") as out:
        proc = subprocess.Popen(["java", f"@{argfile}"], stdout=out, stderr=subprocess.STDOUT, text=True)
        import time
        time.sleep(12)
        print("Checking if process is still alive after 12s:", proc.poll() is None)
        if proc.poll() is None:
            print("Terminating process...")
            proc.terminate()
            
    with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
        print("LOG OUTPUT:\n", f.read()[:2000])

if __name__ == "__main__":
    main()
