import os
import subprocess
import time
import socket

def is_port_open(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    res = s.connect_ex(('127.0.0.1', port))
    s.close()
    return res == 0

def main():
    root = os.path.abspath("sentinel/backend")
    argfile = os.path.join(root, "target", "clean_run_args.txt")
    log_file = os.path.join(root, "target", "backend_run.log")

    print("Launching Spring Boot SentinelApplication...")
    with open(log_file, "w", encoding="utf-8") as out:
        proc = subprocess.Popen(["java", f"@{argfile}"], stdout=out, stderr=subprocess.STDOUT, text=True)
        
        start_time = time.time()
        port_opened = False
        while time.time() - start_time < 30:
            if is_port_open(8080):
                print(f"[SUCCESS] Spring Boot port 8080 is OPEN after {time.time()-start_time:.1f}s!")
                port_opened = True
                break
            if proc.poll() is not None:
                print(f"[EXIT] Process terminated early with code {proc.returncode} after {time.time()-start_time:.1f}s")
                break
            time.sleep(1)

        if port_opened:
            print("Backend running successfully. Shutting down test process...")
            proc.terminate()
            
    with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
        print("\n--- BACKEND LOG OUTPUT ---\n" + f.read())

if __name__ == "__main__":
    main()
