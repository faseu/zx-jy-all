package com.youlai.boot.system.model.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
@Schema(description = "操作日志分页VO")
public class OperLogPageVO implements Serializable {

    @Schema(description = "主键")
    private Long id;

    @Schema(description = "操作员账号名")
    private String createBy;

    @Schema(description = "登录时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date loginTime;

    @Schema(description = "操作时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date operateTime;

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

    @Schema(description = "省份ID")
    private Long provinceId;

    @Schema(description = "监狱ID")
    private Long prisonId;

    @Schema(description = "监狱级别")
    private Integer prisonLevel;

    @Schema(description = "页面路径")
    private String path;

    @Schema(description = "请求方法")
    private String requestMethod;

    @Schema(description = "请求参数")
    private String params;
}
