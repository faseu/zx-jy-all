package com.youlai.boot.udp2;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.HashMap;
import java.util.Map;

/**
 * 运行状态信息
 */
public class DeviceStatus {
    private int deviceId;
    private long voltage; // 毫伏
    private long current; // 毫安
    private int temperature; // 摄氏度
    private int channelStates; // 各通道开关状态
    private byte alarmStatus;
    private boolean vcoOn;
    private boolean fanOn;
    private long reportTime; // 上报时间戳(毫秒)

    /**
     * 从字节数组解析设备状态
     */
    public static DeviceStatus fromBytes(byte[] data) {
        if (data.length != 24) {
            throw new IllegalArgumentException("运行状态数据长度错误: " + data.length);
        }

        ByteBuffer buffer = ByteBuffer.wrap(data);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        DeviceStatus status = new DeviceStatus();
        status.deviceId = buffer.getInt();
        status.voltage = buffer.getInt() & 0xFFFFFFFFL;
        status.current = buffer.getInt() & 0xFFFFFFFFL;
        status.temperature = buffer.getInt();
        status.channelStates = buffer.getInt();
        status.alarmStatus = buffer.get();
        status.vcoOn = buffer.get() == 1;
        status.fanOn = buffer.get() == 1;
        buffer.get(); // 保留字节
        status.reportTime = System.currentTimeMillis();

        return status;
    }

    /**
     * 转换为Map存入Redis
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("deviceId", deviceId);
        map.put("voltage", voltage);
        map.put("current", current);
        map.put("temperature", temperature);
        map.put("channelStates", channelStates);
        map.put("alarmStatus", alarmStatus & 0xFF); // 转换为无符号字节
        map.put("vcoOn", vcoOn);
        map.put("fanOn", fanOn);
        map.put("reportTime", reportTime);

        // 解析各通道状态为单独字段，方便前端使用
        for (int i = 0; i <= 17; i++) {
            map.put("channel" + (i + 1) + "State", getChannelState(i));
        }

        // 解析告警状态为单独字段
        map.put("lowTemperatureAlarm", isLowTemperatureAlarm());
        map.put("overTemperatureAlarm", isOverTemperatureAlarm());
        map.put("overVoltageAlarm", isOverVoltageAlarm());
        map.put("underVoltageAlarm", isUnderVoltageAlarm());
        map.put("overCurrentAlarm", isOverCurrentAlarm());
        map.put("underCurrentAlarm", isUnderCurrentAlarm());

        return map;
    }

    /**
     * 从Redis的Map恢复设备状态
     */
    public static DeviceStatus fromMap(Map<Object, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }

        DeviceStatus status = new DeviceStatus();
        status.deviceId = getIntValue(map, "deviceId");
        status.voltage = getLongValue(map, "voltage");
        status.current = getLongValue(map, "current");
        status.temperature = getIntValue(map, "temperature");
        status.channelStates = getIntValue(map, "channelStates");
        status.alarmStatus = (byte) getIntValue(map, "alarmStatus");
        status.vcoOn = getBooleanValue(map, "vcoOn");
        status.fanOn = getBooleanValue(map, "fanOn");
        status.reportTime = getLongValue(map, "reportTime");

        return status;
    }

    // ==================== 辅助方法 ====================

    /**
     * 获取指定通道的开关状态
     * @param channel 通道号(0~17)
     * @return true:开启 false:关闭
     */
    public boolean getChannelState(int channel) {
        if (channel < 0 || channel > 17) {
            throw new IllegalArgumentException("通道号超出范围: " + channel);
        }
        return (channelStates & (1 << channel)) != 0;
    }

    /**
     * 检查是否有低温告警
     */
    public boolean isLowTemperatureAlarm() {
        return (alarmStatus & 0x01) != 0;
    }

    /**
     * 检查是否有过温告警
     */
    public boolean isOverTemperatureAlarm() {
        return (alarmStatus & 0x02) != 0;
    }

    /**
     * 检查是否有过压告警
     */
    public boolean isOverVoltageAlarm() {
        return (alarmStatus & 0x04) != 0;
    }

    /**
     * 检查是否有欠压告警
     */
    public boolean isUnderVoltageAlarm() {
        return (alarmStatus & 0x08) != 0;
    }

    /**
     * 检查是否有过流告警
     */
    public boolean isOverCurrentAlarm() {
        return (alarmStatus & 0x10) != 0;
    }

    /**
     * 检查是否有欠流告警
     */
    public boolean isUnderCurrentAlarm() {
        return (alarmStatus & 0x20) != 0;
    }

    /**
     * 检查是否有任何告警
     */
    public boolean hasAnyAlarm() {
        return alarmStatus != 0;
    }

    // ==================== Redis Map值获取辅助方法 ====================

    private static int getIntValue(Map<Object, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return 0;
        }
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof String) {
            return Integer.parseInt((String) value);
        }
        return 0;
    }

    private static long getLongValue(Map<Object, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return 0;
        }
        if (value instanceof Long) {
            return (Long) value;
        }
        if (value instanceof Integer) {
            return ((Integer) value).longValue();
        }
        if (value instanceof String) {
            return Long.parseLong((String) value);
        }
        return 0;
    }

    private static boolean getBooleanValue(Map<Object, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        if (value instanceof String) {
            return Boolean.parseBoolean((String) value);
        }
        return false;
    }

    // ==================== Getters and Setters ====================

    public int getDeviceId() { return deviceId; }
    public void setDeviceId(int deviceId) { this.deviceId = deviceId; }
    public long getVoltage() { return voltage; }
    public void setVoltage(long voltage) { this.voltage = voltage; }
    public long getCurrent() { return current; }
    public void setCurrent(long current) { this.current = current; }
    public int getTemperature() { return temperature; }
    public void setTemperature(int temperature) { this.temperature = temperature; }
    public int getChannelStates() { return channelStates; }
    public void setChannelStates(int channelStates) { this.channelStates = channelStates; }
    public byte getAlarmStatus() { return alarmStatus; }
    public void setAlarmStatus(byte alarmStatus) { this.alarmStatus = alarmStatus; }
    public boolean isVcoOn() { return vcoOn; }
    public void setVcoOn(boolean vcoOn) { this.vcoOn = vcoOn; }
    public boolean isFanOn() { return fanOn; }
    public void setFanOn(boolean fanOn) { this.fanOn = fanOn; }
    public long getReportTime() { return reportTime; }
    public void setReportTime(long reportTime) { this.reportTime = reportTime; }
}
