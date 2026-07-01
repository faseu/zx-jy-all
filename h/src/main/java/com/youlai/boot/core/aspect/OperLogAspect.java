package com.youlai.boot.core.aspect;

import com.alibaba.fastjson.JSON;
import com.youlai.boot.security.util.SecurityUtils;
import com.youlai.boot.system.mapper.UserMapper;
import com.youlai.boot.system.model.entity.TOperLog;
import com.youlai.boot.system.model.entity.User;
import com.youlai.boot.system.service.TOperLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Date;
import java.util.Map;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperLogAspect {

    private final TOperLogService logService;

    private final UserMapper userMapper;

    @Pointcut("@annotation(com.youlai.boot.common.annotation.OperLog)")
    public void operLogPointcut() {
    }

    @Around("operLogPointcut() && @annotation(logAnnotation)")
    public Object doAround(
            ProceedingJoinPoint joinPoint,
            com.youlai.boot.common.annotation.OperLog logAnnotation
    ) throws Throwable {
        Object result = joinPoint.proceed();

        Long userId = SecurityUtils.getUserId();
        String username = SecurityUtils.getUsername();
        User user = userId == null ? null : userMapper.selectById(userId);
        Date operateTime = new Date();
        Date loginTime = user == null || user.getLoginTime() == null ? operateTime : user.getLoginTime();
        String params = JSON.toJSONString(joinPoint.getArgs());
        Long provinceId = firstLong(params, "provinceId", "deptId");
        Long prisonId = firstLong(params, "prisonId");
        Integer prisonLevel = firstInteger(params, "prisonLevel", "level");
        HttpServletRequest request = getRequest();
        String path = request == null ? "" : request.getRequestURI();
        String method = request == null ? "" : request.getMethod();

        log.info("operation params: {}", params);
        saveLog(
                username,
                loginTime,
                operateTime,
                logAnnotation.value(),
                resolveActionCode(method, logAnnotation.value()),
                resolveModuleCode(path),
                path,
                method,
                provinceId,
                prisonId,
                prisonLevel,
                params
        );

        return result;
    }

    private HttpServletRequest getRequest() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return null;
        }
        return attributes.getRequest();
    }

    private String resolveActionCode(String method, String content) {
        if (content != null) {
            if (content.contains("新增")) {
                return "CREATE";
            }
            if (content.contains("修改") || content.contains("设置") || content.contains("更新")) {
                return "UPDATE";
            }
            if (content.contains("删除")) {
                return "DELETE";
            }
            if (content.contains("导出")) {
                return "EXPORT";
            }
        }

        return switch (method == null ? "" : method.toUpperCase()) {
            case "POST" -> "CREATE";
            case "PUT", "PATCH" -> "UPDATE";
            case "DELETE" -> "DELETE";
            default -> "VIEW";
        };
    }

    private String resolveModuleCode(String path) {
        if (path == null) {
            return "SYSTEM";
        }
        if (path.contains("/auth")) {
            return "AUTH";
        }
        if (path.contains("/province") || path.contains("/prison") || path.contains("/building") || path.contains("/floor")) {
            return "REGION";
        }
        if (path.contains("/users")) {
            return "USER";
        }
        if (path.contains("/device") || path.contains("/udp") || path.contains("/shield")) {
            return "DEVICE";
        }
        if (path.contains("/alarm")) {
            return "ALARM";
        }
        if (path.contains("/logs") || path.contains("/operlogs")) {
            return "LOG";
        }
        return "SYSTEM";
    }

    private void saveLog(
            String username,
            Date loginTime,
            Date operateTime,
            String content,
            String actionCode,
            String moduleCode,
            String path,
            String method,
            Long provinceId,
            Long prisonId,
            Integer prisonLevel,
            String params
    ) {
        TOperLog log = new TOperLog();
        log.setCreateBy(username);
        log.setLoginTime(loginTime);
        log.setOperateTime(operateTime);
        log.setCreateTime(operateTime);
        log.setIsDeleted(0);
        log.setContent(content);
        log.setActionCode(actionCode);
        log.setModuleCode(moduleCode);
        log.setPath(path);
        log.setRequestMethod(method);
        log.setProvinceId(provinceId);
        log.setPrisonId(prisonId);
        log.setPrisonLevel(prisonLevel);
        log.setParams(params);

        logService.save(log);
    }

    private Long firstLong(String json, String... keys) {
        Object parsed = parseJson(json);
        for (String key : keys) {
            Object value = findValue(parsed, key);
            if (value instanceof Number number) {
                return number.longValue();
            }
            if (value instanceof String text && !text.isBlank()) {
                try {
                    return Long.parseLong(text);
                } catch (NumberFormatException ignored) {
                    // Keep looking.
                }
            }
        }
        return null;
    }

    private Integer firstInteger(String json, String... keys) {
        Object parsed = parseJson(json);
        for (String key : keys) {
            Object value = findValue(parsed, key);
            if (value instanceof Number number) {
                return number.intValue();
            }
            if (value instanceof String text && !text.isBlank()) {
                try {
                    return Integer.parseInt(text);
                } catch (NumberFormatException ignored) {
                    // Keep looking.
                }
            }
        }
        return null;
    }

    private Object parseJson(String json) {
        try {
            return JSON.parse(json);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Object findValue(Object value, String key) {
        if (value instanceof Map<?, ?> map) {
            if (map.containsKey(key)) {
                return map.get(key);
            }
            for (Object child : map.values()) {
                Object found = findValue(child, key);
                if (found != null) {
                    return found;
                }
            }
        }
        if (value instanceof Iterable<?> iterable) {
            for (Object child : iterable) {
                Object found = findValue(child, key);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }
}
