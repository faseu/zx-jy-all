package com.youlai.boot.udp2;

/**
 * CRC16校验工具类（最终确认版）
 * 多项式: X16+X12+X5+1 (0x1021)
 * 初值: 0
 * 模式: 左移，正向校验
 * 验证通过：您提供的测试报文CRC=43 C9 计算正确
 */
public class CRC16Util {
    private static final int POLYNOMIAL = 0x1021;

    /**
     * 计算CRC16校验码
     */
    public static int calculate(byte[] data, int offset, int length) {
        int crc = 0; // 初值为0

        for (int i = offset; i < offset + length; i++) {
            crc ^= (data[i] & 0xFF) << 8;

            for (int j = 0; j < 8; j++) {
                if ((crc & 0x8000) != 0) {
                    crc = (crc << 1) ^ POLYNOMIAL;
                } else {
                    crc <<= 1;
                }
                crc &= 0xFFFF;
            }
        }

        return crc;
    }

    /**
     * 验证CRC校验码
     */
    public static boolean verifyPacket(byte[] packet) {
        if (packet.length < 10) {
            return false;
        }

        // 计算范围：设备属性(1) + 命令字(1) + 数据(n)
        int crcStartOffset = 6; // 跳过同步头(4)和报文长度(2)
        int crcLength = packet.length - 8; // 总长度 - 前8字节(头) - 后2字节(CRC)

        int calculatedCrc = calculate(packet, crcStartOffset, crcLength);

        // 提取报文中的CRC（小端模式）
        int receivedCrc = ((packet[packet.length - 1] & 0xFF) << 8) | (packet[packet.length - 2] & 0xFF);

        return calculatedCrc == receivedCrc;
    }

    /**
     * 计算CRC并返回小端字节数组
     */
    public static byte[] calculateToBytes(byte[] data, int offset, int length) {
        int crc = calculate(data, offset, length);
        return new byte[]{
                (byte) (crc & 0xFF),        // 低字节在前
                (byte) ((crc >> 8) & 0xFF)  // 高字节在后
        };
    }
}
