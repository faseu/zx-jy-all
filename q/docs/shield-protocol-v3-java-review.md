# 屏蔽器通信协议 V3.0 与项目实现校验修改建议

生成日期：2026-06-30

参考资料：

- `D:\Microsoft\work\zx-jy-all\屏蔽器与外设通信协议V3.0(1).docx`
- 后端项目：`D:\Microsoft\work\zx-jy-all\h`
- 前端项目：`D:\Microsoft\work\zx-jy-all\q`

## 1. 结论摘要

当前 Java 项目已经覆盖了协议 V3.0 的主要命令字、包头、小端、CRC、状态上报、通道开关、通道衰减、网络参数、告警阈值、设备信息等基础能力，但还不能认为已经完整闭环。

主要问题集中在五类：

1. 协议实现有两套：`com.youlai.boot.udp.ShieldProtocolUtil` 与 `com.youlai.boot.udp2.*` 同时存在，控制器构包用前者，UDP 收发和队列用后者，后续维护容易出现偏差。
2. 设备通道衰减保存存在明显 bug：`TDeviceServiceImpl.updateCH()` 把 CH1-CH18 下发成协议通道 1-18，协议要求 0-17；并且构造的是 `0x22` 设置衰减报文，却登记为 `CMD_ATT_GET / 0xA3` 应答。
3. 接口返回的“成功”只是命令入队或下发成功，不代表设备执行成功；`commandResult` 当前只返回原始 `byte[]`，没有解析状态字。
4. 前端设备详情页原先读的是 `t_device.ch1-ch18` 配置值，不是设备实时上报的 `channelStates`，因此通道开关接口成功后页面不会自动体现真实状态。
5. 数据库表设计偏弱：`t_device` 同时承载基础资料、运行状态和通道配置，且初始化 SQL 与当前 Mapper/实体字段不一致，缺少协议 V3.0 所需的通道开关、网络参数、告警阈值、状态快照、命令日志等结构。

建议先修影响联调的高优先级 bug，再按“协议层统一 -> 命令执行结果规范 -> 数据模型拆分 -> 前端状态闭环”的顺序分阶段处理。

## 2. 协议 V3.0 关键点

### 2.1 通用报文

- 同步头固定为 `A5 5A CD DC`。
- 报文长度为 2 字节，小端。
- 多字节数值均小端。
- 设备属性：屏蔽器与以太网客户端之间通信为 `0x10`。
- 命令应答值为命令字最高位置 1。
- UDP 总报文不超过 1200 字节。

当前 `ShieldPacketCodec` 与 `ShieldProtocolUtil` 对包头、小端、CRC 范围的处理整体符合协议。

### 2.2 命令清单

| 功能 | 命令 | 应答 | 当前实现 |
|---|---:|---:|---|
| 状态上报 | `0x2A` | `0xAA` | 已实现并缓存 Redis |
| 重启设备 | `0x14` | `0x94` | 已实现 |
| 射频开关设置 | `0x20` | `0xA0` | 已实现 |
| 射频开关获取 | `0x21` | `0xA1` | 有构包，但接口未充分使用 |
| ATT 衰减设置 | `0x22` | `0xA2` | 已实现，但 `updateCH` 调用错误 |
| ATT 衰减获取 | `0x23` | `0xA3` | 已实现 |
| 网络参数设置 | `0x24` | `0xA4` | 已实现，需加强字段语义和校验 |
| 网络参数获取 | `0x25` | `0xA5` | 已实现下发，结果未结构化返回 |
| 告警阈值设置 | `0x26` | `0xA6` | 已实现 |
| 告警阈值获取 | `0x27` | `0xA7` | 已实现下发，结果未结构化返回 |
| 设备信息获取 | `0x28` | `0xA8` | 已实现下发，结果未结构化返回 |

### 2.3 运行状态 `0x2A`

协议数据体为 24 字节：

- 设备 ID：4 字节
- 电压：4 字节，无符号，mV
- 电流：4 字节，无符号，mA
- 温度：4 字节，有符号，摄氏度
- 18 通道开关 bitmask：4 字节，Bit0-Bit17 对应 CH01-CH18
- 告警状态：1 字节
- VCO 开关：1 字节
- 风扇开关：1 字节
- 保留：1 字节

`udp2.DeviceStatus.fromBytes()` 要求 24 字节，并按上述顺序解析，基本正确。

## 3. 后端需要修改的问题

### 3.1 高优先级：修复 `updateCH()` 通道偏移和应答命令错误

位置：

- `h/src/main/java/com/youlai/boot/system/service/impl/TDeviceServiceImpl.java`

当前逻辑：

```java
byte[] fullPacket = ShieldProtocolUtil.buildCmdSetAtt(i + 1, Integer.parseInt(chs.get(i)));
DeviceCommand command = new DeviceCommand(
        ShieldProtocolConstants.CMD_ATT_GET,
        fullPacket,
        ShieldProtocolConstants.CMD_ATT_GET_ACK
);
```

问题：

- 协议通道号范围是 `0-17`，循环变量 `i` 已经是 `0-17`，不应该传 `i + 1`。
- `buildCmdSetAtt()` 构造的是 `0x22` 设置衰减，命令和期望应答应为 `CMD_ATT_SET / CMD_ATT_SET_ACK`。
- CH18 会传入协议通道 18，`buildCmdSetAtt()` 返回 `null`，后续仍入队，可能导致发送异常。
- 目前 `ch1-ch18` 前端限制为 `0-100`，协议 ATT 只允许 `0-63`，单位 `0.5dB`。

建议改为：

```java
int attValue = Integer.parseInt(chs.get(i));
byte[] fullPacket = ShieldProtocolUtil.buildCmdSetAtt(i, attValue);
if (fullPacket == null) {
    throw new IllegalArgumentException("通道或衰减值超出协议范围");
}
DeviceCommand command = new DeviceCommand(
        ShieldProtocolConstants.CMD_ATT_SET,
        fullPacket,
        ShieldProtocolConstants.CMD_ATT_SET_ACK
);
```

同时接口层必须校验 `ch1-ch18` 均为 `0-63`。

### 3.2 高优先级：区分“入队成功、下发成功、执行成功”

位置：

- `h/src/main/java/com/youlai/boot/system/controller/ShieldController.java`
- `h/src/main/java/com/youlai/boot/udp2/ShieldCommunicationService.java`

当前接口返回 `Result.success` 时，只表示命令进入 Redis 队列，不代表设备已执行成功。设备真正应答后，`handleCommandResponse()` 只把响应数据体 `byte[]` 保存到 Redis，没有解析状态字。

建议统一命令结果结构：

```json
{
  "commandId": "xxx",
  "deviceId": 1469925036,
  "requestCmd": "0x20",
  "ackCmd": "0xA0",
  "status": 0,
  "statusText": "正常",
  "payload": {
    "channel": 1,
    "state": 1
  },
  "sentAt": 1710000000000,
  "ackAt": 1710000001200
}
```

`commandResult` 应返回：

- `pending`：还未下发或未收到 ACK
- `success`：收到 ACK 且状态字为 `0`
- `device_error`：收到 ACK 但状态字为 `1`
- `crc_error`：收到 ACK 状态字为 `0xFF`
- `timeout`：超过重试次数

前端再根据该状态提示“设备执行成功”或“设备执行失败”。

### 3.3 高优先级：ACK 匹配不能只按应答命令字

位置：

- `h/src/main/java/com/youlai/boot/udp2/ShieldCommunicationService.java`

当前 `handleCommandResponse()` 遍历 `executingCommands`，只要 `expectedAckCmd == ackCmd` 就认为是该命令的应答。多个设备同时执行同类命令时，可能把 A 设备的 ACK 记到 B 设备命令上。

建议：

- 在收到状态上报时记录 `deviceId -> address:port` 与 `address:port -> deviceId`。
- 处理 ACK 时优先通过 `address:port` 找到设备 ID，再取该设备正在执行的命令。
- `executingCommands` 保持按 deviceId 存储，但 ACK 匹配必须带设备来源。

### 3.4 高优先级：统一协议实现入口

当前存在：

- `com.youlai.boot.udp.ShieldProtocolUtil`
- `com.youlai.boot.udp2.ShieldPacketCodec`
- `com.youlai.boot.udp2.ShieldProtocolConstants`
- `com.youlai.boot.udp2.CRC16Util`

建议统一为 `udp2` 作为唯一协议包：

- `ShieldProtocolConstants`：命令字、状态字、端口、范围常量。
- `ShieldPacketCodec`：通用 encode/decode/CRC。
- `ShieldCommandFactory`：构造 `0x14、0x20、0x21、0x22、0x23、0x24、0x25、0x26、0x27、0x28` 命令。
- `ShieldResponseParser`：解析 `0x94、0xA0、0xA1、0xA2、0xA3、0xA4、0xA5、0xA6、0xA7、0xA8` 应答。
- 删除或废弃旧的 `com.youlai.boot.udp.ShieldProtocolUtil`，避免两套实现并存。

### 3.5 中优先级：完善协议字段校验

建议补充校验：

- `entireNo` 当前被 `Integer.parseInt(entireNo)` 当作协议设备 ID 使用，应确认业务上的“全网编号”是否必然等于协议 `deviceId`。如果不是，必须新增字段 `protocol_device_id`。
- MAC 地址应区分 `destMac` 和 `deviceMac`。当前 `setNetParam()` 把二者都传为同一个 `mac`，但协议中二者语义不同。
- IP、端口、MAC、阈值、上报周期都应在 Controller 或 DTO 层校验。
- 温度阈值协议是有符号 4 字节，当前 `writeUInt4LE()` 写入负数时虽然低 32 位通常可用，但语义上建议提供 `writeInt4LE()`。
- `decodeHeader()` 应验证 `packet.length == 6 + segLength` 或至少 `packet.length >= 6 + segLength`，避免异常报文污染解析。

### 3.6 中优先级：明确 `0x21/0x23` 获取命令长度歧义

协议表中 `0x21`、`0x23` 获取单通道信息只列出 1 字节通道号，但长度写为 `4+2`，按通用长度定义应为：

- 设备属性 1
- 命令字 1
- 通道号 1
- CRC 2
- 合计 5

当前代码构造 `segLen = 6`，会在通道号后多出一个默认 `0x00` 字节。这个可能是协议文档表格错误，也可能是设备实际要求保留字节。

建议与设备侧确认：

- 如果设备要求 `segLen=6`，文档应补“保留 1 字节”。
- 如果设备要求严格按字段，代码应改为 `segLen=5`。

### 3.7 中优先级：运行状态不要只停留在 Redis

当前 `0x2A` 状态保存到 Redis，适合做最新状态缓存，但不适合支撑：

- 历史曲线
- 离线前最后一次状态
- 告警追溯
- 统计报表

建议：

- Redis 保存最新状态。
- DB 保存最新状态快照和必要历史采样。
- 状态上报频率较高时，历史表可按分钟/变化写入，避免每包落库。

### 3.8 中优先级：告警需要去重和恢复闭环

当前状态上报每次发现告警位为 1 就可能新增告警。建议：

- 同一设备、同一告警类型，未处理且未恢复时只保留一条活动告警。
- 当状态上报中对应 bit 恢复为 0 时，记录恢复时间，或将活动告警标记为已恢复。
- `t_alarm` 增加 `alarm_bit、active、recover_time、last_seen_time、source_report_time`。

## 4. 前端需要修改的问题

### 4.1 设备详情页要分清“衰减值”和“开关状态”

协议里：

- `ATT` 是通道衰减值，范围 `0-63`，单位 `0.5dB`。
- `channelStates` 是通道开关 bitmask，Bit0-Bit17 对应 CH01-CH18。

前端建议：

- 通道衰减 Slider 范围改为 `0-63`，显示 `值 / dB`，例如 `31 = 15.5dB`。
- 每个通道增加开关控件，状态来自 `/api/v1/udp/shield/getDeviceStatus` 的 `channelStates`。
- 点击开关后调用 `setRfSwitch` 或 `batchSetRfSwitch`，再轮询 `commandResult`，最后刷新 `getDeviceStatus`。
- 不要把接口入队成功直接提示为设备执行成功。

### 4.2 命令类接口建议统一交互

前端所有设备命令都按同一模式处理：

1. 调用命令接口，拿到 `commandId`。
2. 页面显示“命令已提交，等待设备应答”。
3. 轮询 `/shield/commandResult?commandId=xxx`。
4. 根据结构化状态展示成功、失败、超时。
5. 成功后刷新实时状态或配置详情。

适用功能：

- 通道开关
- 通道衰减
- 网络参数
- 告警阈值
- 设备信息
- 远程重启

### 4.3 页面字段建议

设备详情建议拆为三块：

- 基础资料：设备名称、设备 ID、楼栋楼层、IP、端口、版本。
- 实时状态：在线状态、电压、电流、温度、VCO、风扇、18 通道开关、告警位、上报时间。
- 设备配置：18 通道 ATT、网络参数、阈值、状态上报周期。

这样用户不会把“配置值”和“实时状态”混在一起。

## 5. 表设计建议

### 5.1 当前表问题

当前 SQL 初始化文件里的 `t_device` 只包含基础字段和 `parameters`，但 Mapper 已读取：

- `position_x`
- `position_y`
- `voltage`
- `electric_current`
- `radio_frequency`
- `ch1-ch18`

如果用当前 `jamyu.sql` 初始化数据库，设备列表/详情会出现字段不存在问题。需要补齐迁移脚本，或更新初始化 SQL。

### 5.2 推荐拆表

#### t_device：设备基础资料

保留稳定业务字段：

- `id`
- `device_no`
- `device_name`
- `entire_no`
- `protocol_device_id`
- `floor_id`
- `building_id`
- `prison_id`
- `ip_address`
- `port`
- `mac_address`
- `position_x`
- `position_y`
- `is_deleted`
- `create_time`
- `update_time`

说明：

- `entire_no` 是业务编号。
- `protocol_device_id` 是协议 `0x2A` 上报的设备 ID。如果二者确认永远一致，可以保留一个；否则必须拆开。

#### t_device_status_latest：设备最新状态

保存最新快照：

- `device_id`
- `protocol_device_id`
- `online`
- `voltage_mv`
- `current_ma`
- `temperature_c`
- `channel_states`
- `alarm_status`
- `vco_on`
- `fan_on`
- `report_time`
- `last_seen_time`

#### t_device_channel_config：通道配置

一设备 18 行：

- `device_id`
- `channel_no`，范围 1-18
- `att_value`，范围 0-63
- `att_db` 可计算，不一定落库
- `expected_enabled`
- `last_report_enabled`
- `updated_at`

如果为了简单也可以保留 `ch1-ch18`，但长期不建议，后续查询、校验、扩展都不方便。

#### t_device_network_config：网络参数

- `device_id`
- `dest_mac`
- `device_mac`
- `device_ip`
- `gateway`
- `subnet_mask`
- `server_ip`
- `backup_server_ip`
- `device_port`
- `server_port`
- `synced_at`

#### t_device_alarm_threshold：告警阈值配置

- `device_id`
- `low_voltage_mv`
- `high_voltage_mv`
- `low_current_ma`
- `high_current_ma`
- `low_temperature_c`
- `high_temperature_c`
- `fan_open_temperature_c`
- `report_cycle_seconds`
- `synced_at`

#### t_device_command_log：命令日志

- `command_id`
- `device_id`
- `request_cmd`
- `ack_cmd`
- `request_payload`
- `response_payload`
- `status`
- `status_text`
- `retry_count`
- `created_at`
- `sent_at`
- `ack_at`
- `timeout_at`

用于排查“接口成功但设备没生效”的问题。

#### t_alarm：告警事件

建议补充：

- `alarm_bit`
- `active`
- `recover_time`
- `last_seen_time`
- `source_report_time`

并加唯一约束或业务去重：

- 同一设备、同一 `alarm_bit`、`active=1` 时只允许一条活动告警。

## 6. 接口设计建议

### 6.1 命令接口建议从 GET 改为 POST

当前大量控制类接口使用 GET，例如：

- `/shield/setRfSwitch`
- `/shield/setAtt`
- `/shield/setAlarmThreshold`
- `/shield/setNetParam`

这些接口会改变设备状态，建议改为 POST：

- `POST /api/v1/udp/shield/rf-switch`
- `POST /api/v1/udp/shield/att`
- `POST /api/v1/udp/shield/alarm-threshold`
- `POST /api/v1/udp/shield/network`

GET 保留给纯查询：

- `GET /api/v1/udp/shield/status`
- `GET /api/v1/udp/shield/command-result`
- `GET /api/v1/udp/shield/online-devices`

### 6.2 批量通道开关建议支持位图

当前批量开关会拆成多个单通道命令，协议本身 `0x20` 也是单通道设置，所以可以继续拆。

但接口响应要说明：

- 成功入队几个
- 每个通道对应的 `commandId`
- 每个命令最终 ACK 状态

建议响应：

```json
{
  "items": [
    { "channel": 1, "commandId": "xxx", "enqueueStatus": "queued" },
    { "channel": 3, "commandId": "yyy", "enqueueStatus": "queued" }
  ]
}
```

### 6.3 设备状态接口建议直接返回展开字段

建议 `/shield/getDeviceStatus` 返回：

```json
{
  "deviceId": 1469925036,
  "voltageMv": 24000,
  "currentMa": 1200,
  "temperatureC": 35,
  "channelStates": 3,
  "channels": [
    { "channel": 1, "enabled": true },
    { "channel": 2, "enabled": true }
  ],
  "alarms": {
    "lowTemperature": false,
    "overTemperature": false,
    "overVoltage": false,
    "underVoltage": false,
    "overCurrent": false,
    "underCurrent": false
  },
  "vcoOn": true,
  "fanOn": false,
  "reportTime": 1710000000000
}
```

前端不需要自己重复解析 bit。

## 7. 需求合理性建议

### 7.1 合理需求

- 每通道开关：协议明确支持 `0x20/0x21`，合理。
- 每通道衰减值：协议明确支持 `0x22/0x23`，合理。
- 状态实时展示：协议 `0x2A` 支持，合理。
- 告警阈值和上报周期配置：协议 `0x26/0x27` 支持，合理。
- 获取设备信息和版本：协议 `0x28` 支持，合理。

### 7.2 需要调整表达的需求

- “接口成功即页面生效”不严谨。设备通信是异步 UDP，接口成功只能表示命令入队或已下发，应以设备 ACK 和下一次状态上报为准。
- “0 表示关闭”和“ATT 值为 0”不能混用。通道开关由 `channelStates` 表示，ATT=0 只是衰减值 0dB，不等于关闭。
- “全网编号”和协议设备 ID 要确认是否同一概念。协议 V3.0 的 `设备ID` 是设备唯一编号，如果业务侧 `entireNo` 可编辑或非纯数字，不能直接用作协议 ID。
- “设备电源开关”当前业务字段 `power_off` 不在协议 V3.0 命令清单里，需要明确它到底对应设备哪条命令。如果只是平台状态字段，不应假装可以控制硬件电源。

## 8. 分阶段修改计划

### 第一阶段：联调阻塞修复

1. 修复 `updateCH()` 通道偏移和应答命令。
2. 前端 ATT 范围改为 `0-63`，展示 `0-31.5dB`。
3. 通道开关展示接入 `getDeviceStatus.channelStates`。
4. `commandResult` 解析 ACK 状态字，不再返回裸 `byte[]`。
5. 确认 `entireNo` 是否等于协议设备 ID；如不等，新增映射字段。

### 第二阶段：协议层统一

1. 合并 `udp` 和 `udp2` 两套协议实现。
2. 新增 `ShieldCommandFactory` 和 `ShieldResponseParser`。
3. 为每个命令增加单元测试，至少覆盖包头、长度、数据区、CRC。
4. 明确 `0x21/0x23` 获取命令长度，必要时和设备侧修订协议文档。

### 第三阶段：业务闭环

1. 新增命令日志表。
2. 新增设备最新状态表。
3. 新增通道配置表、网络参数表、阈值配置表。
4. 告警增加去重、恢复、活动状态。
5. 前端所有设备命令改为“提交 -> 等 ACK -> 刷状态”的交互。

### 第四阶段：体验和运维

1. 增加设备通信诊断页面：在线、最近上报、命令队列、最后 ACK、失败原因。
2. 增加协议报文 HEX 日志开关，生产默认关闭，联调时开启。
3. 增加设备状态历史采样，用于趋势图和问题追溯。
4. Redis `keys` 查询改为 `scan`，避免设备量上来后阻塞。

## 9. 建议优先修改清单

| 优先级 | 模块 | 修改项 | 原因 |
|---|---|---|---|
| P0 | 后端 | 修复 `updateCH()` 的通道号和 ACK 类型 | 直接导致通道衰减设置错位/失败 |
| P0 | 后端 | `commandResult` 结构化解析 ACK 状态 | 解决“接口成功但设备没生效”无法判断的问题 |
| P0 | 前端 | 区分通道开关和 ATT 衰减 | 当前页面语义混淆 |
| P0 | 数据库 | 补齐当前 Mapper 依赖字段或迁移脚本 | 新环境会字段不存在 |
| P1 | 后端 | ACK 按设备来源匹配 | 多设备同命令并发可能串结果 |
| P1 | 后端 | 统一协议实现包 | 降低维护风险 |
| P1 | 后端 | 告警去重和恢复 | 避免告警表被状态上报刷爆 |
| P1 | 数据库 | 拆通道配置、状态、网络、阈值、命令日志表 | 支撑长期运维 |
| P2 | 前端 | 命令类操作统一轮询 ACK | 提升用户反馈准确性 |
| P2 | 需求 | 明确 `power_off` 是否对应硬件命令 | 避免需求和协议不一致 |

