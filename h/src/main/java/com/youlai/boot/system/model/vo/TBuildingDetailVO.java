package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;

/**
 * 楼栋视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Getter
@Setter
@Schema( description = "楼栋视图对象")
public class TBuildingDetailVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "楼栋名称")
    private String name;
    @Schema(description = "层数")
    private Integer floorNum;
    private Integer groundFloorNum;
    private Integer undergroundFloorNum;
    @Schema(description = "设备数")
    private Integer totalDevices;
}
