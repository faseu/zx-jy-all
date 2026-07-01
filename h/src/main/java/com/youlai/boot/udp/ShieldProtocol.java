//package com.youlai.boot.udp;
//
//import java.nio.ByteBuffer;
//import java.nio.ByteOrder;
//import java.util.Base64;
//
///**
// * 屏蔽器通信协议 V3.0
// * 全部命令 + 组包 + 解包 + CRC16 + 小端 + Redis 存储
// */
//public class ShieldProtocol {
//    // 固定同步头
//    public static final byte[] SYNC = {(byte) 0xA5, (byte) 0x5A, (byte) 0xCD, (byte) 0xDC};
//    public static final byte DEV_ATTR = 0x10;
//
//    // ==================== 小端工具 ====================
//    public static byte[] int16LE(int v) {
//        return ByteBuffer.allocate(2).order(ByteOrder.LITTLE_ENDIAN).putShort((short) v).array();
//    }
//
//    public static byte[] int32LE(int v) {
//        return ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(v).array();
//    }
//
//    public static int getInt16LE(byte[] b, int off) {
//        return ByteBuffer.wrap(b, off, 2).order(ByteOrder.LITTLE_ENDIAN).getShort() & 0xFFFF;
//    }
//
//    public static int getInt32LE(byte[] b, int off) {
//        return ByteBuffer.wrap(b, off, 4).order(ByteOrder.LITTLE_ENDIAN).getInt();
//    }
//
//    // ==================== CRC16 X16+X12+X5+1 = 0x1021 ====================
//    public static int crc16_1021(byte[] data, int offset, int len) {
//        int crc = 0;
//        for (int i = offset; i < offset + len; i++) {
//            crc ^= (data[i] & 0xFF) << 8;
//            for (int j = 0; j < 8; j++) {
//                if ((crc & 0x8000) != 0) {
//                    crc = (crc << 1) ^ 0x1021;
//                } else {
//                    crc <<= 1;
//                }
//            }
//        }
//        return crc & 0xFFFF;
//    }
//
//    // ==================== 通用组包 ====================
//    public static byte[] build(byte cmd, byte[] body) {
//        int bodyLen = body == null ? 0 : body.length;
//        int dataLen = 1 + 1 + bodyLen; // attr(1) + cmd(1) + body
//        byte[] data = new byte[dataLen];
//        data[0] = DEV_ATTR;
//        data[1] = cmd;
//        if (body != null) {
//            System.arraycopy(body, 0, data, 2, bodyLen);
//        }
//
//        int crc = crc16_1021(data, 0, dataLen);
//        int pktLen = dataLen + 2; // data + crc
//
//        ByteBuffer buf = ByteBuffer.allocate(4 + 2 + pktLen);
//        buf.order(ByteOrder.LITTLE_ENDIAN);
//        buf.put(SYNC);
//        buf.putShort((short) pktLen);
//        buf.put(data);
//        buf.putShort((short) crc);
//        return buf.array();
//    }
//
//    // ==================== Redis 二进制安全存储 ====================
//    public static String toRedisString(byte[] bytes) {
//        return Base64.getEncoder().encodeToString(bytes);
//    }
//
//    public static byte[] fromRedisString(String base64) {
//        return Base64.getDecoder().decode(base64);
//    }
//
//    // -------------------------------------------------------------------------
//    // 以下是【全部命令】，覆盖你协议 V3.0 所有指令
//    // -------------------------------------------------------------------------
//
//    // 1. 重启设备 0x14
//    public static byte[] cmdRestart() {
//        return build((byte) 0x14, null);
//    }
//
//    // 2. 射频开关设置 0x20 channel:0~17 on:1/0
//    public static byte[] cmdChannelSwitch(int channel, int on) {
//        return build((byte) 0x20, new byte[]{(byte) channel, (byte) on});
//    }
//
//    // 3. 射频开关获取 0x21
//    public static byte[] cmdGetChannelStatus(int channel) {
//        return build((byte) 0x21, new byte[]{(byte) channel});
//    }
//
//    // 4. 通道衰减设置 0x22 att:0~63
//    public static byte[] cmdSetAtt(int channel, int att) {
//        return build((byte) 0x22, new byte[]{(byte) channel, (byte) att});
//    }
//
//    // 5. 通道衰减获取 0x23
//    public static byte[] cmdGetAtt(int channel) {
//        return build((byte) 0x23, new byte[]{(byte) channel});
//    }
//
//    // 6. 网络参数设置 0x24
//    public static byte[] cmdSetNetwork(
//            byte[] destMac, byte[] devMac,
//            int devIp, int gateway, int mask, int serverIp, int backupServerIp,
//            int devPort, int serverPort) {
//        ByteBuffer bb = ByteBuffer.allocate(6 + 6 + 4 + 4 + 4 + 4 + 4 + 2 + 2);
//        bb.order(ByteOrder.LITTLE_ENDIAN);
//        bb.put(destMac);
//        bb.put(devMac);
//        bb.putInt(devIp);
//        bb.putInt(gateway);
//        bb.putInt(mask);
//        bb.putInt(serverIp);
//        bb.putInt(backupServerIp);
//        bb.putShort((short) devPort);
//        bb.putShort((short) serverPort);
//        return build((byte) 0x24, bb.array());
//    }
//
//    // 7. 网络参数获取 0x25
//    public static byte[] cmdGetNetwork() {
//        return build((byte) 0x25, null);
//    }
//
//    // 8. 告警阈值设置 0x26
//    public static byte[] cmdSetThreshold(
//            int underVolt, int overVolt,
//            int underCurr, int overCurr,
//            int underTemp, int overTemp,
//            int fanOnTemp, int reportPeriod) {
//        ByteBuffer bb = ByteBuffer.allocate(4 * 9);
//        bb.order(ByteOrder.LITTLE_ENDIAN);
//        bb.putInt(underVolt);
//        bb.putInt(overVolt);
//        bb.putInt(underCurr);
//        bb.putInt(overCurr);
//        bb.putInt(underTemp);
//        bb.putInt(overTemp);
//        bb.putInt(fanOnTemp);
//        bb.putInt(0); // 保留
//        bb.putInt(reportPeriod);
//        return build((byte) 0x26, bb.array());
//    }
//
//    // 9. 告警阈值获取 0x27
//    public static byte[] cmdGetThreshold() {
//        return build((byte) 0x27, null);
//    }
//
//    // 10. 获取设备信息 0x28
//    public static byte[] cmdGetDeviceInfo() {
//        return build((byte) 0x28, null);
//    }
//
//    // 11. 回复设备上报 0xAA（设备发0x2A，服务器回复0xAA）
//    public static byte[] cmdReply0xAA(byte status) {
//        return build((byte) 0xAA, new byte[]{status});
//    }
//
//    // -------------------------------------------------------------------------
//    // 解析：0x2A 运行状态上报（设备主动上传）
//    // -------------------------------------------------------------------------
//    public static DeviceStatus parse0x2A(byte[] pkt) {
//        DeviceStatus st = new DeviceStatus();
//        int pos = 8; // 同步头4 + 长度2 + 属性1 + 命令1
//        st.deviceId = getInt32LE(pkt, pos); pos += 4;
//        st.voltage = getInt32LE(pkt, pos); pos += 4;
//        st.current = getInt32LE(pkt, pos); pos += 4;
//        st.temp = getInt32LE(pkt, pos); pos += 4;
//        st.channelBits = getInt32LE(pkt, pos); pos += 4;
//        st.alarm = pkt[pos++] & 0xFF;
//        st.vco = pkt[pos++] & 0xFF;
//        st.fan = pkt[pos++] & 0xFF;
//        return st;
//    }
//
//    public static class DeviceStatus {
//        public int deviceId;
//        public int voltage;   // mV
//        public int current;   // mA
//        public int temp;      // ℃
//        public int channelBits;
//        public int alarm;
//        public int vco;
//        public int fan;
//    }
//}