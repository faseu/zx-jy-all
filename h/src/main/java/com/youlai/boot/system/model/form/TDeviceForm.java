package com.youlai.boot.system.model.form;

import java.io.Serial;
import java.io.Serializable;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

/**
 * 设备表单对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Getter
@Setter
@Schema(description = "设备表单对象")
public class TDeviceForm implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;

    @Schema(description = "设备编号")
    @NotBlank(message = "设备编号不能为空")
    @Size(max=100, message="设备编号长度不能超过100个字符")
    private String deviceNo;

    @Schema(description = "设备名称")
    @NotBlank(message = "设备名称不能为空")
    @Size(max=100, message="设备名称长度不能超过100个字符")
    private String deviceName;

    @Schema(description = "全网编号")
    @NotBlank(message = "全网编号不能为空")
    @Size(max=100, message="全网编号长度不能超过100个字符")
    private String entireNo;

    @Schema(description = "楼层名称")
    @Size(max=100, message="楼层名称长度不能超过100个字符")
    private String floorName;

    @Schema(description = "楼层编号数")
    private Integer floorId;

    @Schema(description = "所属楼栋ID")
    private Long buildingId;

    @Schema(description = "所属楼栋名称")
    @Size(max=100, message="所属楼栋名称长度不能超过100个字符")
    private String buildingName;

    @Schema(description = "所属监狱ID")
    private Long prisonId;

    @Schema(description = "所属监狱名称")
    @Size(max=100, message="所属监狱名称长度不能超过100个字符")
    private String prisonName;

    @Schema(description = "电源开关（0-开 1-关）")
    private Integer powerOff;

    @Schema(description = "功率配置")
    private Integer powerConfig;

    @Schema(description = "IP地址")
    @Size(max=100, message="IP地址长度不能超过100个字符")
    private String ipAddress;

    @Schema(description = "端口号")
    private Integer port;

    @Schema(description = "创建人ID")
    private Long createBy;

    @Schema(description = "创建时间")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @Schema(description = "修改人ID")
    private Long updateBy;

    @Schema(description = "更新时间")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    @Schema(description = "逻辑删除标识(1-已删除 0-未删除)")
    private Integer isDeleted;

    @Schema(description = "设备运行参数")
    private String parameters;

    @Schema(description = "开始时间")
    @Size(max=100, message="开始时间长度不能超过100个字符")
    private String startTime;

    @Schema(description = "结束时间")
    @Size(max=100, message="结束时间长度不能超过100个字符")
    private String endTime;

    private String positionX;

    private String positionY;

    private String voltage          ;
    private String electric_current ;
    private String radio_frequency  ;
    private String ch1              ;
    private String ch2              ;
    private String ch3              ;
    private String ch4              ;
    private String ch5              ;
    private String ch6              ;
    private String ch7              ;
    private String ch8              ;
    private String ch9              ;
    private String ch10             ;
    private String ch11             ;
    private String ch12             ;
    private String ch13             ;
    private String ch14             ;
    private String ch15             ;
    private String ch16             ;
    private String ch17             ;
    private String ch18             ;

}
