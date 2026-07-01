package com.youlai.boot.system.model.vo;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * 设备视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Getter
@Setter
@Schema( description = "设备视图对象")
public class TDeviceVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "设备编号")
    private String deviceNo;
    @Schema(description = "设备名称")
    private String deviceName;
    @Schema(description = "全网编号")
    private String entireNo;
    @Schema(description = "楼层名称")
    private String floorName;
    @Schema(description = "楼层ID")
    private Long floorId;
    @Schema(description = "所属楼栋ID")
    private Long buildingId;
    @Schema(description = "所属楼栋名称")
    private String buildingName;
    @Schema(description = "所属监狱ID")
    private Long prisonId;
    @Schema(description = "所属监狱名称")
    private String prisonName;
    @Schema(description = "电源开关（0-开 1-关）")
    private Integer powerOff;
    @Schema(description = "功率配置")
    private Integer powerConfig;
    @Schema(description = "IP地址")
    private String ipAddress;
    @Schema(description = "端口号")
    private Integer port;
    @Schema(description = "创建人ID")
    private Long createBy;
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
    @Schema(description = "修改人ID")
    private Long updateBy;
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
    @Schema(description = "逻辑删除标识(1-已删除 0-未删除)")
    private Integer isDeleted;
    @Schema(description = "设备运行参数")
    private String parameters;
    @Schema(description = "开始时间")
    private String startTime;
    @Schema(description = "结束时间")
    private String endTime;
    @Schema(description = "X轴")
    private String positionX;
    @Schema(description = "Y轴")
    private String positionY;

    @Schema(description = "电压")
    private String voltage          ;
    @Schema(description = "电流")
    private String electric_current ;

    @Schema(description = "射频")
    private String radio_frequency  ;

    private String ch1;
    private String ch2;
    private String ch3;
    private String ch4;
    private String ch5;
    private String ch6;
    private String ch7;
    private String ch8;
    private String ch9;
    private String ch10;
    private String ch11;
    private String ch12;
    private String ch13;
    private String ch14;
    private String ch15;
    private String ch16;
    private String ch17;
    private String ch18;

}
