package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "省份详情视图对象")
@Data
public class ProvinceDetailVO {

    @Schema(description = "省份ID")
    private Long provinceId;

    @Schema(description = "省份名称")
    private String provinceName;

    @Schema(description = "监狱数")
    private Integer totalPrisons;

    @Schema(description = "设备数")
    private Integer totalDevices;

    @Schema(description = "在线数")
    private Integer onlineDevices;

    @Schema(description = "离线数")
    private Integer offlineDevices;

    @Schema(description = "告警数")
    private Integer totalAlarms;



}
