# Greenwall Project Overview and AI Prompt

## 项目框架

- 前端：React + TypeScript + Vite + Tailwind CSS
- 后端：Express + Node.js 通过 `tsx server.ts` 运行
- 数据可视化：Recharts
- MQTT：使用 `mqtt` 包连接到外部 broker
- 本地数据库：在 `data/mqtt_db.json` 中持久化 MQTT 日志、频率记录、历史 telemetry

## MQTT 信息来源

- Broker 地址：`mqtt://mqtt.cetools.org:1883`
- 主要订阅主题：
  - `UCL/GordonStreet/#`
  - `UCL/GordonStreet/acoupi-bird`
  - `UCL/GordonStreet/acoupi-bat`

## 关键后端文件

- `server.ts`
  - 启动 Express 服务
  - 用 MQTT 客户端连接 broker
  - 订阅上面列出的主题
  - 调用 `processTelemetryMessage(topic, payload)` 处理消息
  - 暴露 API 接口给前端

- `src/db/mqttStorage.ts`
  - 持久化数据库结构与读取逻辑
  - `getFrequencies(fromMs?, toMs?)` 返回频率事件
  - `getTelemetryHistory(timeframe)` 返回历史 telemetry
  - `recordFrequency(...)` 记录频率事件
  - `recordTelemetry(...)` 记录传感器快照
  - `recordMqttPacket(...)` 记录原始 MQTT 日志

## 关键前端文件

- `src/lib/useMqtt.ts`
  - 浏览器端尝试直接通过 WebSocket 连接 MQTT broker
  - 如果直接连接失败，自动退回到后端代理 SSE
  - 维护 `mqttState` 和 `liveSensorData`

- `src/components/MicroHabitatDashboard.tsx`
  - 从后端接口获取频率记录
  - 仅提供 `1h` 和 `24h` 两个时间窗口
  - 渲染 Bio-Acoustic 频率散点图
  - 显示 `species` 字段作为物种信息

## 主要接口

- `GET /api/frequencies?from=<ms>&to=<ms>`
  - 读取频率事件
  - 返回字段包括：`timestamp`, `frequency`, `species`, `topic`, `device_id`, `received_at`

- `GET /api/telemetry`
  - 当前 MQTT 连接状态和实时设备数据
  - 包含 `mqttStatus`, `temperature_c`, `humidity_percent`, `bird_calls_min`, `bat_calls_min` 等

- `GET /api/history?timeframe=24h|1w`
  - 返回聚合的历史 telemetry 数据，用于主面板趋势图

- `GET /api/mqtt/status`
  - 返回连接状态与最近消息

- `GET /api/mqtt/logs`
  - 返回原始 MQTT Raw 日志

- `GET /api/bat-status/latest`
  - 返回最新 bat 设备状态

## 关键数据规则

- `UCL/GordonStreet/acoupi-bird` 消息中的 `value` 字段应被解析为鸟类物种名称
- `frequencyRecords` 中的 `species` 字段会被用于前端散点图 Tooltip 显示
- 后端会优先从 `parsedVal.value`, `parsedVal.species`, `parsedVal.bird`, `parsedVal.name`, `parsedVal.label` 提取 species

## 你现在的修改

- 已去掉频率图中的 `7d` 选项
- 频率图现在仅保留 `1h` 和 `24h`
- 已移除描述中的“数据源严格限定于 MQTT 主题…”文本
- 已移除底部备注“所选时间范围内无数据时仅表明‘暂无新数据点’。图表严格使用连续时间轴与数值刻度。”
- 已确保 `value` 字段可以作为 `species` 保存并显示

## AI 使用提示（Prompt）

请使用以下提示来帮助理解和分析该项目：

```
你正在分析一个 React + Vite + Express 的绿色生态项目。后端通过 `server.ts` 连接 MQTT broker `mqtt://mqtt.cetools.org:1883`，并订阅 `UCL/GordonStreet/#`, `UCL/GordonStreet/acoupi-bird`, `UCL/GordonStreet/acoupi-bat`。

后端将收到的 MQTT 消息存入 `src/db/mqttStorage.ts` 管理的本地 JSON 数据库，并提供以下前端接口：
- `GET /api/frequencies?from=<ms>&to=<ms>`
- `GET /api/telemetry`
- `GET /api/history?timeframe=24h|1w`
- `GET /api/mqtt/status`
- `GET /api/mqtt/logs`
- `GET /api/bat-status/latest`

前端的 `src/components/MicroHabitatDashboard.tsx` 会从 `/api/frequencies` 获取数据用于绘制 Bio-Acoustic 频率散点图，图表只保留 `1h` 和 `24h` 时间范围。

对于 `UCL/GordonStreet/acoupi-bird` 主题，重要的是将消息 payload 中的 `value` 字段解析为鸟类物种名称，并将其写入 `frequencyRecords` 的 `species` 字段，前端在 Tooltip 中显示该信息。
```
