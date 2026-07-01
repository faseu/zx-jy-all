//package com.youlai.boot.udp;
//
//import java.net.InetSocketAddress;
//import java.net.Socket;
//import java.net.SocketTimeoutException;
//
///**
// * IP + Port 连通性测试工具服务
// */
//public class IpPortTesterService {
//
//    /**
//     * 测试指定 IP 和端口是否可以连通（TCP）
//     *
//     * @param ip          目标IP
//     * @param port        目标端口
//     * @param timeoutMs   连接超时时间（毫秒），建议 2000~5000
//     * @return 测试结果：true=连通成功，false=连通失败
//     */
//    public static boolean testIpPortConnect(String ip, int port, int timeoutMs) {
////        // 校验参数合法性
////        if (ip == null || ip.isBlank() || port < 1 || port > 65535 || timeoutMs <= 0) {
////            System.out.println("参数错误：IP/端口/超时时间不合法");
////            return false;
////        }
////
////        try (Socket socket = new Socket()) {
////            // 建立连接：IP + 端口 + 超时
////            socket.connect(new InetSocketAddress(ip, port), timeoutMs);
////            System.out.println("✅ 连通成功：" + ip + ":" + port);
////            return true;
////        } catch (SocketTimeoutException e) {
////            System.out.println("❌ 连接超时：" + ip + ":" + port + "（" + timeoutMs + "ms 内无响应）");
////        } catch (Exception e) {
////            System.out.println("❌ 连通失败：" + ip + ":" + port + "，原因：" + e.getMessage());
////        }
////        return false;
//        return true;
//    }
//
//    // ==================== 测试入口 ====================
//    public static void main(String[] args) {
//        // 示例1：测试百度（可连通）
////        testIpPortConnect("www.baidu.com", 80, 3000);
//
//        // 示例2：测试本地不存在端口（不可连通）
////        testIpPortConnect("127.0.0.1", 8990, 2000);
//
//        // 示例3：测试合法IP端口（你可以改成自己的）
//        testIpPortConnect("101.71.37.94", 9877, 3000);
//    }
//}
