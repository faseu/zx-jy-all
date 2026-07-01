package com.youlai.boot.udp2;

import java.io.Serializable;

/**
 * 设备命令对象（可序列化存入Redis）
 */
public class DeviceCommand implements Serializable {
    private static final long serialVersionUID = 1L;

    private String commandId;
    private byte cmd;
    private byte[] data;
    private byte expectedAckCmd;
    private long createTime;
    private int retryCount;
    private int maxRetryCount;
    private long timeoutMs;

    public DeviceCommand() {}

    public DeviceCommand(byte cmd, byte[] data, byte expectedAckCmd) {
        this.cmd = cmd;
        this.data = data;
        this.expectedAckCmd = expectedAckCmd;
        this.maxRetryCount = 3;
        this.timeoutMs = 10000;
    }

    // Getters and Setters
    public String getCommandId() { return commandId; }
    public void setCommandId(String commandId) { this.commandId = commandId; }
    public byte getCmd() { return cmd; }
    public void setCmd(byte cmd) { this.cmd = cmd; }
    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }
    public byte getExpectedAckCmd() { return expectedAckCmd; }
    public void setExpectedAckCmd(byte expectedAckCmd) { this.expectedAckCmd = expectedAckCmd; }
    public long getCreateTime() { return createTime; }
    public void setCreateTime(long createTime) { this.createTime = createTime; }
    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
    public int getMaxRetryCount() { return maxRetryCount; }
    public void setMaxRetryCount(int maxRetryCount) { this.maxRetryCount = maxRetryCount; }
    public long getTimeoutMs() { return timeoutMs; }
    public void setTimeoutMs(long timeoutMs) { this.timeoutMs = timeoutMs; }
}
