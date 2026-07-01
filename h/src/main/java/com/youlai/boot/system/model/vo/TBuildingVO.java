package com.youlai.boot.system.model.vo;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * 楼栋视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Getter
@Setter
@Schema( description = "楼栋视图对象")
public class TBuildingVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "楼名称")
    private String name;
    @Schema(description = "楼层数")
    private Integer floorNum;
    @Schema(description = "所属监狱ID")
    private Long prisonId;
    @Schema(description = "所属监狱名称")
    private String prisonName;
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
    @Schema(description = "地上楼层")
    private Integer groundFloorNum;
    @Schema(description = "地下楼层")
    private Integer undergroundFloorNum;
}
