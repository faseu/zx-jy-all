package com.youlai.boot.udp2;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RedisCommandQueue {
    // ==================== 统一前缀（唯一） ====================
    private static final String DEVICE_KEY_PREFIX = "shield:device:";

    // ==================== 各功能后缀 ====================
    private static final String COMMAND_QUEUE_SUFFIX = ":commands";
    private static final String LOCK_SUFFIX = ":lock";
    private static final String STATUS_SUFFIX = ":status";
    private static final String HEARTBEAT_SUFFIX = ":heartbeat";

    // ==================== 其他独立前缀 ====================
    private static final String COMMAND_RESULT_PREFIX = "shield:command:";

    // ==================== 过期时间配置 ====================
    private static final long HEARTBEAT_EXPIRE_SECONDS = 120; // 2分钟
    private static final long LOCK_EXPIRE_SECONDS = 10; // 10秒
    private static final long COMMAND_RESULT_EXPIRE_HOURS = 1; // 1小时

    private final RedisTemplate<String, Object> redisTemplate;

    // ==================== 命令队列相关 ====================

    public String sendCommand(String deviceId, DeviceCommand command) {
        String commandId = UUID.randomUUID().toString();
        command.setCommandId(commandId);
        command.setCreateTime(System.currentTimeMillis());

        String queueKey = DEVICE_KEY_PREFIX + deviceId + COMMAND_QUEUE_SUFFIX;
        redisTemplate.opsForList().rightPush(queueKey, command);

        return commandId;
    }

    public DeviceCommand popNextCommand(int deviceId) {
        String queueKey = DEVICE_KEY_PREFIX + deviceId + COMMAND_QUEUE_SUFFIX;
        Object obj = redisTemplate.opsForList().leftPop(queueKey);
        return obj instanceof DeviceCommand ? (DeviceCommand) obj : null;
    }

    public int clearDeviceCommandQueue(int deviceId) {
        String queueKey = DEVICE_KEY_PREFIX + deviceId + COMMAND_QUEUE_SUFFIX;
        Long size = redisTemplate.opsForList().size(queueKey);
        redisTemplate.delete(queueKey);
        return size != null ? size.intValue() : 0;
    }

    // ==================== 分布式锁相关 ====================

    public String tryLock(int deviceId) {
        String lockKey = DEVICE_KEY_PREFIX + deviceId + LOCK_SUFFIX;
        String lockHolder = UUID.randomUUID().toString();

        Boolean success = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockHolder, LOCK_EXPIRE_SECONDS, TimeUnit.SECONDS);

        return Boolean.TRUE.equals(success) ? lockHolder : null;
    }

    public void releaseLock(int deviceId, String lockHolder) {
        String lockKey = DEVICE_KEY_PREFIX + deviceId + LOCK_SUFFIX;
        String currentHolder = (String) redisTemplate.opsForValue().get(lockKey);

        if (lockHolder.equals(currentHolder)) {
            redisTemplate.delete(lockKey);
        }
    }

    // ==================== 设备状态相关 ====================

    public void saveDeviceStatus(int deviceId, DeviceStatus status) {
        String statusKey = DEVICE_KEY_PREFIX + deviceId + STATUS_SUFFIX;
        redisTemplate.opsForHash().putAll(statusKey, status.toMap());
    }

    public DeviceStatus getDeviceStatus(int deviceId) {
        String statusKey = DEVICE_KEY_PREFIX + deviceId + STATUS_SUFFIX;
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(statusKey);
        return DeviceStatus.fromMap(entries);
    }

    // ==================== 心跳/在线状态相关 ====================

    /**
     * 更新设备心跳时间
     * 每次设备上报状态时调用
     */
    public void updateHeartbeat(int deviceId) {
        String heartbeatKey = DEVICE_KEY_PREFIX + deviceId + HEARTBEAT_SUFFIX;
        redisTemplate.opsForValue().set(
                heartbeatKey,
                System.currentTimeMillis(),
                HEARTBEAT_EXPIRE_SECONDS,
                TimeUnit.SECONDS
        );
    }

    /**
     * 检查设备是否在线
     * @return true:设备在过去2分钟内有上报数据 false:离线
     */
    public boolean isDeviceOnline(int deviceId) {
        String heartbeatKey = DEVICE_KEY_PREFIX + deviceId + HEARTBEAT_SUFFIX;
        return Boolean.TRUE.equals(redisTemplate.hasKey(heartbeatKey));
    }

    /**
     * 批量检查设备在线状态
     */
    public Map<Integer, Boolean> batchCheckOnline(List<Integer> deviceIds) {
        Map<Integer, Boolean> result = new HashMap<>();
        for (Integer deviceId : deviceIds) {
            result.put(deviceId, isDeviceOnline(deviceId));
        }
        return result;
    }

    /**
     * 获取所有在线设备ID
     * 注意：生产环境如果设备数量很多，建议使用Redis Scan代替keys
     */
    public Set<Integer> getOnlineDeviceIds() {
        Set<String> keys = redisTemplate.keys(DEVICE_KEY_PREFIX + "*" + HEARTBEAT_SUFFIX);
        Set<Integer> deviceIds = new HashSet<>();

        if (keys != null) {
            for (String key : keys) {
                try {
                    // 从key中提取deviceId
                    String deviceIdStr = key.substring(
                            DEVICE_KEY_PREFIX.length(),
                            key.length() - HEARTBEAT_SUFFIX.length()
                    );
                    deviceIds.add(Integer.parseInt(deviceIdStr));
                } catch (Exception e) {
                    // 忽略格式错误的key
                }
            }
        }

        return deviceIds;
    }

    // ==================== 命令结果相关 ====================

    public void saveCommandResult(String commandId, Object result) {
        String resultKey = COMMAND_RESULT_PREFIX + commandId;
        redisTemplate.opsForValue().set(resultKey, result, COMMAND_RESULT_EXPIRE_HOURS, TimeUnit.HOURS);
    }

    public Object getCommandResult(String commandId) {
        String resultKey = COMMAND_RESULT_PREFIX + commandId;
        return redisTemplate.opsForValue().get(resultKey);
    }
}
