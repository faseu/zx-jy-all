package com.youlai.boot.system.controller;

import com.youlai.boot.common.annotation.OperLog;
import com.youlai.boot.core.web.Result;
import com.youlai.boot.udp.ShieldProtocolUtil;
import com.youlai.boot.udp2.DeviceCommand;
import com.youlai.boot.udp2.DeviceStatus;
import com.youlai.boot.udp2.RedisCommandQueue;
import com.youlai.boot.udp2.ShieldProtocolConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Tag(name = "18.设备Udp")
@RestController
@RequestMapping("/api/v1/udp")
@RequiredArgsConstructor
@Slf4j
public class ShieldController {

    private final RedisCommandQueue redisCommandQueue;

    // ====================== 原有基础接口（完全保留） ======================

    @GetMapping("/shield/reboot")
    @OperLog("重启设备")
    @Operation(summary = "重启设备")
    public Result<Map<String, Object>> reboot(
            @Parameter(description = "设备编号") @RequestParam String entireNo) {
        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdReboot();
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_REBOOT,
                fullPacket,
                ShieldProtocolConstants.CMD_REBOOT_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：重启设备");
        return Result.success(result);
    }

    @GetMapping("/shield/setRfSwitch")
    @OperLog(value = "设置通道开关")
    @Operation(summary = "设置单个通道开关")
    public Result<Map<String, Object>> setRfSwitch(
            @Parameter(description = "设备编号") @RequestParam String entireNo,
            @Parameter(description = "通道号(1-18)") @RequestParam int channel,
            @Parameter(description = "状态(0-关,1-开)") @RequestParam int state) {

        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }
        if (channel < 1 || channel > 18) {
            return Result.failed("通道号必须在1-18之间");
        }
        if (state != 0 && state != 1) {
            return Result.failed("状态只能是0或1");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdSetRfSwitch(channel - 1, state);
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_RF_SWITCH_SET,
                fullPacket,
                ShieldProtocolConstants.CMD_RF_SWITCH_SET_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：通道" + channel + " → " + (state == 1 ? "开启" : "关闭"));
        return Result.success(result);
    }

    @GetMapping("/shield/getDeviceInfo")
    @Operation(summary = "获取设备信息")
    public Result<Map<String, Object>> getDeviceInfo(
            @Parameter(description = "设备编号") @RequestParam String entireNo) {
        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdGetDeviceInfo();
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_GET_DEVICE_INFO,
                fullPacket,
                ShieldProtocolConstants.CMD_GET_DEVICE_INFO_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：获取设备信息");
        return Result.success(result);
    }

    @GetMapping("/shield/getNetParam")
    @Operation(summary = "查询网络参数")
    public Result<Map<String, Object>> getNetParam(
            @Parameter(description = "设备编号") @RequestParam String entireNo) {
        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdGetNetParam();
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_NETWORK_GET,
                fullPacket,
                ShieldProtocolConstants.CMD_NETWORK_GET_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：查询网络参数");
        return Result.success(result);
    }

    @GetMapping("/shield/getAtt")
    @Operation(summary = "查询通道衰减值")
    public Result<Map<String, Object>> getAtt(
            @Parameter(description = "设备编号") @RequestParam String entireNo,
            @Parameter(description = "通道号(1-18)") @RequestParam int channel) {

        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }
        if (channel < 1 || channel > 18) {
            return Result.failed("通道号必须在1-18之间");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdGetAtt(channel - 1);
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_ATT_GET,
                fullPacket,
                ShieldProtocolConstants.CMD_ATT_GET_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：查询通道" + channel + "衰减值");
        return Result.success(result);
    }

    @GetMapping("/shield/getAlarmThreshold")
    @Operation(summary = "查询告警阈值")
    public Result<Map<String, Object>> getAlarmThreshold(
            @Parameter(description = "设备编号") @RequestParam String entireNo) {
        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdGetAlarmThreshold();
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_ALARM_THRESHOLD_GET,
                fullPacket,
                ShieldProtocolConstants.CMD_ALARM_THRESHOLD_GET_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：查询告警阈值");
        return Result.success(result);
    }

    @GetMapping("/shield/setAtt")
    @OperLog(value = "设置通道衰减值")
    @Operation(summary = "设置通道衰减值")
    public Result<Map<String, Object>> setAtt(
            @Parameter(description = "设备编号") @RequestParam String entireNo,
            @Parameter(description = "通道号(1-18)") @RequestParam int channel,
            @Parameter(description = "衰减值(0-63,对应0-31.5dB)") @RequestParam int attValue) {

        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }
        if (channel < 1 || channel > 18) {
            return Result.failed("通道号必须在1-18之间");
        }
        if (attValue < 0 || attValue > 63) {
            return Result.failed("衰减值必须在0-63之间");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdSetAtt(channel - 1, attValue);
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_ATT_SET,
                fullPacket,
                ShieldProtocolConstants.CMD_ATT_SET_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：通道" + channel + " 衰减值 = " + attValue + " (" + (attValue * 0.5) + "dB)");
        return Result.success(result);
    }

    @GetMapping("/shield/setAlarmThreshold")
    @OperLog(value = "设置告警阈值")
    @Operation(summary = "设置告警阈值和上报周期")
    public Result<Map<String, Object>> setAlarmThreshold(
            @Parameter(description = "设备编号") @RequestParam String entireNo,
            @Parameter(description = "欠压阈值(mV)") @RequestParam long lowVolt,
            @Parameter(description = "过压阈值(mV)") @RequestParam long highVolt,
            @Parameter(description = "欠流阈值(mA)") @RequestParam long lowCurr,
            @Parameter(description = "过流阈值(mA)") @RequestParam long highCurr,
            @Parameter(description = "低温阈值(℃)") @RequestParam long lowTemp,
            @Parameter(description = "过温阈值(℃)") @RequestParam long highTemp,
            @Parameter(description = "风扇开启温度(℃)") @RequestParam long fanOpenTemp,
            @Parameter(description = "状态上报周期(秒)") @RequestParam long reportCycle) {

        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdSetAlarmThreshold(
                lowVolt, highVolt,
                lowCurr, highCurr,
                lowTemp, highTemp,
                fanOpenTemp, reportCycle
        );
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_ALARM_THRESHOLD_SET,
                fullPacket,
                ShieldProtocolConstants.CMD_ALARM_THRESHOLD_SET_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：设置告警阈值 & 上报周期");
        return Result.success(result);
    }

    @GetMapping("/shield/setNetParam")
    @OperLog(value = "设置网络参数")
    @Operation(summary = "设置设备网络参数")
    public Result<Map<String, Object>> setNetParam(
            @Parameter(description = "设备编号") @RequestParam String entireNo,
            @Parameter(description = "MAC地址(如:00:11:22:33:44:55)") @RequestParam String mac,
            @Parameter(description = "设备IP") @RequestParam String ip,
            @Parameter(description = "网关") @RequestParam String gateway,
            @Parameter(description = "子网掩码") @RequestParam String mask,
            @Parameter(description = "主服务器IP") @RequestParam String serverIp,
            @Parameter(description = "备份服务器IP") @RequestParam String backupServerIp,
            @Parameter(description = "设备端口") @RequestParam int localPort,
            @Parameter(description = "服务器端口") @RequestParam int serverPort) {

        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }

        byte[] fullPacket = ShieldProtocolUtil.buildCmdSetNetParam(
                hexToBytes(mac),
                hexToBytes(mac),
                ipToBytes(ip),
                ipToBytes(gateway),
                ipToBytes(mask),
                ipToBytes(serverIp),
                ipToBytes(backupServerIp),
                localPort,
                serverPort
        );
        DeviceCommand command = new DeviceCommand(
                ShieldProtocolConstants.CMD_NETWORK_SET,
                fullPacket,
                ShieldProtocolConstants.CMD_NETWORK_SET_ACK
        );

        String commandId = redisCommandQueue.sendCommand(entireNo, command);
        Map<String, Object> result = new HashMap<>();
        result.put("commandId", commandId);
        result.put("message", "已下发：设置设备网络参数");
        return Result.success(result);
    }

    @GetMapping("/shield/commandResult")
    @Operation(summary = "查询命令执行结果")
    public Result<Map<String, Object>> getCommandResult(
            @Parameter(description = "命令ID") @RequestParam String commandId) {
        Object result = redisCommandQueue.getCommandResult(commandId);

        Map<String, Object> response = new HashMap<>();
        if (result == null) {
            response.put("status", "pending");
            response.put("message", "命令正在执行中，请稍后查询");
            return Result.success(response);
        }

        if (result instanceof Map<?, ?> resultMap && resultMap.containsKey("status")) {
            response.put("status", resultMap.get("status"));
        } else {
            response.put("status", "completed");
        }
        response.put("result", result);
        return Result.success(response);
    }

    // ====================== 新增增强接口 ======================

    @GetMapping("/shield/batchSetRfSwitch")
    @OperLog(value = "批量设置通道开关")
    @Operation(summary = "批量设置多个通道开关")
    public Result<Map<String, Object>> batchSetRfSwitch(
            @Parameter(description = "设备编号") @RequestParam String entireNo,
            @Parameter(description = "通道号列表(逗号分隔,如:1,3,5)") @RequestParam String channels,
            @Parameter(description = "状态(0-关,1-开)") @RequestParam int state) {

        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }
        if (state != 0 && state != 1) {
            return Result.failed("状态只能是0或1");
        }

        String[] channelArray = channels.split(",");
        List<String> commandIds = new ArrayList<>();
        List<String> failedChannels = new ArrayList<>();

        for (String channelStr : channelArray) {
            try {
                int channel = Integer.parseInt(channelStr.trim());
                if (channel < 1 || channel > 18) {
                    failedChannels.add(channelStr);
                    continue;
                }

                byte[] fullPacket = ShieldProtocolUtil.buildCmdSetRfSwitch(channel - 1, state);
                DeviceCommand command = new DeviceCommand(
                        ShieldProtocolConstants.CMD_RF_SWITCH_SET,
                        fullPacket,
                        ShieldProtocolConstants.CMD_RF_SWITCH_SET_ACK
                );

                String commandId = redisCommandQueue.sendCommand(entireNo, command);
                commandIds.add(commandId);
            } catch (Exception e) {
                failedChannels.add(channelStr);
                log.error("批量设置通道开关失败，通道: {}", channelStr, e);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("commandIds", commandIds);
        result.put("successCount", commandIds.size());
        result.put("failedChannels", failedChannels);
        result.put("message", "批量设置完成，成功" + commandIds.size() + "个，失败" + failedChannels.size() + "个");
        return Result.success(result);
    }

    @GetMapping("/shield/setAllRfSwitch")
    @OperLog(value = "设置所有通道开关")
    @Operation(summary = "一键设置所有18个通道开关")
    public Result<Map<String, Object>> setAllRfSwitch(
            @Parameter(description = "设备编号") @RequestParam String entireNo,
            @Parameter(description = "状态(0-关,1-开)") @RequestParam int state) {

        int deviceId = Integer.parseInt(entireNo);
        if (!redisCommandQueue.isDeviceOnline(deviceId)) {
            return Result.failed("设备不在线，请稍后重试");
        }
        if (state != 0 && state != 1) {
            return Result.failed("状态只能是0或1");
        }

        List<String> commandIds = new ArrayList<>();
        for (int i = 0; i < 18; i++) {
            byte[] fullPacket = ShieldProtocolUtil.buildCmdSetRfSwitch(i, state);
            DeviceCommand command = new DeviceCommand(
                    ShieldProtocolConstants.CMD_RF_SWITCH_SET,
                    fullPacket,
                    ShieldProtocolConstants.CMD_RF_SWITCH_SET_ACK
            );
            String commandId = redisCommandQueue.sendCommand(entireNo, command);
            commandIds.add(commandId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("commandIds", commandIds);
        result.put("message", "已下发：所有通道" + (state == 1 ? "开启" : "关闭"));
        return Result.success(result);
    }

    @GetMapping("/shield/getDeviceStatus")
    @Operation(summary = "获取设备最新状态(从缓存)")
    public Result<DeviceStatus> getDeviceStatus(
            @Parameter(description = "设备编号") @RequestParam String entireNo) {
        int deviceId = Integer.parseInt(entireNo);
        DeviceStatus status = redisCommandQueue.getDeviceStatus(deviceId);

        if (status == null) {
            return Result.failed("未找到设备状态信息");
        }

        return Result.success(status);
    }

    @GetMapping("/shield/getOnlineDevices")
    @Operation(summary = "获取所有在线设备列表")
    public Result<List<Map<String, Object>>> getOnlineDevices() {
        Set<Integer> onlineDeviceIds = redisCommandQueue.getOnlineDeviceIds();
        List<Map<String, Object>> deviceList = new ArrayList<>();

        for (Integer deviceId : onlineDeviceIds) {
            DeviceStatus status = redisCommandQueue.getDeviceStatus(deviceId);
            Map<String, Object> deviceInfo = new HashMap<>();
            deviceInfo.put("deviceId", deviceId);
            deviceInfo.put("lastReportTime", status != null ? status.getReportTime() : null);
            deviceInfo.put("voltage", status != null ? status.getVoltage() : null);
            deviceInfo.put("temperature", status != null ? status.getTemperature() : null);
            deviceInfo.put("hasAlarm", status != null ? status.hasAnyAlarm() : null);
            deviceList.add(deviceInfo);
        }

        return Result.success(deviceList);
    }

    @GetMapping("/shield/clearCommandQueue")
    @OperLog(value = "清空设备命令队列")
    @Operation(summary = "清空设备待执行命令队列")
    public Result<Map<String, Object>> clearCommandQueue(
            @Parameter(description = "设备编号") @RequestParam String entireNo) {
        int deviceId = Integer.parseInt(entireNo);
        int clearedCount = redisCommandQueue.clearDeviceCommandQueue(deviceId);

        Map<String, Object> result = new HashMap<>();
        result.put("clearedCount", clearedCount);
        result.put("message", "已清空设备命令队列，共清除" + clearedCount + "条命令");
        return Result.success(result);
    }

    // ====================== 工具方法 ======================

    private byte[] ipToBytes(String ip) {
        String[] p = ip.split("\\.");
        return new byte[]{
                (byte) Integer.parseInt(p[0]),
                (byte) Integer.parseInt(p[1]),
                (byte) Integer.parseInt(p[2]),
                (byte) Integer.parseInt(p[3])
        };
    }

    private byte[] hexToBytes(String hex) {
        hex = hex.replace(":", "").replace(" ", "");
        byte[] b = new byte[hex.length() / 2];
        for (int i = 0; i < b.length; i++) {
            b[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        return b;
    }
}
