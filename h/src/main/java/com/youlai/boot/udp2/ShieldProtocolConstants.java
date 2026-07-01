package com.youlai.boot.udp2;

/**
 * 屏蔽器通信协议常量定义
 */
public class ShieldProtocolConstants {
    // 同步头 (0xA5 0x5A 0xCD 0xDC) 小端模式
    public static final int SYNC_HEAD = 0xDCCD5AA5;

    // 设备属性
    public static final byte DEV_ATTR_ETHERNET = 0x10;

    // 命令字定义
    public static final byte CMD_REPORT_STATUS = 0x2A;        // 下位机上报运行状态
    public static final byte CMD_REPORT_STATUS_ACK = (byte)0xAA; // 上报状态应答
    public static final byte CMD_REBOOT = 0x14;               // 重启设备
    public static final byte CMD_REBOOT_ACK = (byte)0x94;     // 重启应答
    public static final byte CMD_RF_SWITCH_SET = 0x20;        // 射频开关设置
    public static final byte CMD_RF_SWITCH_SET_ACK = (byte)0xA0; // 射频开关设置应答
    public static final byte CMD_RF_SWITCH_GET = 0x21;        // 射频开关获取
    public static final byte CMD_RF_SWITCH_GET_ACK = (byte)0xA1; // 射频开关获取应答
    public static final byte CMD_ATT_SET = 0x22;              // 通道衰减值设置
    public static final byte CMD_ATT_SET_ACK = (byte)0xA2;    // 通道衰减值设置应答
    public static final byte CMD_ATT_GET = 0x23;              // 通道衰减值获取
    public static final byte CMD_ATT_GET_ACK = (byte)0xA3;    // 通道衰减值获取应答
    public static final byte CMD_NETWORK_SET = 0x24;          // 网络参数设置
    public static final byte CMD_NETWORK_SET_ACK = (byte)0xA4; // 网络参数设置应答
    public static final byte CMD_NETWORK_GET = 0x25;          // 网络参数获取
    public static final byte CMD_NETWORK_GET_ACK = (byte)0xA5; // 网络参数获取应答
    public static final byte CMD_ALARM_THRESHOLD_SET = 0x26;  // 告警阀值设置
    public static final byte CMD_ALARM_THRESHOLD_SET_ACK = (byte)0xA6; // 告警阀值设置应答
    public static final byte CMD_ALARM_THRESHOLD_GET = 0x27;  // 告警阀值获取
    public static final byte CMD_ALARM_THRESHOLD_GET_ACK = (byte)0xA7; // 告警阀值获取应答
    public static final byte CMD_GET_DEVICE_INFO = 0x28;      // 获取设备信息
    public static final byte CMD_GET_DEVICE_INFO_ACK = (byte)0xA8; // 获取设备信息应答

    // 状态码
    public static final byte STATUS_OK = 0x00;
    public static final byte STATUS_ERROR = 0x01;
    public static final byte STATUS_CRC_ERROR = (byte)0xFF;

    // 默认端口
    public static final int DEFAULT_DEVICE_PORT = 9877;
    public static final int DEFAULT_SERVER_PORT = 9876;

    // 最大报文长度
    public static final int MAX_PACKET_LENGTH = 1200;

    // 通道范围
    public static final int MIN_CHANNEL = 0;
    public static final int MAX_CHANNEL = 17;

    // 衰减值范围
    public static final int MIN_ATT = 0;
    public static final int MAX_ATT = 63; // 对应0~31.5dB
}
