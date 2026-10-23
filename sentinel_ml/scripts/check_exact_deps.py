import os
import time

expected_artifacts = [
    # Core Spring Boot
    "spring-boot-3.2.3.jar",
    "spring-boot-autoconfigure-3.2.3.jar",
    "spring-core-6.1.4.jar",
    "spring-jcl-6.1.4.jar",
    "spring-context-6.1.4.jar",
    "spring-beans-6.1.4.jar",
    "spring-aop-6.1.4.jar",
    "spring-expression-6.1.4.jar",
    "jakarta.annotation-api-2.1.1.jar",
    "snakeyaml-2.2.jar",
    
    # Logging
    "logback-classic-1.4.14.jar",
    "logback-core-1.4.14.jar",
    "slf4j-api-2.0.12.jar",
    "jul-to-slf4j-2.0.12.jar",
    "log4j-to-slf4j-2.21.1.jar",
    "log4j-api-2.21.1.jar",
    
    # Web / Tomcat
    "spring-web-6.1.4.jar",
    "spring-webmvc-6.1.4.jar",
    "tomcat-embed-core-10.1.19.jar",
    "tomcat-embed-el-10.1.19.jar",
    "tomcat-embed-websocket-10.1.19.jar",
    "jackson-databind-2.15.4.jar",
    "jackson-annotations-2.15.4.jar",
    "jackson-core-2.15.4.jar",
    "jackson-datatype-jdk8-2.15.4.jar",
    "jackson-datatype-jsr310-2.15.4.jar",
    "jackson-module-parameter-names-2.15.4.jar",
    
    # JPA / Hibernate
    "spring-boot-starter-data-jpa-3.2.3.jar",
    "spring-data-jpa-3.2.3.jar",
    "spring-data-commons-3.2.3.jar",
    "spring-orm-6.1.4.jar",
    "spring-jdbc-6.1.4.jar",
    "spring-tx-6.1.4.jar",
    "spring-aspects-6.1.4.jar",
    "aspectjweaver-1.9.21.jar",
    "HikariCP-5.0.1.jar",
    "hibernate-core-6.4.4.Final.jar",
    "jakarta.persistence-api-3.1.0.jar",
    "jakarta.transaction-api-2.0.1.jar",
    "jboss-logging-3.5.3.Final.jar",
    "hibernate-commons-annotations-6.0.6.Final.jar",
    "byte-buddy-1.14.12.jar",
    "classmate-1.6.0.jar",
    "antlr4-runtime-4.13.0.jar",
    "jandex-3.1.2.jar",
    
    # MSSQL
    "mssql-jdbc"
]

repo = os.path.expanduser("~/.m2/repository")

def get_clean_classpath():
    t0 = time.time()
    # Fast single-pass walk of .m2
    jar_map = {}
    for root, _, files in os.walk(repo):
        for f in files:
            if f.endswith(".jar") and not (f.endswith("-sources.jar") or f.endswith("-javadoc.jar")):
                jar_map[f] = os.path.join(root, f)

    clean_jars = []
    for item in expected_artifacts:
        if item in jar_map:
            clean_jars.append(jar_map[item])
        else:
            # substring match
            matched = [path for fname, path in jar_map.items() if item in fname]
            if matched:
                clean_jars.append(matched[0])

    print(f"Classpath resolved: {len(clean_jars)} jars in {time.time()-t0:.2f}s")
    return clean_jars

if __name__ == "__main__":
    cp = get_clean_classpath()
    print("Total clean jars:", len(cp))
