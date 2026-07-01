//package com.youlai.boot.udp;
//
//import cn.hutool.core.util.StrUtil;
//import com.youlai.boot.common.constant.RedisConstants;
//import jakarta.annotation.PreDestroy;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.context.annotation.Lazy;
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.stereotype.Service;
//
//import java.net.DatagramPacket;
//import java.net.DatagramSocket;
//import java.net.InetAddress;
//import java.net.SocketException;
//import java.util.Arrays;
//import java.util.Base64;
//import java.util.concurrent.*;
//
//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class ShieldUdpServer implements CommandLineRunner {
//
//    @Value("${udp.receiver.port:9876}")
//    private int udpPort;
//
//    @Value("${udp.receiver.buffer-size:1024}")
//    private int bufferSize;
//
//    @Value("${udp.receiver.core-pool-size:10}")
//    private int corePoolSize;
//
//    @Value("${udp.receiver.max-pool-size:50}")
//    private int maxPoolSize;
//
//    @Value("${udp.receiver.queue-capacity:500}")
//    private int queueCapacity;
//
//    private DatagramSocket datagramSocket;
//    private ThreadPoolExecutor processExecutor;
//
//    @Lazy
//    @Autowired
//    private ShieldProtocolUtil shieldProtocolUtil;  // 自动注入
//
//    private final RedisTemplate<String, Object> redisTemplate;
//
//    @Override
//    public void run(String... args) {
//        try {
//            // 1. 修复线程池：不丢设备数据
//            processExecutor = new ThreadPoolExecutor(
//                    corePoolSize,
//                    maxPoolSize,
//                    60L,
//                    TimeUnit.SECONDS,
//                    new LinkedBlockingQueue<>(queueCapacity),
//                    new ThreadPoolExecutor.CallerRunsPolicy() // 不丢包
//            );
//
//            // 2. UDP Socket（单线程接收，这是UDP标准安全用法）
//            datagramSocket = new DatagramSocket(udpPort);
//            datagramSocket.setReceiveBufferSize(1024 * 1024 * 4); // 4MB 防丢包
//            datagramSocket.setSendBufferSize(1024 * 1024 * 4);
//
//            log.info("UDP 屏蔽器服务已启动 | 端口：{}", udpPort);
//
//            // 启动唯一接收线程（UDP 必须这样才不会乱）
//            new Thread(this::startListening, "udp-receive-thread").start();
//
//        } catch (Exception e) {
//            log.error("UDP 启动失败", e);
//        }
//    }
//
//    /**
//     * 正确的 UDP 接收：单线程接收，线程池异步处理
//     */
//    private void startListening() {
//        while (!Thread.currentThread().isInterrupted()) {
//            try {
//                byte[] buf = new byte[bufferSize];
//                DatagramPacket packet = new DatagramPacket(buf, buf.length);
//                datagramSocket.receive(packet);
//
//                // 正确拷贝数据
//                byte[] data = Arrays.copyOfRange(packet.getData(), 0, packet.getLength());
//                String ip = packet.getAddress().getHostAddress();
//                int port = packet.getPort();
//
//                // 异步处理（不阻塞接收）
//                processExecutor.submit(() -> handle(ip, port, data));
//
//            } catch (Exception e) {
//                if (!datagramSocket.isClosed()) {
//                    log.error("UDP 接收异常", e);
//                }
//                break;
//            }
//        }
//    }
//
//    /**
//     * 业务处理（干净、安全、不破坏二进制）
//     */
//    private void handle(String senderIp, int senderPort, byte[] dataBytes) {
//        try {
//            // 【关键修复】禁止用字符串解码二进制协议！！！
//            log.info("【UDP接收】IP={}:{} | 长度={}", senderIp, senderPort, dataBytes.length);
//
//            // 你的协议解析（现在绝对不会错位了）
//            shieldProtocolUtil.parseReport(senderIp, senderPort, dataBytes);
//
//        } catch (Exception e) {
//            log.error("处理报文异常", e);
//        }
//    }
//
//    // ========================== 发送指令 ==========================
//    public boolean sendCmd(String deviceNo, byte[] cmd) {
//        try {
//            String base64 = Base64.getEncoder().encodeToString(cmd);
//            redisTemplate.opsForValue().set(deviceNo, base64, 24, TimeUnit.HOURS);
//            return true;
//        } catch (Exception e) {
//            log.error("发送指令异常", e);
//            return false;
//        }
//    }
//
//    // ========================== 优雅关闭 ==========================
//    @PreDestroy
//    public void destroy() {
//        log.info("UDP 服务关闭中...");
//        if (datagramSocket != null && !datagramSocket.isClosed()) {
//            datagramSocket.close();
//        }
//        if (processExecutor != null) processExecutor.shutdown();
//        log.info("UDP 服务已关闭");
//    }
//}
