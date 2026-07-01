# 设备详情弹窗接口联调文档

适用页面：

- `src/pages/region/components/DeviceDetailModal.tsx`

## 1. 电源开关

前端已接现有接口，无需新增。

### 开启电源

- Method: `POST`
- URL: `/api/v1/device/enableDevices`
- Body:

```json
{
  "ids": [1]
}
```

### 关闭电源

- Method: `POST`
- URL: `/api/v1/device/disableDevices`
- Body:

```json
{
  "ids": [1]
}
```

### 返回建议

```json
{
  "code": "00000",
  "data": true,
  "msg": "一切ok"
}
```

## 2. 通道配置保存

前端已按以下接口对接。

### 保存 CH1 - CH18

- Method: `PUT`
- URL: `/api/v1/device/{deviceId}/channels`
- Path 参数:
  - `deviceId`: 设备 ID

### Request Body

18 个通道都建议返回和接收，取值范围前端当前限制为 `0-100`。

```json
{
  "ch1": 10,
  "ch2": 20,
  "ch3": 30,
  "ch4": 40,
  "ch5": 50,
  "ch6": 60,
  "ch7": 70,
  "ch8": 80,
  "ch9": 90,
  "ch10": 100,
  "ch11": 10,
  "ch12": 20,
  "ch13": 30,
  "ch14": 40,
  "ch15": 50,
  "ch16": 60,
  "ch17": 70,
  "ch18": 80
}
```

### Response

```json
{
  "code": "00000",
  "data": true,
  "msg": "一切ok"
}
```

## 3. 详情查询接口字段要求

详情接口：

- Method: `GET`
- URL: `/api/v1/device/{deviceId}/form`

前端当前依赖这些字段：

- `id`
- `deviceNo`
- `deviceName`
- `entireNo`
- `buildingName`
- `floorName`
- `powerOff`
- `voltage`
- `electric_current`
- `radio_frequency`
- `ch1` - `ch18`

### 字段说明

- `powerOff = 0` 表示开
- `powerOff = 1` 表示关
- `ch1` - `ch18` 当前前端按数值型使用，建议返回 `number` 或可转成 `number` 的字符串

## 4. 发后端的话术

```text
设备详情弹窗已接通电源开关和 CH1-CH18 通道配置。

1. 电源开关继续使用现有接口：
POST /api/v1/device/enableDevices
POST /api/v1/device/disableDevices

2. 请新增通道配置保存接口：
PUT /api/v1/device/{deviceId}/channels

请求体为 ch1-ch18 共 18 个通道值，前端当前限制范围 0-100。

3. 设备详情接口 /api/v1/device/{deviceId}/form 请稳定返回：
deviceNo, deviceName, entireNo, buildingName, floorName, powerOff, voltage, electric_current, radio_frequency, ch1-ch18
```
