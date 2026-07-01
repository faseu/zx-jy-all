package com.youlai.boot.udp2;

import java.net.InetAddress;
import java.util.concurrent.CompletableFuture;

/**
 * 在线设备信息
 */
public class OnlineDevice {
    private final int deviceId;
    private InetAddress address;
    private int port;
    private long lastReportTime; // 最后一次上报时间戳(毫秒)
    private DeviceStatus lastStatus;

    public OnlineDevice(int deviceId, InetAddress address, int port) {
        this.deviceId = deviceId;
        this.address = address;
        this.port = port;
        this.lastReportTime = System.currentTimeMillis();
    }

    // Getters and Setters
    public int getDeviceId() { return deviceId; }
    public InetAddress getAddress() { return address; }
    public void setAddress(InetAddress address) { this.address = address; }
    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }
    public long getLastReportTime() { return lastReportTime; }
    public void updateLastReportTime() { this.lastReportTime = System.currentTimeMillis(); }
    public DeviceStatus getLastStatus() { return lastStatus; }
    public void setLastStatus(DeviceStatus lastStatus) { this.lastStatus = lastStatus; }
}

/**
 * 待执行的命令
 */
class PendingCommand {
    private final byte cmd;
    private final byte[] data;
    private final byte expectedAckCmd;
    private final CompletableFuture<byte[]> future;
    private final long createTime;
    private int retryCount;

    public PendingCommand(byte cmd, byte[] data, byte expectedAckCmd) {
        this.cmd = cmd;
        this.data = data;
        this.expectedAckCmd = expectedAckCmd;
        this.future = new CompletableFuture<>();
        this.createTime = System.currentTimeMillis();
        this.retryCount = 0;
    }

    // Getters and Setters
    public byte getCmd() { return cmd; }
    public byte[] getData() { return data; }
    public byte getExpectedAckCmd() { return expectedAckCmd; }
    public CompletableFuture<byte[]> getFuture() { return future; }
    public long getCreateTime() { return createTime; }
    public int getRetryCount() { return retryCount; }
    public void incrementRetryCount() { this.retryCount++; }
}
