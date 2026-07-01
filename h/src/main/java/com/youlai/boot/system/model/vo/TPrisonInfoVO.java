package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;

/**
 * 监狱视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Getter
@Setter
@Schema( description = "监狱视图对象")
public class TPrisonInfoVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "监狱名称")
    private String name;

    @Schema(description = "监狱楼数")
    private Integer buildingNum;

    @Schema(description = "设备数")
    private Integer totalDevices;

    @Schema(description = "在线数")
    private Integer onlineDevices;

    @Schema(description = "离线数")
    private Integer offlineDevices;

    @Schema(description = "告警数")
    private Integer totalAlarms;
}
