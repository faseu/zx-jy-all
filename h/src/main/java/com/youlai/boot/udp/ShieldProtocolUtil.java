package com.youlai.boot.udp;

import com.alibaba.fastjson.JSON;
import com.youlai.boot.system.model.entity.TDevice;
import com.youlai.boot.system.model.form.TAlarmForm;
import com.youlai.boot.system.service.TAlarmService;
import com.youlai.boot.system.service.TDeviceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

/**
 * 屏蔽器与外设通信协议V3.0 核心工具类
 * 包含：所有报文解析、所有指令构造、CRC16校验、小端模式转换
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ShieldProtocolUtil {
    // 协议固定常量
    public static final byte[] SYNC_HEADER = {(byte) 0xA5, 0x5A, (byte) 0xCD, (byte) 0xDC};
    public static final byte DEV_ATTR = 0x10;
    public static final int CRC16_POLY = 0x1021;
    public static final int CRC16_INIT = 0x0000;
    public static final int MAX_PACKET_SIZE = 1200;

    // ====================== 所有命令字（文档V3.0完整定义）======================
    // 下位机上报
    public static final byte CMD_REPORT_STATUS = (byte) 0x2A;
    // 上位机下发-基础指令
    public static final byte CMD_REBOOT = (byte) 0x14;
    public static final byte CMD_SET_RF_SWITCH = (byte) 0x20;
    public static final byte CMD_GET_RF_SWITCH = (byte) 0x21;
    public static final byte CMD_SET_ATT = (byte) 0x22;
    public static final byte CMD_GET_ATT = (byte) 0x23;
    public static final byte CMD_SET_NET_PARAM = (byte) 0x24;
    public static final byte CMD_GET_NET_PARAM = (byte) 0x25;
    public static final byte CMD_SET_ALARM_THRESHOLD = (byte) 0x26;
    public static final byte CMD_GET_ALARM_THRESHOLD = (byte) 0x27;
    public static final byte CMD_GET_DEVICE_INFO = (byte) 0x28;
    // 应答命令字（原命令字最高位置1）
    public static final byte CMD_ACK_STATUS = (byte) 0xAA;
    public static final byte CMD_ACK_REBOOT = (byte) 0x94;
    public static final byte CMD_ACK_SET_RF_SWITCH = (byte) 0xA0;
    public static final byte CMD_ACK_GET_RF_SWITCH = (byte) 0xA1;
    public static final byte CMD_ACK_SET_ATT = (byte) 0xA2;
    public static final byte CMD_ACK_GET_ATT = (byte) 0xA3;
    public static final byte CMD_ACK_SET_NET_PARAM = (byte) 0xA4;
    public static final byte CMD_ACK_GET_NET_PARAM = (byte) 0xA5;
    public static final byte CMD_ACK_SET_ALARM_THRESHOLD = (byte) 0xA6;
    public static final byte CMD_ACK_GET_ALARM_THRESHOLD = (byte) 0xA7;
    public static final byte CMD_ACK_GET_DEVICE_INFO = (byte) 0xA8;

    private final RedisTemplate<String, Object> redisTemplate;
    @Lazy
    private final TAlarmService tAlarmService;
    @Lazy
    private final TDeviceService tDeviceService;

    // ====================== 通用工具方法 ======================
    public static boolean checkSyncHeader(byte[] data) {
        return data != null && data.length >= 4 && Arrays.equals(Arrays.copyOf(data, 4), SYNC_HEADER);
    }

    public static int readUInt2LE(byte[] data, int offset) {
        if (data.length < offset + 2) return 0;
        return ((data[offset + 1] & 0xFF) << 8) | (data[offset] & 0xFF);
    }

    public static long readUInt4LE(byte[] data, int offset) {
        if (data.length < offset + 4) return 0;
        return ((data[offset + 3] & 0xFFL) << 24)
                | ((data[offset + 2] & 0xFFL) << 16)
                | ((data[offset + 1] & 0xFFL) << 8)
                | (data[offset] & 0xFFL);
    }

    public static int readInt4LE(byte[] data, int offset) {
        if (data.length < offset + 4) return 0;
        return ByteBuffer.wrap(data, offset, 4).order(ByteOrder.LITTLE_ENDIAN).getInt();
    }

    public static void writeUInt2LE(byte[] data, int offset, int value) {
        if (data.length < offset + 2) return;
        data[offset] = (byte) (value & 0xFF);
        data[offset + 1] = (byte) ((value >> 8) & 0xFF);
    }

    public static void writeUInt4LE(byte[] data, int offset, long value) {
        if (data.length < offset + 4) return;
        data[offset] = (byte) (value & 0xFF);
        data[offset + 1] = (byte) ((value >> 8) & 0xFF);
        data[offset + 2] = (byte) ((value >> 16) & 0xFF);
        data[offset + 3] = (byte) ((value >> 24) & 0xFF);
    }

    public static int calcCrc16(byte[] data, int start, int len) {
        if (data == null || start < 0 || len < 0 || (start + len) > data.length) {
            throw new IllegalArgumentException("Invalid CRC calculation parameters");
        }
        int crc = CRC16_INIT;
        for (int i = start; i < start + len; i++) {
            crc ^= (data[i] & 0xFF) << 8;
            for (int j = 0; j < 8; j++) {
                if ((crc & 0x8000) != 0) {
                    crc = (crc << 1) ^ CRC16_POLY;
                } else {
                    crc <<= 1;
                }
            }
            crc &= 0xFFFF;
        }
        return crc;
    }

    public static boolean checkCrc16(byte[] data) {
        if (data == null || data.length < 8) return false;
        int segLen = readUInt2LE(data, 4);
        if (data.length < 4 + 2 + segLen) return false;
        int calcCrc = calcCrc16(data, 6, segLen - 2);
        int recvCrc = readUInt2LE(data, 6 + segLen - 2);
        return calcCrc == recvCrc;
    }

    // ====================== 报文解析入口 ======================
    public void parseReport(String senderIp, int senderPort, byte[] data) {
        if (!checkSyncHeader(data)) {
            log.warn("【解析失败】同步头错误，IP:{}", senderIp);
            return;
        }
        if (!checkCrc16(data)) {
            log.warn("【解析失败】CRC16校验错误，IP:{}", senderIp);
            return;
        }

        byte cmd = data[7];
        log.debug("【收到报文】命令字:0x{}，IP:{}，HEX:{}",
                String.format("%02X", cmd), senderIp, bytesToHex(data, " "));

        switch (cmd) {
            case CMD_REPORT_STATUS:
                parseStatusReport(senderIp, senderPort, data);
                break;
            case CMD_ACK_REBOOT:
                parseAckReboot(data);
                break;
            case CMD_ACK_SET_RF_SWITCH:
                parseAckSetRfSwitch(data);
                break;
            case CMD_ACK_GET_RF_SWITCH:
                parseAckGetRfSwitch(data);
                break;
            case CMD_ACK_SET_ATT:
                parseAckSetAtt(data);
                break;
            case CMD_ACK_GET_ATT:
                parseAckGetAtt(data);
                break;
            case CMD_ACK_GET_NET_PARAM:
                parseAckGetNetParam(data);
                break;
            case CMD_ACK_GET_ALARM_THRESHOLD:
                parseAckGetAlarmThreshold(data);
                break;
            case CMD_ACK_GET_DEVICE_INFO:
                parseAckGetDeviceInfo(data);
                break;
            default:
                log.info("【解析提示】暂未实现该命令字解析：0x{}", String.format("%02X", cmd));
        }
    }

    // ====================== 具体报文解析实现 ======================
    public void parseStatusReport(String senderIp, int senderPort, byte[] data) {
        if (data.length < 34) { // 0x2A报文总长度34字节
            log.error("状态上报报文长度不足，无法解析，长度:{}", data.length);
            return;
        }

        long deviceId = readUInt4LE(data, 8);
        long voltage = readUInt4LE(data, 12);
        long current = readUInt4LE(data, 16);
        int temp = readInt4LE(data, 20);
        long channelState = readUInt4LE(data, 24);
        int alarmState = data[28] & 0xFF;
        int vcoState = data[29] & 0xFF;
        int fanState = data[30] & 0xFF;

        log.info("【运行状态上报 0x2A】设备ID:{}, 电压:{}mV, 电流:{}mA, 温度:{}℃, VCO:{}, 风扇:{}",
                deviceId, voltage, current, temp, vcoState != 0 ? "开" : "关", fanState != 0 ? "开" : "关");

        // 通道状态解析（协议标准：Bit0=CH1, Bit17=CH18）
        boolean[] channels = new boolean[18];
        for (int i = 0; i < 18; i++) {
            channels[i] = (channelState & (1L << i)) != 0;
        }
        log.info("通道状态:{}", Arrays.toString(channels));

        // 告警解析与入库
        Optional<TDevice> deviceOpt = tDeviceService.getTDeviceByEntireNoOptional(String.valueOf(deviceId));
        if (!deviceOpt.isPresent()) {
            log.warn("设备不存在：{}", deviceId);
            sendAck0xAA(senderIp, senderPort, (byte) 0x01); // 异常应答
            return;
        }
        TDevice device = deviceOpt.get();
        LocalDateTime alarmTime = LocalDateTime.now();

        AlarmConfig[] alarmConfigs = {
                new AlarmConfig(0x01, "0", "低温告警", "检查环境温度"),
                new AlarmConfig(0x02, "1", "高温告警", "检查散热"),
                new AlarmConfig(0x04, "2", "过压告警", "检查电源"),
                new AlarmConfig(0x08, "3", "欠压告警", "检查供电"),
                new AlarmConfig(0x10, "4", "过流告警", "检查负载"),
                new AlarmConfig(0x20, "5", "欠流告警", "检查接线")
        };

        for (AlarmConfig config : alarmConfigs) {
            if ((alarmState & config.bitMask) != 0) {
                createAndSaveAlarm(device, config, alarmTime);
            }
        }

        // 回复0xAA正常应答
        sendAck0xAA(senderIp, senderPort, (byte) 0x00);

        // 下发Redis中的待执行指令
        String redisKey = String.valueOf(deviceId);
        Object valueObj = redisTemplate.opsForValue().get(redisKey);
        if (valueObj instanceof String cmdStr) {
            try {
                byte[] cmd = Base64.getDecoder().decode(cmdStr);
                sendUdpData(senderIp, 9877, cmd);
                log.info("【指令下发成功】设备ID:{}, 指令HEX:{}", deviceId, bytesToHex(cmd, " "));
                redisTemplate.delete(redisKey); // 下发后立即删除，避免重复
            } catch (Exception e) {
                log.error("指令解码或发送失败，设备ID:{}", deviceId, e);
            }
        }
    }

    private void sendAck0xAA(String ip, int port, byte status) {
        byte[] ack = build0xAA(status);
        sendUdpData(ip, port, ack);
        log.debug("已回复0xAA给设备:{}:{}，状态:{}", ip, port, status);
    }

    private void sendUdpData(String ip, int port, byte[] data) {
        try (DatagramSocket socket = new DatagramSocket()) { // 自动分配临时端口
            InetAddress address = InetAddress.getByName(ip);
            DatagramPacket packet = new DatagramPacket(data, data.length, address, port);
            socket.send(packet);
        } catch (Exception e) {
            log.error("UDP发送失败，目标:{}:{}", ip, port, e);
        }
    }

    public static void parseAckReboot(byte[] data) {
        if (data.length < 11) {
            log.error("重启应答报文长度不足");
            return;
        }
        int status = data[8] & 0xFF;
        log.info("【重启设备应答0x94】执行状态:{}", getStatusDesc(status));
    }

    public static void parseAckSetRfSwitch(byte[] data) {
        if (data.length < 11) {
            log.error("射频开关设置应答报文长度不足");
            return;
        }
        int status = data[8] & 0xFF;
        log.info("【射频开关设置应答0xA0】执行状态:{}", getStatusDesc(status));
    }

    public static void parseAckGetRfSwitch(byte[] data) {
        if (data.length < 13) {
            log.error("射频开关获取应答报文长度不足");
            return;
        }
        int status = data[8] & 0xFF;
        int channel = data[9] & 0xFF;
        int chState = data[10] & 0xFF;
        log.info("【射频开关获取应答0xA1】状态:{}, 通道:CH{}, 状态:{}",
                getStatusDesc(status), channel + 1, chState == 1 ? "开启" : "关闭");
    }

    public static void parseAckSetAtt(byte[] data) {
        if (data.length < 11) {
            log.error("衰减值设置应答报文长度不足");
            return;
        }
        int status = data[8] & 0xFF;
        log.info("【衰减值设置应答0xA2】执行状态:{}", getStatusDesc(status));
    }

    public static void parseAckGetAtt(byte[] data) {
        if (data.length < 13) {
            log.error("衰减值获取应答报文长度不足");
            return;
        }
        int status = data[8] & 0xFF;
        int channel = data[9] & 0xFF;
        int attValue = data[10] & 0xFF;
        double attDb = attValue * 0.5;
        log.info("【衰减值获取应答0xA3】状态:{}, 通道:CH{}, 衰减值:{}dB",
                getStatusDesc(status), channel + 1, attDb);
    }

    public static void parseAckGetNetParam(byte[] data) {
        if (data.length < 49) {
            log.error("网络参数获取应答报文长度不足");
            return;
        }
        int status = data[8] & 0xFF;
        if (status != 0) {
            log.info("【网络参数获取应答0xA5】执行状态:{}", getStatusDesc(status));
            return;
        }
        byte[] devMac = Arrays.copyOfRange(data, 14, 20);
        byte[] devIp = Arrays.copyOfRange(data, 20, 24);
        byte[] gateway = Arrays.copyOfRange(data, 24, 28);
        byte[] subnetMask = Arrays.copyOfRange(data, 28, 32);
        byte[] serverIp = Arrays.copyOfRange(data, 32, 36);
        byte[] backupServerIp = Arrays.copyOfRange(data, 36, 40);
        int devPort = readUInt2LE(data, 40);
        int serverPort = readUInt2LE(data, 42);

        log.info("【网络参数获取应答0xA5】\n设备MAC:{}\n设备IP:{}\n网关:{}\n子网掩码:{}\n服务器IP:{}\n备份服务器IP:{}\n设备端口:{}\n服务器端口:{}",
                bytesToHex(devMac, ":"), bytesToIp(devIp), bytesToIp(gateway), bytesToIp(subnetMask),
                bytesToIp(serverIp), bytesToIp(backupServerIp), devPort, serverPort);
    }

    public static void parseAckGetAlarmThreshold(byte[] data) {
        if (data.length < 49) {
            log.error("告警阀值获取应答报文长度不足");
            return;
        }
        int status = data[8] & 0xFF;
        if (status != 0) {
            log.info("【告警阀值获取应答0xA7】执行状态:{}", getStatusDesc(status));
            return;
        }
        long lowVolt = readUInt4LE(data, 9);
        long highVolt = readUInt4LE(data, 13);
        long lowCurr = readUInt4LE(data, 17);
        long highCurr = readUInt4LE(data, 21);
        long lowTemp = readInt4LE(data, 25);
        long highTemp = readInt4LE(data, 29);
        long fanOpenTemp = readInt4LE(data, 33);
        long reportCycle = readUInt4LE(data, 41);

        log.info("【告警阀值获取应答0xA7】\n欠压:{}mV | 过压:{}mV\n欠流:{}mA | 过流:{}mA\n低温:{}℃ | 过温:{}℃\n风扇开启温度:{}℃ | 上报周期:{}s",
                lowVolt, highVolt, lowCurr, highCurr, lowTemp, highTemp, fanOpenTemp, reportCycle);
    }

    public static void parseAckGetDeviceInfo(byte[] data) {
        if (data.length < 57) {
            log.error("设备信息获取应答报文长度不足");
            return;
        }
        int status = data[8] & 0xFF;
        if (status != 0) {
            log.info("【设备信息获取应答0xA8】执行状态:{}", getStatusDesc(status));
            return;
        }
        long devNo = readUInt4LE(data, 9);
        String devType = new String(Arrays.copyOfRange(data, 13, 33)).trim();
        String softVer = new String(Arrays.copyOfRange(data, 33, 43)).trim();
        String hardVer = new String(Arrays.copyOfRange(data, 43, 53)).trim();

        log.info("【设备信息获取应答0xA8】\n设备编号:0x{}\n设备类型:{}\n软件版本:{}\n硬件版本:{}",
                String.format("%08X", devNo), devType, softVer, hardVer);
    }

    // ====================== 指令构造（完全符合协议V3.0）======================
    public static byte[] build0xAA(byte status) {
        int segLen = 5; // 协议规定长度字节为5
        byte[] pkt = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, pkt, 0, 4);
        writeUInt2LE(pkt, 4, segLen);
        pkt[6] = DEV_ATTR;
        pkt[7] = CMD_ACK_STATUS;
        pkt[8] = status;
        int crc = calcCrc16(pkt, 6, segLen - 2);
        writeUInt2LE(pkt, 6 + segLen - 2, crc);
        return pkt;
    }

    public static byte[] buildCmdReboot() {
        int segLen = 4;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_REBOOT;
        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdSetRfSwitch(int channel, int state) {
        if (channel < 0 || channel > 17 || (state != 0 && state != 1)) return null;
        int segLen = 6;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_SET_RF_SWITCH;
        cmd[8] = (byte) channel;
        cmd[9] = (byte) state;
        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdGetRfSwitch(int channel) {
        if (channel < 0 || channel > 17) return null;
        int segLen = 6;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_GET_RF_SWITCH;
        cmd[8] = (byte) channel;
        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdSetAtt(int channel, int attValue) {
        if (channel < 0 || channel > 17 || attValue < 0 || attValue > 63) return null;
        int segLen = 6;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_SET_ATT;
        cmd[8] = (byte) channel;
        cmd[9] = (byte) attValue;
        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdGetAtt(int channel) {
        if (channel < 0 || channel > 17) return null;
        int segLen = 6;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_GET_ATT;
        cmd[8] = (byte) channel;
        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdSetNetParam(
            byte[] destMac, byte[] devMac, byte[] devIp, byte[] gateway, byte[] subnetMask,
            byte[] serverIp, byte[] backupServerIp, int devPort, int serverPort) {
        if (destMac.length != 6 || devMac.length != 6 || devIp.length != 4 || gateway.length != 4
                || subnetMask.length != 4 || serverIp.length != 4 || backupServerIp.length != 4) {
            return null;
        }
        int segLen = 40;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_SET_NET_PARAM;

        // 无预留字段，直接从偏移8开始写入
        System.arraycopy(destMac, 0, cmd, 8, 6);    // 目的MAC (8-13)
        System.arraycopy(devMac, 0, cmd, 14, 6);   // 设备MAC (14-19)
        System.arraycopy(devIp, 0, cmd, 20, 4);    // 设备IP (20-23)
        System.arraycopy(gateway, 0, cmd, 24, 4);  // 网关 (24-27)
        System.arraycopy(subnetMask, 0, cmd, 28, 4); // 子网掩码 (28-31)
        System.arraycopy(serverIp, 0, cmd, 32, 4); // 服务器IP (32-35)
        System.arraycopy(backupServerIp, 0, cmd, 36, 4); // 备份服务器IP (36-39)
        writeUInt2LE(cmd, 40, devPort); // 设备端口 (40-41)
        writeUInt2LE(cmd, 42, serverPort); // 服务器端口 (42-43)

        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdGetNetParam() {
        int segLen = 4;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_GET_NET_PARAM;
        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdSetAlarmThreshold(
            long lowVolt, long highVolt, long lowCurr, long highCurr,
            long lowTemp, long highTemp, long fanOpenTemp, long reportCycle) {
        int segLen = 40;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_SET_ALARM_THRESHOLD;

        writeUInt4LE(cmd, 8, lowVolt);    // 欠压阀值 (8-11)
        writeUInt4LE(cmd, 12, highVolt);  // 过压阀值 (12-15)
        writeUInt4LE(cmd, 16, lowCurr);   // 欠流阀值 (16-19)
        writeUInt4LE(cmd, 20, highCurr);  // 过流阀值 (20-23)
        writeUInt4LE(cmd, 24, lowTemp);   // 低温阀值 (24-27)
        writeUInt4LE(cmd, 28, highTemp);  // 过温阀值 (28-31)
        writeUInt4LE(cmd, 32, fanOpenTemp); // 风扇开启温度 (32-35)
        writeUInt4LE(cmd, 36, 0);         // 保留4字节 (36-39)
        writeUInt4LE(cmd, 40, reportCycle); // 状态上报周期 (40-43)

        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdGetAlarmThreshold() {
        int segLen = 4;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_GET_ALARM_THRESHOLD;
        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    public static byte[] buildCmdGetDeviceInfo() {
        int segLen = 4;
        byte[] cmd = new byte[4 + 2 + segLen];
        System.arraycopy(SYNC_HEADER, 0, cmd, 0, 4);
        writeUInt2LE(cmd, 4, segLen);
        cmd[6] = DEV_ATTR;
        cmd[7] = CMD_GET_DEVICE_INFO;
        int crc = calcCrc16(cmd, 6, segLen - 2);
        writeUInt2LE(cmd, 6 + segLen - 2, crc);
        return cmd;
    }

    // ====================== 辅助类与方法 ======================
    private static class AlarmConfig {
        final int bitMask;
        final String type;
        final String content;
        final String suggestions;

        AlarmConfig(int bitMask, String type, String content, String suggestions) {
            this.bitMask = bitMask;
            this.type = type;
            this.content = content;
            this.suggestions = suggestions;
        }
    }

    private void createAndSaveAlarm(TDevice device, AlarmConfig config, LocalDateTime alarmTime) {
        try {
            TAlarmForm formData = new TAlarmForm();
            formData.setDeviceId(device.getId());
            formData.setDeviceName(device.getDeviceName());
            formData.setEntireNo(device.getEntireNo());
            formData.setType(config.type);
            formData.setPrisonId(device.getPrisonId());
            formData.setPrisonName(device.getPrisonName());
            formData.setContent(config.content);
            formData.setAlarmTime(alarmTime);
            formData.setSuggestions(config.suggestions);
            formData.setProcessingStatus(0);
            formData.setBlocked(0);

            boolean saveResult = tAlarmService.saveTAlarm(formData);
            if (saveResult) {
                log.info("{}告警保存成功，设备: {}", config.content, device.getDeviceName());
            } else {
                log.error("{}告警保存失败，设备: {}", config.content, device.getDeviceName());
            }
        } catch (Exception e) {
            log.error("保存{}告警时发生异常，设备: {}", config.content, device.getDeviceName(), e);
        }
    }

    private static String getStatusDesc(int status) {
        return switch (status) {
            case 0 -> "正常";
            case 1 -> "异常";
            case 0xFF -> "CRC错误";
            default -> "未知(" + status + ")";
        };
    }

    public static String bytesToIp(byte[] bytes) {
        if (bytes == null || bytes.length != 4) return "0.0.0.0";
        return (bytes[0] & 0xFF) + "." + (bytes[1] & 0xFF) + "." + (bytes[2] & 0xFF) + "." + (bytes[3] & 0xFF);
    }

    public static String bytesToHex(byte[] bytes, String sep) {
        if (bytes == null || bytes.length == 0) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < bytes.length; i++) {
            sb.append(String.format("%02X", bytes[i]));
            if (i < bytes.length - 1) sb.append(sep);
        }
        return sb.toString();
    }

    public static byte[] hexToBytes(String hex) {
        hex = hex.replaceAll("\\s+", "").trim();
        if (hex.length() % 2 != 0) return new byte[0];
        byte[] bytes = new byte[hex.length() / 2];
        for (int i = 0; i < bytes.length; i++) {
            bytes[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        return bytes;
    }

    public static class DeviceStatus {
        public long deviceId;
        public long voltage;
        public long current;
        public int temp;
        public long channelBits;
        public int alarm;
        public int vco;
        public int fan;

        @Override
        public String toString() {
            return JSON.toJSONString(this);
        }
    }

    // 测试方法
    public static void main(String[] args) throws Exception {
        try (DatagramSocket socket = new DatagramSocket()) {
            String sendData = "A5 5A CD DC 1C 00 10 2A A4 B6 9D 57 BC 5D 00 00 97 00 00 00 2B 00 00 00 00 00 78 00 00 00 01 00 1A 29";
            InetAddress ip = InetAddress.getByName("127.0.0.1");
            int port = 9876;
            byte[] bytes = hexToBytes(sendData);
            DatagramPacket packet = new DatagramPacket(bytes, bytes.length, ip, port);
            socket.send(packet);
            System.out.println("测试数据发送成功：" + sendData);
        }
    }
}
