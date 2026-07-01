package com.youlai.boot.udp2;

import java.net.InetAddress;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 设备管理器
 * 维护在线设备列表和待执行命令队列
 */
public class DeviceManager {
    private static final long DEVICE_OFFLINE_TIMEOUT = 5 * 60 * 1000; // 5分钟无上报视为离线
    private static final long COMMAND_TIMEOUT = 10 * 1000; // 命令超时时间10秒
    private static final int MAX_RETRY_COUNT = 3; // 最大重试次数

    private final Map<Integer, OnlineDevice> onlineDevices = new ConcurrentHashMap<>();
    private final Map<Integer, Map<Byte, PendingCommand>> pendingCommands = new ConcurrentHashMap<>();

    /**
     * 更新设备在线状态
     */
    public void updateDeviceStatus(int deviceId, InetAddress address, int port, DeviceStatus status) {
        OnlineDevice device = onlineDevices.get(deviceId);
        if (device == null) {
            device = new OnlineDevice(deviceId, address, port);
            onlineDevices.put(deviceId, device);
            pendingCommands.put(deviceId, new ConcurrentHashMap<>());
            System.out.println("新设备上线: ID=" + deviceId + ", IP=" + address.getHostAddress() + ":" + port);
        } else {
            // 更新设备地址和端口(NAT可能会变化)
            device.setAddress(address);
            device.setPort(port);
            device.updateLastReportTime();
        }
        device.setLastStatus(status);
    }

    /**
     * 获取在线设备
     */
    public OnlineDevice getOnlineDevice(int deviceId) {
        return onlineDevices.get(deviceId);
    }

    /**
     * 检查设备是否在线
     */
    public boolean isDeviceOnline(int deviceId) {
        OnlineDevice device = onlineDevices.get(deviceId);
        return device != null &&
                System.currentTimeMillis() - device.getLastReportTime() < DEVICE_OFFLINE_TIMEOUT;
    }

    /**
     * 添加待执行命令
     */
    public CompletableFuture<byte[]> addPendingCommand(int deviceId, PendingCommand command) {
        if (!isDeviceOnline(deviceId)) {
            command.getFuture().completeExceptionally(new IllegalStateException("设备不在线: " + deviceId));
            return command.getFuture();
        }

        Map<Byte, PendingCommand> deviceCommands = pendingCommands.get(deviceId);
        if (deviceCommands.containsKey(command.getExpectedAckCmd())) {
            command.getFuture().completeExceptionally(new IllegalStateException("相同类型的命令正在执行中"));
            return command.getFuture();
        }

        deviceCommands.put(command.getExpectedAckCmd(), command);
        return command.getFuture();
    }

    /**
     * 获取并移除待执行命令
     */
    public PendingCommand getAndRemovePendingCommand(int deviceId, byte ackCmd) {
        Map<Byte, PendingCommand> deviceCommands = pendingCommands.get(deviceId);
        if (deviceCommands == null) {
            return null;
        }
        return deviceCommands.remove(ackCmd);
    }

    /**
     * 获取设备的下一个待执行命令
     */
    public PendingCommand getNextPendingCommand(int deviceId) {
        Map<Byte, PendingCommand> deviceCommands = pendingCommands.get(deviceId);
        if (deviceCommands == null || deviceCommands.isEmpty()) {
            return null;
        }

        // 清理超时命令
        long now = System.currentTimeMillis();
        deviceCommands.values().removeIf(cmd -> {
            if (now - cmd.getCreateTime() > COMMAND_TIMEOUT) {
                if (cmd.getRetryCount() < MAX_RETRY_COUNT) {
                    cmd.incrementRetryCount();
                    return false; // 重试，不移除
                }
                cmd.getFuture().completeExceptionally(new RuntimeException("命令执行超时"));
                return true;
            }
            return false;
        });

        // 返回第一个命令
        return deviceCommands.values().stream().findFirst().orElse(null);
    }

    /**
     * 清理离线设备和超时命令
     */
    public void cleanup() {
        long now = System.currentTimeMillis();

        // 清理离线设备
        onlineDevices.entrySet().removeIf(entry -> {
            if (now - entry.getValue().getLastReportTime() > DEVICE_OFFLINE_TIMEOUT) {
                int deviceId = entry.getKey();
                pendingCommands.remove(deviceId);
                System.out.println("设备离线: ID=" + deviceId);
                return true;
            }
            return false;
        });

        // 清理超时命令
        for (Map<Byte, PendingCommand> commands : pendingCommands.values()) {
            commands.values().removeIf(cmd -> {
                if (now - cmd.getCreateTime() > COMMAND_TIMEOUT) {
                    if (cmd.getRetryCount() < MAX_RETRY_COUNT) {
                        cmd.incrementRetryCount();
                        return false;
                    }
                    cmd.getFuture().completeExceptionally(new RuntimeException("命令执行超时"));
                    return true;
                }
                return false;
            });
        }
    }
}
