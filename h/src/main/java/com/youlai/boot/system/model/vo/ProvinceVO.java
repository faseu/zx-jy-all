package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "省份视图对象")
@Data
public class ProvinceVO {

    @Schema(description = "省份ID")
    private Long provinceId;

    @Schema(description = "省份名称")
    private String provinceName;

    @Schema(description = "总监狱")
    private Integer totalPrisons;

    @Schema(description = "总干扰机")
    private Integer totalDevices;

}
