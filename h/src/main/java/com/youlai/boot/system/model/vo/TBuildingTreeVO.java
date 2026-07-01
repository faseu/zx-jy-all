package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 设备视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Getter
@Setter
@Schema( description = "楼栋树视图对象")
public class TBuildingTreeVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "楼栋ID")
    private Long buildingId;
    @Schema(description = "楼栋名称")
    private String buildingName;
    @Schema(description = "楼栋的楼层")
    private List<TFloorTreeVO> floorList;

}
