# Database Connections

## MySQL

- host: `8.136.16.12`
- port: `3306`
- database: `jamyu`
- username: `root`
- password: `J7txumqc2b!`
- jdbc_url: `jdbc:mysql://8.136.16.12:3306/jamyu?zeroDateTimeBehavior=convertToNull&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&autoReconnect=true&allowMultiQueries=true`
- config file: `h/src/main/resources/application-prod.yml`

## Redis

- host: `localhost`
- port: `6379`
- database: `2`
- password: not configured
- config file: `h/src/main/resources/application-prod.yml`

## Local Startup Notes

### Frontend

- project: `q`
- command: `npm run start:dev`
- local URL: `http://localhost:8000`
- dev proxy:
  - `/api/` -> `http://localhost:8990`
  - `/file/` -> `http://localhost:8990`
- config file: `q/config/proxy.ts`

### Backend

- project: `h`
- startup method: IntelliJ IDEA Spring Boot run configuration
- IntelliJ IDEA path: `D:\DevSoftware\Jetbrains\IntelliJ IDEA\bin\idea64.exe`
- IntelliJ bundled Maven: `D:\DevSoftware\Jetbrains\IntelliJ IDEA\plugins\maven\lib\maven3\bin\mvn.cmd`
- main class: `com.youlai.boot.YouLaiBootApplication`
- active profile: `prod`
- program arguments: `--spring.profiles.active=prod`
- backend port: `8990`
- config file: `h/src/main/resources/application-prod.yml`

### Runtime Dependencies

- Java: JDK 17
- MySQL: see the MySQL section above
- Redis: local `localhost:6379`, database `2`

### Notes

- This workspace does not currently include `mvnw`, and `mvn.cmd` was not found in the system PATH during Codex checks.
- Start the backend from IDEA first, then keep the frontend running on port `8000`.
- If the frontend shows `Response status:504`, check whether the backend is listening on `localhost:8990`.
