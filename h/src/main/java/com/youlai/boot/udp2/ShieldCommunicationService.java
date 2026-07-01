package com.youlai.boot.udp2;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 屏蔽器UDP通信服务
 * 实现CommandLineRunner在应用启动时自动运行
 * 实现DisposableBean在应用关闭时优雅停止
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ShieldCommunicationService implements CommandLineRunner {

    private final RedisCommandQueue redisCommandQueue;

    // UDP服务器端口（与协议一致）
    private static final int SERVER_PORT = ShieldProtocolConstants.DEFAULT_SERVER_PORT;

    // UDP Socket
    private DatagramSocket serverSocket;

    // 服务运行状态标记
    private volatile boolean running;

    // 接收数据线程
    private Thread receiveThread;

    // 正在执行的命令映射（设备ID → 命令对象）
    private final Map<Integer, DeviceCommand> executingCommands = new ConcurrentHashMap<>();

    /**
     * Spring Boot应用启动完成后自动执行此方法
     */
    @Override
    public void run(String... args) throws Exception {
        start();
    }

    /**
     * 启动UDP通信服务
     */
    public void start() throws Exception {
        if (running) {
            log.warn("屏蔽器UDP通信服务已经在运行中");
            return;
        }

        try {
            // 创建UDP Socket，绑定到指定端口
            serverSocket = new DatagramSocket(SERVER_PORT);
            running = true;

            // 启动接收数据线程
            receiveThread = new Thread(this::receiveLoop, "Shield-UDP-Listener");
            receiveThread.setDaemon(true); // 设置为守护线程
            receiveThread.start();

            log.info("✅ 屏蔽器UDP通信服务启动成功，监听端口: {}", SERVER_PORT);
        } catch (Exception e) {
            log.error("❌ 屏蔽器UDP通信服务启动失败", e);
            throw e;
        }
    }

    /**
     * 停止UDP通信服务
     * Spring Boot应用关闭时自动调用（@PreDestroy）
     */
    @PreDestroy
    public void stop() {
        log.info("正在停止屏蔽器UDP通信服务...");
        running = false;

        if (serverSocket != null && !serverSocket.isClosed()) {
            serverSocket.close(); // 关闭Socket会中断receive()阻塞调用
        }

        if (receiveThread != null) {
            try {
                receiveThread.join(3000); // 等待线程最多3秒
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        log.info("✅ 屏蔽器UDP通信服务已停止");
    }

    /**
     * UDP数据接收主循环
     */
    private void receiveLoop() {
        byte[] buffer = new byte[ShieldProtocolConstants.MAX_PACKET_LENGTH];
        DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

        while (running) {
            try {
                // 阻塞等待接收数据
                serverSocket.receive(packet);

                // 提取有效数据
                byte[] data = new byte[packet.getLength()];
                System.arraycopy(buffer, 0, data, 0, packet.getLength());
                InetAddress deviceAddress = packet.getAddress();
                int devicePort = packet.getPort();

                // 解码报文头
                ShieldPacketCodec.PacketHeader header;
                try {
                    header = ShieldPacketCodec.decodeHeader(data);
                } catch (Exception e) {
                    log.warn("收到无效报文，丢弃: {}", e.getMessage());
                    continue;
                }

                // 根据命令字分发处理
                switch (header.getCmd()) {
                    case ShieldProtocolConstants.CMD_REPORT_STATUS:
                        handleStatusReport(data, deviceAddress, devicePort);
                        break;
                    case ShieldProtocolConstants.CMD_REBOOT_ACK:
                    case ShieldProtocolConstants.CMD_RF_SWITCH_SET_ACK:
                    case ShieldProtocolConstants.CMD_RF_SWITCH_GET_ACK:
                    case ShieldProtocolConstants.CMD_ATT_SET_ACK:
                    case ShieldProtocolConstants.CMD_ATT_GET_ACK:
                    case ShieldProtocolConstants.CMD_NETWORK_SET_ACK:
                    case ShieldProtocolConstants.CMD_NETWORK_GET_ACK:
                    case ShieldProtocolConstants.CMD_ALARM_THRESHOLD_SET_ACK:
                    case ShieldProtocolConstants.CMD_ALARM_THRESHOLD_GET_ACK:
                    case ShieldProtocolConstants.CMD_GET_DEVICE_INFO_ACK:
                        handleCommandResponse(data, header.getCmd(), deviceAddress, devicePort);
                        break;
                    default:
                        log.warn("收到未知命令字: 0x{}", Integer.toHexString(header.getCmd() & 0xFF));
                }

            } catch (Exception e) {
                if (running) {
                    log.error("UDP接收数据异常", e);
                }
            }
        }
    }

    /**
     * 处理设备状态上报报文
     */
    private void handleStatusReport(byte[] packet, InetAddress address, int port) {
        try {
            // 解码状态数据
            byte[] statusData = ShieldPacketCodec.decodeData(packet);
            DeviceStatus status = DeviceStatus.fromBytes(statusData);
            int deviceId = status.getDeviceId();

            // 保存状态到Redis
            redisCommandQueue.saveDeviceStatus(deviceId, status);

            // ✅ 新增：更新设备心跳时间（核心）
            redisCommandQueue.updateHeartbeat(deviceId);

            // ==================== 完整状态打印（核心修改） ====================
            log.info("");
            log.info("========================================");
            log.info("📡 收到设备[{}]状态上报", deviceId);
            log.info("----------------------------------------");
            log.info("设备地址: {}:{}", address.getHostAddress(), port);
            log.info("上报时间: {}", new java.util.Date());
            log.info("----------------------------------------");
            log.info("⚡ 电气参数:");
            log.info("  电压: {} mV ({} V)", status.getVoltage(), String.format("%.2f", status.getVoltage() / 1000.0));
            log.info("  电流: {} mA ({} A)", status.getCurrent(), String.format("%.2f", status.getCurrent() / 1000.0));
            log.info("🌡️  温度: {} ℃", status.getTemperature());
            log.info("----------------------------------------");
            log.info("🔌 开关状态:");
            log.info("  VCO: {}", status.isVcoOn() ? "✅ 开启" : "❌ 关闭");
            log.info("  风扇: {}", status.isFanOn() ? "✅ 开启" : "❌ 关闭");
            log.info("----------------------------------------");
            log.info("📻 18通道状态:");

            // 拼接通道状态字符串（每行显示6个通道）
            StringBuilder channelSb = new StringBuilder();
            int openCount = 0;
            for (int i = 0; i <= 17; i++) {
                boolean isOn = status.getChannelState(i);
                if (isOn) openCount++;

                channelSb.append(String.format("CH%02d:%s ", i+1, isOn ? "✅" : "❌"));

                // 每行显示6个通道
                if ((i + 1) % 6 == 0) {
                    log.info("  {}", channelSb.toString().trim());
                    channelSb.setLength(0);
                }
            }

            // 打印剩余的通道
            if (channelSb.length() > 0) {
                log.info("  {}", channelSb.toString().trim());
            }

            log.info("  总计: 开启{}个, 关闭{}个", openCount, 18 - openCount);
            log.info("----------------------------------------");

            // 打印告警状态
            boolean hasAlarm = status.hasAnyAlarm();
            if (hasAlarm) {
                log.warn("⚠️  告警状态: 存在异常");
                StringBuilder alarmSb = new StringBuilder();
                if (status.isLowTemperatureAlarm()) alarmSb.append("低温告警 ");
                if (status.isOverTemperatureAlarm()) alarmSb.append("过温告警 ");
                if (status.isOverVoltageAlarm()) alarmSb.append("过压告警 ");
                if (status.isUnderVoltageAlarm()) alarmSb.append("欠压告警 ");
                if (status.isOverCurrentAlarm()) alarmSb.append("过流告警 ");
                if (status.isUnderCurrentAlarm()) alarmSb.append("欠流告警 ");
                log.warn("  异常项: {}", alarmSb.toString().trim());
            } else {
                log.info("✅ 告警状态: 正常");
            }

            log.info("========================================");
            log.info("");

            // 发送状态上报应答
            sendAck(address, port, ShieldProtocolConstants.CMD_REPORT_STATUS_ACK, ShieldProtocolConstants.STATUS_OK);

            // 后续命令处理逻辑不变...
            // 尝试获取分布式锁
            String lockHolder = redisCommandQueue.tryLock(deviceId);
            if (lockHolder == null) {
                // 其他实例正在处理该设备，跳过
                return;
            }

            try {
                // 检查是否有正在执行的命令
                DeviceCommand executingCommand = executingCommands.get(deviceId);
                if (executingCommand != null) {
                    // 检查命令是否超时
                    if (System.currentTimeMillis() - executingCommand.getCreateTime() > executingCommand.getTimeoutMs()) {
                        if (executingCommand.getRetryCount() < executingCommand.getMaxRetryCount()) {
                            // 重试发送命令
                            executingCommand.setRetryCount(executingCommand.getRetryCount() + 1);
                            sendCommandToDevice(executingCommand, address, port);
                            log.info("命令超时，重试发送[{}]到设备[{}]",
                                    executingCommand.getCommandId(), deviceId);
                        } else {
                            // 超过最大重试次数，标记失败
                            executingCommands.remove(deviceId);
                            redisCommandQueue.saveCommandResult(executingCommand.getCommandId(),
                                    Map.of("error", "命令执行超时，超过最大重试次数"));
                            log.error("命令[{}]执行失败，超过最大重试次数", executingCommand.getCommandId());
                        }
                    }
                    return;
                }

                // 从Redis队列获取下一个待执行命令
                DeviceCommand command = redisCommandQueue.popNextCommand(deviceId);
                if (command != null) {
                    // 记录正在执行的命令
                    executingCommands.put(deviceId, command);
                    // 发送命令给设备
                    sendCommandToDevice(command, address, port);
                    log.info("向设备[{}]发送命令[0x{}], 命令ID: {}",
                            deviceId, Integer.toHexString(command.getCmd() & 0xFF), command.getCommandId());
                }

            } finally {
                // 释放分布式锁
                redisCommandQueue.releaseLock(deviceId, lockHolder);
            }

        } catch (Exception e) {
            log.error("处理设备状态上报失败，原始报文: {}", ShieldPacketCodec.bytesToHex(packet), e);
        }
    }

    /**
     * 处理命令应答报文
     */
    private void handleCommandResponse(byte[] packet, byte ackCmd, InetAddress address, int port) {
        try {
            // 解码应答数据
            byte[] responseData = ShieldPacketCodec.decodeData(packet);

            // 查找对应的正在执行的命令
            for (Map.Entry<Integer, DeviceCommand> entry : executingCommands.entrySet()) {
                DeviceCommand command = entry.getValue();
                if (command.getExpectedAckCmd() == ackCmd) {
                    int deviceId = entry.getKey();

                    // 保存命令执行结果到Redis
                    redisCommandQueue.saveCommandResult(command.getCommandId(), responseData);

                    // 移除正在执行的命令
                    executingCommands.remove(deviceId);

                    log.info("收到设备[{}]的命令应答[0x{}], 命令ID: {}",
                            deviceId, Integer.toHexString(ackCmd & 0xFF), command.getCommandId());
                    return;
                }
            }

            log.warn("收到未知的命令应答: 0x{}", Integer.toHexString(ackCmd & 0xFF));

        } catch (Exception e) {
            log.error("处理命令应答失败", e);
        }
    }

    /**
     * 发送命令给设备
     * 注意：这里直接发送ShieldProtocolUtil生成的完整报文
     */
    private void sendCommandToDevice(DeviceCommand command, InetAddress address, int port) throws Exception {
        // command.getData()中存储的是ShieldProtocolUtil.buildCmdXXX()生成的完整报文
        byte[] fullPacket = command.getData();
        DatagramPacket packet = new DatagramPacket(
                fullPacket, fullPacket.length, address, port);
        serverSocket.send(packet);
    }

    /**
     * 发送应答报文
     */
    private void sendAck(InetAddress address, int port, byte cmd, byte status) throws Exception {
        byte[] data = new byte[]{status};
        byte[] packet = ShieldPacketCodec.encode(cmd, data);
        DatagramPacket ackPacket = new DatagramPacket(packet, packet.length, address, port);
        serverSocket.send(ackPacket);
    }
}
