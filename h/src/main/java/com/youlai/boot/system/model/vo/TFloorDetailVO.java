package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;

/**
 * 楼层视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Getter
@Setter
@Schema( description = "楼层视图对象")
public class TFloorDetailVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "楼层名称")
    private String floorName;
    @Schema(description = "楼层编号")
    private String floorNo;
    @Schema(description = "楼层平面图纸（PDF DWG CAD 5MB以内）")
    private String floorDrawing;
}
