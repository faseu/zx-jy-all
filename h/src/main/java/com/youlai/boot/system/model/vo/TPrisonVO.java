package com.youlai.boot.system.model.vo;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * 监狱视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Getter
@Setter
@Schema( description = "监狱视图对象")
public class TPrisonVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "监狱名称")
    private String name;
    @Schema(description = "监室数量")
    private Integer roomNumber;
    @Schema(description = "授权人员列表")
    private String authUsers;
    @Schema(description = "监狱等级（1-宽管监狱 2-普管监狱 3-严管监狱)")
    private Integer level;
    @Schema(description = "所属省份id")
    private Long deptId;
    @Schema(description = "所属省份")
    private String deptName;
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
