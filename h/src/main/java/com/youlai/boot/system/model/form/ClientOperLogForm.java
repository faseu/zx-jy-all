package com.youlai.boot.system.model.form;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "客户端操作日志表单")
public class ClientOperLogForm {

    @NotBlank(message = "操作内容不能为空")
    @Schema(description = "操作内容")
    private String content;

    @Schema(description = "动作编码")
    private String actionCode;

    @Schema(description = "模块编码")
    private String moduleCode;

    @Schema(description = "目标类型")
    private String targetType;

    @Schema(description = "目标ID")
    private String targetId;

    @Schema(description = "目标名称")
    private String targetName;

    @Schema(description = "页面路径")
    private String path;

    @Schema(description = "省份ID")
    private Long provinceId;

    @Schema(description = "监狱ID")
    private Long prisonId;

    @Schema(description = "监狱级别")
    private Integer prisonLevel;
}
