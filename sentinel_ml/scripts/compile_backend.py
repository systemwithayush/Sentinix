import glob
import os
import subprocess
import sys

def main():
    root = os.path.abspath("sentinel/backend")
    jars = glob.glob(os.path.expanduser("~/.m2/repository/**/*.jar"), recursive=True)
    # Also include existing target classes if any
    target_classes = os.path.join(root, "target", "classes")
    os.makedirs(target_classes, exist_ok=True)
    
    cp_entries = [target_classes.replace("\\", "/")] + [j.replace("\\", "/") for j in jars]
    cp_str = ";".join(cp_entries)
    
    java_files = glob.glob(os.path.join(root, "src", "main", "java", "**", "*.java"), recursive=True)
    argfile = os.path.join(root, "target", "javac_args.txt")
    
    with open(argfile, "w", encoding="utf-8") as f:
        f.write("-cp\n")
        f.write(f'"{cp_str}"\n')
        f.write("-d\n")
        f.write(f'"{target_classes.replace(os.sep, "/")}"\n')
        for jf in java_files:
            f.write(f'"{jf.replace(os.sep, "/")}"\n')
            
    print(f"Compiling {len(java_files)} Java files...")
    cmd = ["javac", f"@{argfile}"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)
    print("Return code:", res.returncode)
    
    if res.returncode == 0:
        print("[SUCCESS] Java compilation successful.")
    else:
        print("[FAILED] Java compilation failed.")
    return res.returncode

if __name__ == "__main__":
    sys.exit(main())
