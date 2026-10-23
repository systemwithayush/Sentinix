import glob
import os
import re

def resolve_classpath():
    repo = os.path.expanduser("~/.m2/repository")
    all_jars = glob.glob(os.path.join(repo, "**", "*.jar"), recursive=True)
    
    # Map by artifact name (basename without version)
    # E.g. logback-classic-1.4.14.jar -> name: logback-classic, ver: 1.4.14
    artifacts = {}
    for jar in all_jars:
        # ignore javadoc and sources
        if jar.endswith("-sources.jar") or jar.endswith("-javadoc.jar") or jar.endswith("-tests.jar"):
            continue
        base = os.path.basename(jar)
        m = re.match(r"^([a-zA-Z0-9_\-\.]+?)-(\d+[\.\d\w\-\+]*)\.jar$", base)
        if m:
            art_name = m.group(1)
            ver_str = m.group(2)
            if art_name not in artifacts:
                artifacts[art_name] = []
            artifacts[art_name].append((ver_str, jar))
        else:
            art_name = base.replace(".jar", "")
            if art_name not in artifacts:
                artifacts[art_name] = []
            artifacts[art_name].append(("0", jar))

    selected_jars = []
    
    # Specific preferences for Spring Boot 3.2.3:
    preferred = {
        "logback-classic": "1.4.14",
        "logback-core": "1.4.14",
        "slf4j-api": "2.0.12",
        "jul-to-slf4j": "2.0.12",
        "log4j-to-slf4j": "2.21.1",
        "log4j-api": "2.21.1",
        "jackson-databind": "2.15.4",
        "jackson-core": "2.15.4",
        "jackson-annotations": "2.15.4",
        "spring-boot": "3.2.3",
        "spring-boot-autoconfigure": "3.2.3",
        "spring-core": "6.1.4",
        "spring-web": "6.1.4",
        "spring-webmvc": "6.1.4",
        "spring-context": "6.1.4",
        "spring-beans": "6.1.4",
        "spring-aop": "6.1.4",
        "spring-expression": "6.1.4",
        "spring-data-jpa": "3.2.3",
        "spring-data-commons": "3.2.3",
        "hibernate-core": "6.4.4.Final",
        "jakarta.persistence-api": "3.1.0",
        "tomcat-embed-core": "10.1.19"
    }

    for art, ver_list in artifacts.items():
        # Spring Boot 3 uses spring-jcl natively; exclude conflicting legacy bridges
        if art in ["jcl-over-slf4j", "commons-logging"]:
            continue
        if art in preferred:
            target_ver = preferred[art]
            match = [j for v, j in ver_list if target_ver in v]
            if match:
                selected_jars.append(match[0])
                continue
        # Fallback: pick the one with 3.2.3 or 6.1.4 or highest version
        # Sort by length and version
        ver_list.sort(key=lambda x: [int(c) if c.isdigit() else 0 for c in re.split(r'[\.\-\_]', x[0])], reverse=True)
        selected_jars.append(ver_list[0][1])

    return selected_jars

if __name__ == "__main__":
    cp = resolve_classpath()
    print(f"Resolved {len(cp)} unique jars.")
    # check logback
    for j in cp:
        if "logback" in j or "slf4j-api" in j:
            print(" ", j)
