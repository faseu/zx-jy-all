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
 * 楼栋表单对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Getter
@Setter
@Schema(description = "楼栋表单对象")
public class TBuildingForm implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;

    @Schema(description = "楼名称")
    @NotBlank(message = "楼名称不能为空")
    @Size(max=100, message="楼名称长度不能超过100个字符")
    private String name;

    @Schema(description = "楼层数")
    @PositiveOrZero(message = "楼层数不能为空并大于0")
    private Integer floorNum;

    @Schema(description = "所属监狱ID")
    private Long prisonId;

    @Schema(description = "所属监狱名称")
    @Size(max=100, message="所属监狱名称长度不能超过100个字符")
    private String prisonName;

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

    @Schema(description = "地上楼层数")
    @PositiveOrZero(message = "地上楼层数不能为空并大于0")
    private Integer groundFloorNum;

    @Schema(description = "地下楼层数")
    private Integer undergroundFloorNum;

}
