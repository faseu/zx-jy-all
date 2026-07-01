package com.youlai.boot.udp2;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * 屏蔽器协议报文编解码器（最终完整版）
 * 严格遵循《屏蔽器与外设通信协议V3.0》
 * 已通过实际设备报文验证
 */
public class ShieldPacketCodec {
    private static final int CRC_LENGTH = 2;
    private static final byte DEV_ATTR_ETHERNET = 0x10; // 固定设备属性

    /**
     * 编码报文（核心方法）
     * @param cmd 命令字
     * @param data 数据部分（可以为null）
     * @return 完整的UDP报文字节数组
     */
    public static byte[] encode(byte cmd, byte[] data) {
        int dataLength = (data == null) ? 0 : data.length;

        // 计算总报文长度：同步头(4) + 长度(2) + 设备属性(1) + 命令字(1) + 数据(n) + CRC(2)
        int totalLength = 4 + 2 + 1 + 1 + dataLength + CRC_LENGTH;

        // 协议限制：总长度不超过1200字节
        if (totalLength > 1200) {
            throw new IllegalArgumentException("报文长度超过最大限制: " + totalLength + " > 1200");
        }

        ByteBuffer buffer = ByteBuffer.allocate(totalLength);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        // 1. 写入同步头（固定顺序：A5 5A CD DC）
        buffer.put((byte) 0xA5);
        buffer.put((byte) 0x5A);
        buffer.put((byte) 0xCD);
        buffer.put((byte) 0xDC);

        // 2. 写入报文长度（设备属性+命令字+数据+CRC）
        int segLength = 1 + 1 + dataLength + CRC_LENGTH;
        buffer.putShort((short) segLength);

        // 3. 写入设备属性（固定为0x10）
        buffer.put(DEV_ATTR_ETHERNET);

        // 4. 写入命令字
        buffer.put(cmd);

        // 5. 写入数据部分
        if (data != null && dataLength > 0) {
            buffer.put(data);
        }

        // 6. 计算并写入CRC（最关键：与解码完全一致的计算范围）
        // 计算范围：设备属性(1) + 命令字(1) + 数据(n)
        int crcStartOffset = 6; // 跳过同步头(4)和报文长度(2)
        int crcLength = 2 + dataLength;
        byte[] crcBytes = CRC16Util.calculateToBytes(buffer.array(), crcStartOffset, crcLength);
        buffer.put(crcBytes);

        return buffer.array();
    }

    /**
     * 解码报文头
     */
    public static PacketHeader decodeHeader(byte[] packet) {
        if (packet == null || packet.length < 8) {
            throw new IllegalArgumentException("报文长度不足: " + (packet == null ? 0 : packet.length));
        }

        // 验证同步头
        if (packet[0] != (byte) 0xA5 || packet[1] != (byte) 0x5A ||
                packet[2] != (byte) 0xCD || packet[3] != (byte) 0xDC) {
            throw new IllegalArgumentException("同步头错误");
        }

        // 解析报文长度（小端模式）
        int segLength = (packet[5] & 0xFF) << 8 | (packet[4] & 0xFF);

        byte devAttr = packet[6];
        byte cmd = packet[7];

        return new PacketHeader(segLength, devAttr, cmd);
    }

    /**
     * 解码数据部分
     */
    public static byte[] decodeData(byte[] packet) {
        PacketHeader header = decodeHeader(packet);

        // 验证CRC（与编码完全一致的计算逻辑）
        if (!CRC16Util.verifyPacket(packet)) {
            System.err.println("CRC校验失败！原始报文: " + bytesToHex(packet));
            throw new IllegalArgumentException("CRC校验失败");
        }

        // 提取数据部分：从第8字节开始
        // segLength = 设备属性(1) + 命令字(1) + 数据(n) + CRC(2)
        int dataLength = header.getSegLength() - 2 - CRC_LENGTH;
        byte[] data = new byte[dataLength];
        System.arraycopy(packet, 8, data, 0, dataLength);

        return data;
    }

    /**
     * 字节数组转十六进制字符串（调试用）
     */
    public static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }

    /**
     * 十六进制字符串转字节数组（调试用）
     */
    public static byte[] hexToBytes(String hex) {
        hex = hex.replace(" ", "").replace(":", "");
        byte[] b = new byte[hex.length() / 2];
        for (int i = 0; i < b.length; i++) {
            b[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        return b;
    }

    /**
     * 报文头信息
     */
    public static class PacketHeader {
        private final int segLength;
        private final byte devAttr;
        private final byte cmd;

        public PacketHeader(int segLength, byte devAttr, byte cmd) {
            this.segLength = segLength;
            this.devAttr = devAttr;
            this.cmd = cmd;
        }

        public int getSegLength() { return segLength; }
        public byte getDevAttr() { return devAttr; }
        public byte getCmd() { return cmd; }
    }
}
