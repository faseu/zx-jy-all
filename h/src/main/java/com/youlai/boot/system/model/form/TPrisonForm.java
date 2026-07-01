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
 * 监狱表单对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Getter
@Setter
@Schema(description = "监狱表单对象")
public class TPrisonForm implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;

    @Schema(description = "监狱名称")
    @NotBlank(message = "监狱名称不能为空")
    @Size(max=100, message="监狱名称长度不能超过100个字符")
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
    @Size(max=200, message="所属省份长度不能超过200个字符")
    private String deptName;

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


}
