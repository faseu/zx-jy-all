package com.youlai.boot.system.model.vo;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * 楼层视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Getter
@Setter
@Schema( description = "楼层视图对象")
public class TFloorVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "楼层名称")
    private String floorName;
    @Schema(description = "楼层编号数")
    private Integer floorNo;
    @Schema(description = "所属楼栋ID")
    private Long buildingId;
    @Schema(description = "所属楼栋名称")
    private String buildingName;
    @Schema(description = "设备数量")
    private Integer deviceNumber;
    @Schema(description = "楼层平面图纸（PDF DWG CAD 5MB以内）")
    private String floorDrawing;
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
}
